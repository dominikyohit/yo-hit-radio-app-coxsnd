import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { desc, eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { parseStringPromise } from 'xml2js';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  published_date: string;
  author: string;
  created_at: string;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + '...';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

async function fetchAndParseRssFeed(logger: any): Promise<Article[]> {
  try {
    const response = await fetch('https://yohitradio.com/category/news/feed/');
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const parsed = await parseStringPromise(xmlText);

    const items = parsed.rss?.channel?.[0]?.item || [];

    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const articles: Article[] = items
      .map((item: any) => {
        try {
          const title = item.title?.[0] || '';
          const description = item.description?.[0] || '';
          const pubDate = item.pubDate?.[0] || new Date().toISOString();
          const guid = item.guid?.[0]?._?.toString() || item.guid?.[0] || '';
          const dcCreator = item['dc:creator']?.[0] || 'Yo Hit Radio';

          // Extract featured image URL from media:content or enclosure
          let featuredImageUrl: string | null = null;
          const mediaContent = item['media:content'];
          if (mediaContent && Array.isArray(mediaContent) && mediaContent.length > 0) {
            featuredImageUrl = mediaContent[0]?.$?.url || null;
          }
          if (!featuredImageUrl && item.enclosure) {
            const enclosure = Array.isArray(item.enclosure)
              ? item.enclosure[0]
              : item.enclosure;
            featuredImageUrl = enclosure?.$?.url || null;
          }

          // Parse pubDate to ISO string
          let publishedDate: string;
          try {
            publishedDate = new Date(pubDate).toISOString();
          } catch {
            publishedDate = new Date().toISOString();
          }

          // Strip HTML from description for excerpt
          const plainTextDescription = stripHtml(description);
          const excerpt = truncateText(plainTextDescription, 150);

          return {
            id: guid || title,
            title,
            excerpt,
            content: description,
            featured_image_url: featuredImageUrl,
            published_date: publishedDate,
            author: dcCreator,
            created_at: publishedDate,
          };
        } catch (error) {
          logger.warn('Error parsing RSS item:', error);
          return null;
        }
      })
      .filter((article): article is Article => article !== null)
      .sort(
        (a, b) =>
          new Date(b.published_date).getTime() -
          new Date(a.published_date).getTime()
      );

    return articles;
  } catch (error) {
    logger.error('Error fetching/parsing RSS feed:', error);
    throw error;
  }
}

export function registerArticlesRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/articles - list all articles from RSS feed (sorted by date, newest first)
  app.fastify.get(
    '/api/articles',
    {
      schema: {
        description: 'Get all articles from WordPress RSS feed sorted by published date (newest first)',
        tags: ['articles'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                excerpt: { type: 'string' },
                content: { type: 'string' },
                featured_image_url: { type: ['string', 'null'] },
                published_date: { type: 'string' },
                author: { type: 'string' },
                created_at: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async () => {
      try {
        const articles = await fetchAndParseRssFeed(app.logger);
        return articles;
      } catch (error) {
        app.logger.error('Error in GET /api/articles');
        throw new Error('Failed to fetch articles from RSS feed');
      }
    }
  );

  // GET /api/articles/:id - get single article details
  app.fastify.get(
    '/api/articles/:id',
    {
      schema: {
        description: 'Get a single article by ID',
        tags: ['articles'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              excerpt: { type: 'string' },
              content: { type: 'string' },
              featured_image_url: { type: ['string', 'null'] },
              published_date: { type: 'string' },
              author: { type: 'string' },
              created_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest) => {
      const { id } = request.params as { id: string };
      const article = await app.db.query.articles.findFirst({
        where: eq(schema.articles.id, id),
      });
      if (!article) {
        throw new Error('Article not found');
      }
      return article;
    }
  );

  // POST /api/articles - create new article (admin only)
  app.fastify.post(
    '/api/articles',
    {
      schema: {
        description: 'Create a new article (admin only)',
        tags: ['articles'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            excerpt: { type: 'string' },
            content: { type: 'string' },
            featured_image_url: { type: 'string' },
            published_date: { type: 'string' },
            author: { type: 'string' },
          },
          required: [
            'title',
            'excerpt',
            'content',
            'published_date',
            'author',
          ],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              excerpt: { type: 'string' },
              content: { type: 'string' },
              featured_image_url: { type: ['string', 'null'] },
              published_date: { type: 'string' },
              author: { type: 'string' },
              created_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<any | void> => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const {
        title,
        excerpt,
        content,
        featured_image_url,
        published_date,
        author,
      } = request.body as {
        title: string;
        excerpt: string;
        content: string;
        featured_image_url?: string;
        published_date: string;
        author: string;
      };

      const [article] = await app.db
        .insert(schema.articles)
        .values({
          title,
          excerpt,
          content,
          featured_image_url: featured_image_url || null,
          published_date: new Date(published_date),
          author,
        })
        .returning();

      reply.statusCode = 201;
      return article;
    }
  );
}
