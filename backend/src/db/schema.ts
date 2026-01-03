import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  featured_image_url: text('featured_image_url'),
  published_date: timestamp('published_date').notNull(),
  author: text('author').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const songs = pgTable('songs', {
  id: uuid('id').primaryKey().defaultRandom(),
  rank: integer('rank').notNull(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  cover_image_url: text('cover_image_url'),
  vote_count: integer('vote_count').default(0).notNull(),
  week_start_date: timestamp('week_start_date').notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  flyer_image_url: text('flyer_image_url'),
  event_date: timestamp('event_date').notNull(),
  location: text('location').notNull(),
  ticket_url: text('ticket_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
