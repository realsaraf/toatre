/**
 * Shared TypeScript types for Toatre.
 * Mirror of mobile Dart models â€” keep in sync manually.
 *
 * Design philosophy: A Toat is a simple captured unit of intent or awareness.
 * Structure is added progressively via optional enrichment blocks.
 */

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
  endAt?: string | null;        // ISO 8601 — end of a range
  dueAt?: string | null;        // ISO 8601 — deadline
  reminderAt?: string | null;   // ISO 8601 — when to Ping (absolute)
  reminderOffset?: number | null; // minutes before primaryDateTime to Ping (positive = before)
  recurrence?: string | null;   // RRULE or plain description
  duration?: number | null;     // minutes; default 60 when time is set
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
