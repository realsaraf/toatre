export interface NotificationChannels {
  push: boolean;
  email: boolean;
  sms: boolean;
}

export type NotificationPreferences = Record<string, NotificationChannels>;

export type SyncDirection = "sourceToToatre" | "toatreToSource" | "twoWay";

export const SYNC_PROVIDERS = ["googleCalendar", "microsoft", "calendly", "zoom"] as const;
export type SyncProvider = (typeof SYNC_PROVIDERS)[number];

export interface SyncConnection {
  provider: SyncProvider;
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

function normalizeSyncProvider(input: unknown): SyncProvider {
  return SYNC_PROVIDERS.includes(input as SyncProvider)
    ? (input as SyncProvider)
    : "googleCalendar";
}

function normalizeSyncConnection(input: Record<string, unknown>, provider: SyncProvider): SyncConnection {
  return {
    provider: normalizeSyncProvider(input.provider ?? provider),
    direction: normalizeSyncDirection(input.direction),
    connected: input.connected === true,
    connectedAt: normalizeDateString(input.connectedAt),
    forwardOnlyFrom: normalizeDateString(input.forwardOnlyFrom),
    lastSyncedAt: normalizeDateString(input.lastSyncedAt),
    updatedAt: normalizeDateString(input.updatedAt),
  };
}

export function normalizeSyncConnections(input: unknown): SyncConnections {
  if (!input || typeof input !== "object") {
    return {};
  }

  const record = input as Record<string, unknown>;
  const connections: SyncConnections = {};

  for (const provider of SYNC_PROVIDERS) {
    const candidate = record[provider];
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    connections[provider] = normalizeSyncConnection(
      candidate as Record<string, unknown>,
      provider,
    );
  }

  return connections;
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
    defaultTier: "regular" as string,
    notificationPreferences: createDefaultNotificationPreferences(),
    syncConnections: {} as SyncConnections,
  };
}
