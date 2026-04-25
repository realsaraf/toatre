/**
 * Shared TypeScript types for Toatre.
 * Mirror of mobile Dart models — keep in sync manually.
 */
import { ObjectId } from "mongodb";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type ToatKind =
  | "task"
  | "event"
  | "meeting"
  | "idea"
  | "errand"
  | "deadline";

export type ToatTier = "urgent" | "important" | "regular";

export type ToatStatus =
  | "active"
  | "snoozed"
  | "done"
  | "cancelled"
  | "archived";

export type CaptureSource =
  | "mic"
  | "manual"
  | "share_sheet"
  | "email"
  | "screenshot";

export type PingChannel = "local" | "push" | "email" | "sms" | "critical_alert";

export type ShareRole = "view" | "edit";

// ─── MongoDB document types ───────────────────────────────────────────────────

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
  userId: string;           // Mongo _id string of the owner
  captureId: string | null;
  kind: ToatKind;
  tier: ToatTier;
  status: ToatStatus;
  title: string;
  note: string | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
  kindData: Record<string, unknown>;
  people: string[];         // Mongo _id strings of Person docs
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
  userId: string;           // owner
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
  granteeId: string | null; // null = public
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
  dueAt: Date;
  sentAt: Date | null;
  createdAt: Date;
}

export interface UserSettingsDoc {
  _id: ObjectId;
  userId: string;
  timezone: string;
  voiceRetention: boolean;
  smsEnabled: boolean;
  reminderPhone: string | null;
  workStart: string;        // "HH:MM" in user's timezone
  workEnd: string;
  updatedAt: Date;
}

// ─── API response types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ExtractionResult {
  toats: Array<{
    kind: ToatKind;
    tier: ToatTier;
    title: string;
    note: string | null;
    scheduledAt: string | null; // ISO 8601
    kindData: Record<string, unknown>;
    people: string[];
  }>;
  confidence: number;
  rawTranscript: string;
}
