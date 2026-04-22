/**
 * Drizzle schema for Plotto (Phase 1 data model — matches PLAN.md §5).
 *
 * Every user-scoped table has `user_id` + RLS policy `user_id = auth.uid()`.
 * RLS DDL lives in a companion SQL migration (see supabase/migrations).
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// ─── enums ──────────────────────────────────────────────────────────────────
export const importanceEnum = pgEnum('plotto_importance', [
  'ambient',
  'soft_block',
  'hard_block',
]);

export const reminderStrategyEnum = pgEnum('plotto_reminder_strategy', [
  'silent',
  'standard',
  'critical',
]);

export const eventStatusEnum = pgEnum('plotto_event_status', [
  'active',
  'snoozed',
  'done',
  'cancelled',
]);

export const captureSourceEnum = pgEnum('plotto_capture_source', [
  'share_sheet',
  'voice',
  'manual',
  'email',
  'screenshot',
]);

export const reminderChannelEnum = pgEnum('plotto_reminder_channel', [
  'local_notification',
  'push',
  'alarm',
]);

// ─── tables ─────────────────────────────────────────────────────────────────
// `users` mirrors Supabase `auth.users` — we keep a profile row per user
// so we can store app-specific fields (timezone) and reference it safely.
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // mirrors auth.uid()
  email: text('email').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  workSchedule: jsonb('work_schedule'),
  phone: text('phone'),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  emailRemindersEnabled: boolean('email_reminders_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const captures = pgTable('captures', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  rawContent: text('raw_content').notNull(),
  source: captureSourceEnum('source').notNull(),
  mediaUrl: text('media_url'),
  llmInput: jsonb('llm_input'),
  llmOutput: jsonb('llm_output'),
  llmModel: text('llm_model'),
  llmCostCents: integer('llm_cost_cents'),
  processed: boolean('processed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const events = pgTable('events', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  location: text('location'),
  allDay: boolean('all_day').notNull().default(false),
  recurrenceRule: text('recurrence_rule'),
  importance: importanceEnum('importance').notNull().default('soft_block'),
  reminderStrategy: reminderStrategyEnum('reminder_strategy')
    .notNull()
    .default('standard'),
  confidence: doublePrecision('confidence'),
  sourceCaptureId: uuid('source_capture_id').references(() => captures.id, {
    onDelete: 'set null',
  }),
  parentEventId: uuid('parent_event_id'),
  status: eventStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const reminders = pgTable('reminders', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  firesAt: timestamp('fires_at', { withTimezone: true }).notNull(),
  channel: reminderChannelEnum('channel').notNull().default('local_notification'),
  fired: boolean('fired').notNull().default(false),
});

// ─── inferred types ─────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Capture = typeof captures.$inferSelect;
export type NewCapture = typeof captures.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
