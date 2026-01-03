import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerTop10Routes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/top10 - get current week's top 10 songs
  app.fastify.get(
    '/api/top10',
    {
      schema: {
        description: 'Get current week\'s top 10 songs sorted by rank',
        tags: ['top10'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                rank: { type: 'integer' },
                title: { type: 'string' },
                artist: { type: 'string' },
                cover_image_url: { type: ['string', 'null'] },
                vote_count: { type: 'integer' },
                week_start_date: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async () => {
      // Get current week's songs sorted by rank
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      return app.db
        .select()
        .from(schema.songs)
        .where(eq(schema.songs.week_start_date, weekStart))
        .orderBy(schema.songs.rank);
    }
  );

  // POST /api/top10/:id/vote - increment vote count for a song (public voting)
  app.fastify.post(
    '/api/top10/:id/vote',
    {
      schema: {
        description: 'Vote for a song (increment vote count)',
        tags: ['top10'],
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
              rank: { type: 'integer' },
              title: { type: 'string' },
              artist: { type: 'string' },
              cover_image_url: { type: ['string', 'null'] },
              vote_count: { type: 'integer' },
              week_start_date: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest) => {
      const { id } = request.params as { id: string };

      // Get the song first
      const song = await app.db.query.songs.findFirst({
        where: eq(schema.songs.id, id),
      });

      if (!song) {
        throw new Error('Song not found');
      }

      // Increment vote count
      const [updated] = await app.db
        .update(schema.songs)
        .set({
          vote_count: song.vote_count + 1,
        })
        .where(eq(schema.songs.id, id))
        .returning();

      return updated;
    }
  );
}
