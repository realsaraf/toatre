import { ObjectId } from "mongodb";
import type { ToatTier, ToatState, CaptureSource, PingChannel, ShareRole, Enrichments } from "./enrichments";

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

export interface ToatAttachment {
  id: string;       // crypto.randomUUID()
  key: string;      // DO Spaces object key
  label: string;    // AI-generated short label
  mimeType: string;
  size: number;     // bytes
  createdAt: Date;
}

export interface SerializedAttachment {
  id: string;
  label: string;
  mimeType: string;
  size: number;
  createdAt: string; // ISO
}

export interface ToatLink {
  id: string;    // crypto.randomUUID()
  url: string;
  label: string; // user-provided or auto-derived from URL hostname
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  createdAt: Date;
}

export interface SerializedLink {
  id: string;
  url: string;
  label: string;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  createdAt: string; // ISO
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
  attachments?: ToatAttachment[];
  links?: ToatLink[];
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

// Booking (Toat Link)

export type BookingSlotLength = 15 | 30 | 45 | 60;
export type BookingRequestState = "pending" | "accepted" | "denied";

export interface BookingSettingsDoc {
  _id: ObjectId;
  userId: string;
  enabled: boolean;
  greetingMessage: string;
  pageTitle: string;
  metaDescription: string;
  windowDays: number[];        // 0=Sun, 6=Sat
  windowStart: string;         // "HH:mm"
  windowEnd: string;           // "HH:mm"
  slotLength: BookingSlotLength;
  bufferMinutes: number;
  advanceNoticeMinutes: number;
  maxDaysAhead: number;
  requireReason: boolean;
  disableDuringOfficeHours: boolean;
  timezone: string;
  updatedAt: Date;
}

export interface BookingRequestDoc {
  _id: ObjectId;
  ownerId: ObjectId;
  toatId: string | null;
  slotStart: Date;
  slotEnd: Date;
  name: string;
  email: string;
  phone: string | null;
  bookerHandle: string | null;
  bookerUserId: string | null;
  message: string | null;
  state: BookingRequestState;
  createdAt: Date;
  updatedAt: Date;
}

export interface SerializedBookingRequest {
  id: string;
  slotStart: string;
  slotEnd: string;
  name: string;
  email: string;
  phone: string | null;
  bookerHandle: string | null;
  message: string | null;
  state: BookingRequestState;
  createdAt: string;
}

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
  attachments?: SerializedAttachment[];
  links?: SerializedLink[];
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
