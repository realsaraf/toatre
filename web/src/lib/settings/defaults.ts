export interface NotificationChannels {
  push: boolean;
  email: boolean;
  sms: boolean;
}

export type NotificationPreferences = Record<string, NotificationChannels>;

export type SyncDirection = "sourceToToatre" | "toatreToSource" | "twoWay";

export interface SyncConnection {
  provider: "googleCalendar";
  direction: SyncDirection;
  connected: boolean;
  connectedAt: string | null;
  forwardOnlyFrom: string | null;
  lastSyncedAt: string | null;
  updatedAt: string | null;
}

export type SyncConnections = Record<string, SyncConnection>;

export const TOAT_KINDS: string[] = ["task", "event", "meeting", "idea", "errand", "deadline"];

const DEFAULT_CHANNELS: NotificationChannels = {
  push: true,
  email: false,
  sms: false,
};

export function createDefaultNotificationPreferences(): NotificationPreferences {
  return Object.fromEntries(
    TOAT_KINDS.map((kind) => [kind, { ...DEFAULT_CHANNELS }]),
  ) as NotificationPreferences;
}

export function normalizeNotificationPreferences(input: unknown): NotificationPreferences {
  const defaults = createDefaultNotificationPreferences();

  if (!input || typeof input !== "object") {
    return defaults;
  }

  const record = input as Record<string, unknown>;

  for (const kind of TOAT_KINDS) {
    const candidate = record[kind];
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const channels = candidate as Record<string, unknown>;
    defaults[kind] = {
      push: typeof channels.push === "boolean" ? channels.push : defaults[kind].push,
      email: typeof channels.email === "boolean" ? channels.email : defaults[kind].email,
      sms: typeof channels.sms === "boolean" ? channels.sms : defaults[kind].sms,
    };
  }

  return defaults;
}

function normalizeDateString(input: unknown): string | null {
  if (input instanceof Date) {
    return input.toISOString();
  }

  if (typeof input !== "string" || !input) {
    return null;
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeSyncDirection(input: unknown): SyncDirection {
  if (input === "toatreToSource" || input === "twoWay") {
    return input;
  }

  return "sourceToToatre";
}

export function normalizeSyncConnections(input: unknown): SyncConnections {
  if (!input || typeof input !== "object") {
    return {};
  }

  const record = input as Record<string, unknown>;
  const googleCalendar = record.googleCalendar;

  if (!googleCalendar || typeof googleCalendar !== "object") {
    return {};
  }

  const connection = googleCalendar as Record<string, unknown>;
  return {
    googleCalendar: {
      provider: "googleCalendar",
      direction: normalizeSyncDirection(connection.direction),
      connected: connection.connected === true,
      connectedAt: normalizeDateString(connection.connectedAt),
      forwardOnlyFrom: normalizeDateString(connection.forwardOnlyFrom),
      lastSyncedAt: normalizeDateString(connection.lastSyncedAt),
      updatedAt: normalizeDateString(connection.updatedAt),
    },
  };
}

export function createDefaultUserSettings(timezone: string) {
  return {
    timezone,
    voiceRetention: false,
    smsEnabled: false,
    reminderPhone: null as string | null,
    pendingPhone: null as string | null,
    phoneVerifiedAt: null as string | null,
    workStart: "09:00",
    workEnd: "17:30",
    notificationPreferences: createDefaultNotificationPreferences(),
    syncConnections: {} as SyncConnections,
  };
}
