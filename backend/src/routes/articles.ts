import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerArticlesRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/articles - list all articles from WordPress REST API
  app.fastify.get(
    '/api/articles',
    {
      schema: {
        description: 'Get all articles from WordPress REST API with embedded featured media',
        tags: ['articles'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
      },
    },
    async () => {
      try {
        const response = await fetch(
          'https://yohitradio.com/wp-json/wp/v2/posts?_embed&per_page=10'
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch articles: ${response.statusText}`);
        }

        const articles = await response.json();
        return articles;
      } catch (error) {
        app.logger.error('Error in GET /api/articles');
        throw new Error('Failed to fetch articles');
      }
    }
  );

  // GET /api/articles/:id - get single article details
  app.fastify.get(
    '/api/articles/:id',
    {
      schema: {
        description: 'Get a single article by ID from WordPress REST API with embedded featured media',
        tags: ['articles'],
        params: {
          type: 'object',
          properties: {
            id: { type: ['string', 'number'] },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest) => {
      try {
        const { id } = request.params as { id: string | number };
        const response = await fetch(
          `https://yohitradio.com/wp-json/wp/v2/posts/${id}?_embed`
        );
        if (!response.ok) {
          throw new Error(`Article not found`);
        }

        const article = await response.json();
        return article;
      } catch (error) {
        app.logger.error('Error in GET /api/articles/:id');
        throw new Error('Failed to fetch article');
      }
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
