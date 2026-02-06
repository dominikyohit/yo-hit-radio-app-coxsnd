import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { desc, eq, gte } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerEventsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/events - list all upcoming events (sorted by date)
  app.fastify.get(
    '/api/events',
    {
      schema: {
        description: 'Get all upcoming events sorted by date',
        tags: ['events'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                flyer_image_url: { type: ['string', 'null'] },
                event_date: { type: 'string' },
                location: { type: 'string' },
                ticket_url: { type: ['string', 'null'] },
                created_at: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async () => {
      const now = new Date();
      return app.db
        .select()
        .from(schema.events)
        .where(gte(schema.events.event_date, now))
        .orderBy(schema.events.event_date);
    }
  );

  // GET /api/events/:id - get single event details
  app.fastify.get(
    '/api/events/:id',
    {
      schema: {
        description: 'Get a single event by ID',
        tags: ['events'],
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
              description: { type: 'string' },
              flyer_image_url: { type: ['string', 'null'] },
              event_date: { type: 'string' },
              location: { type: 'string' },
              ticket_url: { type: ['string', 'null'] },
              created_at: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest) => {
      const { id } = request.params as { id: string };
      const event = await app.db.query.events.findFirst({
        where: eq(schema.events.id, id),
      });
      if (!event) {
        throw new Error('Event not found');
      }
      return event;
    }
  );

  // POST /api/events - create new event (admin only)
  app.fastify.post(
    '/api/events',
    {
      schema: {
        description: 'Create a new event (admin only)',
        tags: ['events'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            flyer_image_url: { type: 'string' },
            event_date: { type: 'string' },
            location: { type: 'string' },
            ticket_url: { type: 'string' },
          },
          required: ['title', 'description', 'event_date', 'location'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              flyer_image_url: { type: ['string', 'null'] },
              event_date: { type: 'string' },
              location: { type: 'string' },
              ticket_url: { type: ['string', 'null'] },
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
        description,
        flyer_image_url,
        event_date,
        location,
        ticket_url,
      } = request.body as {
        title: string;
        description: string;
        flyer_image_url?: string;
        event_date: string;
        location: string;
        ticket_url?: string;
      };

      const [event] = await app.db
        .insert(schema.events)
        .values({
          title,
          description,
          flyer_image_url: flyer_image_url || null,
          event_date: new Date(event_date),
          location,
          ticket_url: ticket_url || null,
        })
        .returning();

      reply.statusCode = 201;
      return event;
    }
  );
}
