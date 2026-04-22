import { z } from 'zod';

/**
 * Event importance tiers.
 * - ambient: just-know; no notification
 * - soft_block: standard notification
 * - hard_block: critical, multi-stage alarm
 */
export const ImportanceSchema = z.enum(['ambient', 'soft_block', 'hard_block']);
export type Importance = z.infer<typeof ImportanceSchema>;

export const ReminderStrategySchema = z.enum(['silent', 'standard', 'critical']);
export type ReminderStrategy = z.infer<typeof ReminderStrategySchema>;

export const EventStatusSchema = z.enum(['active', 'snoozed', 'done', 'cancelled']);
export type EventStatus = z.infer<typeof EventStatusSchema>;

/**
 * Canonical Event as stored in Postgres.
 */
export const EventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().nullable(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable(),
  location: z.string().nullable(),
  allDay: z.boolean(),
  recurrenceRule: z.string().nullable(),
  importance: ImportanceSchema,
  reminderStrategy: ReminderStrategySchema,
  confidence: z.number().min(0).max(1),
  sourceCaptureId: z.string().uuid().nullable(),
  parentEventId: z.string().uuid().nullable(),
  status: EventStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type Event = z.infer<typeof EventSchema>;

/**
 * LLM extraction output — what Claude returns before we persist.
 * Stricter than full Event (no ids/timestamps yet).
 */
export const ExtractedEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().nullable().default(null),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable().default(null),
  location: z.string().nullable().default(null),
  allDay: z.boolean().default(false),
  recurrenceRule: z.string().nullable().default(null),
  importance: ImportanceSchema.default('soft_block'),
  reminderStrategy: ReminderStrategySchema.default('standard'),
  confidence: z.number().min(0).max(1),
  clarifyingQuestion: z.string().nullable().default(null),
});
export type ExtractedEvent = z.infer<typeof ExtractedEventSchema>;
