import type { NotificationPreferences } from "@/lib/settings/defaults";

export type SettingsTab = "profile" | "connections" | "pings" | "sync" | "toatlink";
export type NoticeTone = "idle" | "success" | "error";
export type SyncDirection = "sourceToToatre" | "toatreToSource" | "twoWay";
export type BookingSlotLength = 15 | 30 | 45 | 60;

export interface SyncConnection {
  provider: string;
  direction: SyncDirection;
  connected: boolean;
  connectedAt: string | null;
  forwardOnlyFrom: string | null;
  lastSyncedAt: string | null;
  updatedAt: string | null;
}

export interface SettingsResponse {
  profile: {
    displayName: string | null;
    email: string | null;
    handle: string | null;
    photoUrl: string | null;
  };
  settings: {
    timezone: string;
    voiceRetention: boolean;
    smsEnabled: boolean;
    reminderPhone: string | null;
    pendingPhone: string | null;
    phoneVerified: boolean;
    phoneVerifiedAt: string | null;
    workStart: string;
    workEnd: string;
    notificationPreferences: NotificationPreferences;
    syncConnections: Record<string, SyncConnection>;
  };
}

export interface SavedConnection {
  id: string;
  name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  handle: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionDraft {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  handle: string;
  notes: string;
}

export interface BookingSettingsResponse {
  enabled?: boolean;
  greetingMessage?: string;
  pageTitle?: string;
  metaDescription?: string;
  windowDays?: number[];
  windowStart?: string;
  windowEnd?: string;
  slotLength?: number;
  bufferMinutes?: number;
  advanceNoticeMinutes?: number;
  maxDaysAhead?: number;
  requireReason?: boolean;
  disableDuringOfficeHours?: boolean;
  timezone?: string;
  maxPerDay?: number;
  allowRescheduling?: boolean;
  allowCancellations?: boolean;
  showSuccessMessage?: boolean;
  collectEmailFirst?: boolean;
}

export function normalizeBookingSlotLength(value: number | undefined): BookingSlotLength {
  return value === 15 || value === 45 || value === 60 ? value : 30;
}

export const SETTINGS_TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "profile", label: "General" },
  { id: "connections", label: "Connections" },
  { id: "pings", label: "Pings" },
  { id: "sync", label: "Sync" },
  { id: "toatlink", label: "Toat Link" },
];

export const EMPTY_CONNECTION_DRAFT: ConnectionDraft = {
  name: "",
  relationship: "",
  phone: "",
  email: "",
  handle: "",
  notes: "",
};

export const KIND_LABELS: Record<string, string> = {
  task: "Tasks",
  event: "Events",
  meeting: "Meetings",
  idea: "Ideas",
  errand: "Errands",
  deadline: "Deadlines",
};

export const SYNC_DIRECTION_OPTIONS: Array<{ id: SyncDirection; title: string; body: string }> = [
  {
    id: "sourceToToatre",
    title: "Google to Toatre",
    body: "New Google Calendar entries become Toatre toats.",
  },
  {
    id: "toatreToSource",
    title: "Toatre to Google",
    body: "New scheduled Toatre toats are sent to Google Calendar.",
  },
  {
    id: "twoWay",
    title: "Two-way",
    body: "New items move both ways from now on.",
  },
];

export const PROVIDER_LABELS: Record<string, string> = {
  "google.com": "Google",
  "apple.com": "Apple",
  password: "Email link",
  phone: "Phone",
};

export function getTimezoneOptions(currentTimezone: string): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    const values = Intl.supportedValuesOf("timeZone");
    return values.includes(currentTimezone) ? values : [currentTimezone, ...values];
  }
  return [currentTimezone, "UTC"];
}

export async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function formatSyncDate(value: string | null | undefined): string {
  if (!value) return "just now";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
