/**
 * Shared TypeScript types for Toatre.
 * Mirror of mobile Dart models â€” keep in sync manually.
 *
 * Design philosophy: A Toat is a simple captured unit of intent or awareness.
 * Structure is added progressively via optional enrichment blocks.
 */
import { ObjectId } from "mongodb";

// â”€â”€â”€ Core enums â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Urgency / priority. */
export type ToatTier = "urgent" | "important" | "regular";

/** Lifecycle state. Replaces the legacy `status` field. */
export type ToatState = "open" | "done" | "archived";

export type CaptureSource =
  | "mic"
  | "manual"
  | "share_sheet"
  | "email"
  | "screenshot";

export type PingChannel = "local" | "push" | "email" | "sms" | "critical_alert";

export type ShareRole = "view" | "edit";

// â”€â”€â”€ Enrichments (all optional, added progressively) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface TimeEnrichment {
  at?: string | null;           // ISO 8601 â€” primary moment
  startAt?: string | null;      // ISO 8601 â€” start of a range
  endAt?: string | null;        // ISO 8601 â€” end of a range
  dueAt?: string | null;        // ISO 8601 â€” deadline
  reminderAt?: string | null;   // ISO 8601 â€” when to Ping
  recurrence?: string | null;   // RRULE or plain description
}

export interface PlaceEnrichment {
  placeName?: string | null;    // human name ("Starbucks", "Dr Smith's Office")
  address?: string | null;      // full address or coords
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ActionEnrichment {
  type: "task" | "checklist" | "errand";
  checklist?: ChecklistItem[];
  completedAt?: string | null;
}

export interface CommunicationEnrichment {
  contact?: string | null;      // person's name
  phone?: string | null;        // E.164 or human-readable
  email?: string | null;
  channel?: "call" | "message" | "email" | null;
  joinUrl?: string | null;      // Zoom/Meet/Teams URL
  message?: string | null;      // specific text to convey
}

export interface EventEnrichment {
  eventKind?: "social" | "family" | "work" | "public" | "other" | null;
  host?: string | null;
  guests?: string[];
  rsvpStatus?: "going" | "maybe" | "declined" | null;
  venueName?: string | null;
  address?: string | null;      // event venue address
  ticketUrl?: string | null;
}

export interface MoneyEnrichment {
  amount?: number | null;
  currency?: string | null;     // ISO 4217 ("USD")
  merchant?: string | null;
  category?: string | null;
}

export interface ThoughtEnrichment {
  type?: "idea" | "note" | "decision" | "memory" | null;
  content?: string | null;
  revisitAt?: string | null;    // ISO 8601
  tags?: string[];
}

/** All enrichments. Every block is optional. */
export interface Enrichments {
  time?: TimeEnrichment;
  people?: string[];
  place?: PlaceEnrichment;
  action?: ActionEnrichment;
  communication?: CommunicationEnrichment;
  event?: EventEnrichment;
  money?: MoneyEnrichment;
  thought?: ThoughtEnrichment;
}

// â”€â”€â”€ MongoDB document types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface UserDoc {
  _id: ObjectId;
  firebaseUid: string;
  email: string | null;
  handle: string | null;
  displayName: string | null;
  photoUrl: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToatDoc {
  _id: ObjectId;
  ownerId: ObjectId;
  captureId: ObjectId | null;
  tier: ToatTier;
  state: ToatState;
  title: string;
  notes: string | null;
  enrichments: Enrichments;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaptureDoc {
  _id: ObjectId;
  userId: string;
  source: CaptureSource;
  rawText: string | null;
  audioUrl: string | null;
  llmInput: string | null;
  llmOutput: string | null;
  toatIds: string[];
  createdAt: Date;
}

export interface PersonDoc {
  _id: ObjectId;
  userId: string;
  handle: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AclDoc {
  _id: ObjectId;
  toatId: string;
  ownerId: string;
  granteeId: string | null;
  role: ShareRole;
  token: string;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface ReminderDoc {
  _id: ObjectId;
  userId: string;
  toatId: string;
  channel: PingChannel;
  kind?: string;
  momentKey?: string;
  title?: string;
  body?: string;
  payload?: string;
  dueAt: Date;
  lockedAt?: Date | null;
  lastAttemptAt?: Date | null;
  lastError?: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DeviceTokenDoc {
  _id: ObjectId;
  userId: string;
  token: string;
  platform: "ios" | "android" | "web";
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettingsDoc {
  _id: ObjectId;
  userId: string;
  timezone: string;
  voiceRetention: boolean;
  smsEnabled: boolean;
  reminderPhone: string | null;
  pendingPhone?: string | null;
  phoneVerifiedAt?: Date | string | null;
  workStart: string;
  workEnd: string;
  notificationPreferences?: Record<string, {
    push: boolean;
    email: boolean;
    sms: boolean;
  }>;
  updatedAt: Date;
}

// â”€â”€â”€ API response types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Shape returned by /api/toats and /api/captures â€” all dates as ISO strings. */
export interface SerializedToat {
  id: string;
  tier: ToatTier;
  state: ToatState;
  title: string;
  notes: string | null;
  enrichments: Enrichments;
  captureId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractionResult {
  toats: Array<{
    tier: ToatTier;
    title: string;
    notes: string | null;
    enrichments: Enrichments;
  }>;
}

// â”€â”€â”€ Migration helper: convert legacy templateData â†’ Enrichments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Used by the API serializer to normalise old MongoDB documents on read.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateTemplateData(doc: any): Enrichments {
  const template: string = doc.template ?? "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const td: Record<string, any> = doc.templateData ?? {};
  const enrichments: Enrichments = {};

  // Carry over top-level convenience fields
  if (doc.datetime || doc.endDatetime) {
    enrichments.time = {
      at: doc.datetime ? new Date(doc.datetime).toISOString() : null,
      endAt: doc.endDatetime ? new Date(doc.endDatetime).toISOString() : null,
    };
  }
  if (doc.location) {
    enrichments.place = { address: doc.location };
  }
  if (doc.people?.length) {
    enrichments.people = doc.people;
  }

  // Template-specific migration
  switch (template) {
    case "meeting":
      enrichments.communication = {
        joinUrl: td.joinUrl ?? null,
        channel: "message",
      };
      if (td.attendees?.length) enrichments.people = [...(enrichments.people ?? []), ...td.attendees];
      if (td.agenda) enrichments.thought = { type: "note", content: td.agenda };
      break;
    case "call":
      enrichments.communication = {
        contact: td.contactName ?? null,
        phone: td.phone ?? null,
        channel: "call",
      };
      break;
    case "appointment":
      enrichments.communication = {
        contact: td.providerName ?? null,
        phone: td.phone ?? null,
      };
      if (td.address) enrichments.place = { address: td.address };
      break;
    case "event":
      enrichments.event = {
        venueName: td.venue ?? null,
        ticketUrl: td.ticketUrl ?? null,
      };
      if (td.doorsAt) {
        enrichments.time = { ...enrichments.time, at: td.doorsAt };
      }
      break;
    case "deadline":
      enrichments.time = { ...enrichments.time, dueAt: td.dueAt ?? null };
      break;
    case "task":
      enrichments.action = { type: "task", completedAt: td.completedAt ?? null };
      break;
    case "checklist":
      enrichments.action = {
        type: "checklist",
        checklist: (td.items ?? []).map((i: { id: string; text: string; done: boolean }) => ({
          id: i.id, text: i.text, done: i.done,
        })),
      };
      break;
    case "errand":
      enrichments.action = { type: "errand" };
      if (td.address || td.storeOrVenue) {
        enrichments.place = {
          placeName: td.storeOrVenue ?? null,
          address: td.address ?? doc.location ?? null,
        };
      }
      break;
    case "follow_up":
      enrichments.communication = {
        contact: td.contactName ?? null,
        phone: td.phone ?? null,
        email: td.email ?? null,
        channel: td.channel ?? null,
      };
      break;
    case "idea":
      enrichments.thought = {
        type: "idea",
        revisitAt: td.revisitAt ?? null,
        tags: td.tags ?? [],
      };
      break;
  }

  return enrichments;
}

/** Map legacy status string → ToatState. */
export function migrateStatus(status: string | undefined): ToatState {
  if (status === "done") return "done";
  if (status === "archived" || status === "cancelled") return "archived";
  return "open";
}
