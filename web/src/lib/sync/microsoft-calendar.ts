/**
 * Microsoft Calendar + Teams sync helpers.
 * Uses Microsoft Graph API with OAuth 2.0 (common tenant — works for
 * personal and work accounts). Scopes: Calendars.Read, OnlineMeetings.Read.
 */
import { randomBytes } from "crypto";
import { encryptSecret, decryptSecret } from "@/lib/security/token-crypto";
import { getCollections } from "@/lib/mongo/collections";
import { notifyUserDevices } from "@/lib/pings/notify-devices";

const PROVIDER = "microsoft";
const GRAPH_URL = "https://graph.microsoft.com/v1.0";
const TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const LOOKAHEAD_DAYS = 90;

type TokenDoc = {
  userId: string;
  provider: string;
  connected: boolean;
  encryptedRefreshToken: string;
  encryptedAccessToken: string | null;
  accessTokenExpiresAt: Date | null;
  direction: string;
  connectedAt: Date;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type SyncStats = { imported: number; skipped: number };

export function microsoftRedirectUri(): string {
  return `${appUrl()}/api/sync/microsoft/callback`;
}

function appUrl(): string {
  return process.env.TOATRE_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://toatre.com";
}

function requireClientId(): string {
  const v = process.env.MICROSOFT_CLIENT_ID;
  if (!v) throw new Error("MICROSOFT_CLIENT_ID env var is required.");
  return v;
}

function requireClientSecret(): string {
  const v = process.env.MICROSOFT_CLIENT_SECRET;
  if (!v) throw new Error("MICROSOFT_CLIENT_SECRET env var is required.");
  return v;
}

export function microsoftAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireClientId(),
    response_type: "code",
    redirect_uri: microsoftRedirectUri(),
    response_mode: "query",
    scope: "offline_access Calendars.Read OnlineMeetings.Read",
    state,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  const body = new URLSearchParams({
    client_id: requireClientId(),
    client_secret: requireClientSecret(),
    code,
    redirect_uri: microsoftRedirectUri(),
    grant_type: "authorization_code",
    scope: "offline_access Calendars.Read OnlineMeetings.Read",
  });
  const res = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Microsoft token exchange failed: ${txt}`);
  }
  const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
  if (!data.access_token || !data.refresh_token) {
    throw new Error("Microsoft did not return an access token or refresh token. Try connecting again.");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  };
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date; newRefreshToken?: string }> {
  const body = new URLSearchParams({
    client_id: requireClientId(),
    client_secret: requireClientSecret(),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: "offline_access Calendars.Read OnlineMeetings.Read",
  });
  const res = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!res.ok) throw new Error("Microsoft refresh failed.");
  const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
  return {
    accessToken: data.access_token,
    newRefreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  };
}

async function getValidAccessToken(doc: TokenDoc): Promise<{ token: string; tokenDoc: TokenDoc }> {
  const now = new Date();
  const buffer = 5 * 60 * 1000;
  if (doc.encryptedAccessToken && doc.accessTokenExpiresAt && doc.accessTokenExpiresAt.getTime() - buffer > now.getTime()) {
    return { token: decryptSecret(doc.encryptedAccessToken), tokenDoc: doc };
  }
  const refreshToken = decryptSecret(doc.encryptedRefreshToken);
  const refreshed = await refreshAccessToken(refreshToken);
  const { calendarSyncTokens } = await getCollections();
  const updates: Record<string, unknown> = {
    encryptedAccessToken: encryptSecret(refreshed.accessToken),
    accessTokenExpiresAt: refreshed.expiresAt,
    updatedAt: now,
  };
  if (refreshed.newRefreshToken) {
    updates.encryptedRefreshToken = encryptSecret(refreshed.newRefreshToken);
  }
  await calendarSyncTokens.updateOne({ userId: doc.userId, provider: PROVIDER }, { $set: updates });
  return { token: refreshed.accessToken, tokenDoc: { ...doc, ...updates } as TokenDoc };
}

async function graphGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${GRAPH_URL}${path}`, { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Graph API ${path} returned ${res.status}: ${txt}`);
  }
  return res.json() as Promise<T>;
}

export async function syncMicrosoftCalendarForUser(userId: string): Promise<SyncStats> {
  const { calendarSyncTokens } = await getCollections();
  const doc = await calendarSyncTokens.findOne({ userId, provider: PROVIDER, connected: true }) as TokenDoc | null;
  if (!doc) return { imported: 0, skipped: 0 };
  return syncMicrosoftToken(doc);
}

export async function syncAllMicrosoftCalendars(): Promise<SyncStats & { users: number }> {
  const { calendarSyncTokens } = await getCollections();
  const docs = (await calendarSyncTokens.find({ provider: PROVIDER, connected: true }).toArray()) as unknown as TokenDoc[];
  const total = { imported: 0, skipped: 0, users: 0 };
  for (const doc of docs) {
    try {
      const s = await syncMicrosoftToken(doc);
      total.imported += s.imported;
      total.skipped += s.skipped;
      total.users++;
    } catch (err) {
      console.error("[microsoft-calendar/sync-all] user failed", doc.userId, err);
    }
  }
  return total;
}

async function syncMicrosoftToken(doc: TokenDoc): Promise<SyncStats> {
  const { token } = await getValidAccessToken(doc);
  const { toats, calendarSyncTokens } = await getCollections();

  const now = new Date();
  const startDt = now.toISOString();
  const endDt = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400000).toISOString();

  interface GraphEvent {
    id: string;
    subject?: string;
    start?: { dateTime?: string };
    end?: { dateTime?: string };
    isOnlineMeeting?: boolean;
    onlineMeeting?: { joinUrl?: string } | null;
    bodyPreview?: string;
    attendees?: Array<{ emailAddress?: { name?: string } }>;
  }

  interface GraphResponse {
    value?: GraphEvent[];
  }

  const url = `/me/calendar/events?$filter=start/dateTime ge '${startDt}' and end/dateTime le '${endDt}'&$select=id,subject,start,end,isOnlineMeeting,onlineMeeting,bodyPreview,attendees&$top=100&$orderby=start/dateTime`;
  let data: GraphResponse;
  try {
    data = await graphGet<GraphResponse>(token, url);
  } catch (err) {
    console.error("[microsoft-calendar] event fetch failed", err);
    return { imported: 0, skipped: 0 };
  }

  const events = data.value ?? [];
  let imported = 0;
  let skipped = 0;

  for (const event of events) {
    if (!event.id || !event.start?.dateTime) { skipped++; continue; }
    const extId = `microsoft:${event.id}`;
    const exists = await toats.findOne({ ownerId: doc.userId, "meta.externalId": extId });
    if (exists) { skipped++; continue; }

    const kind = event.isOnlineMeeting ? "meeting" : "event";
    const title = event.subject ?? "Microsoft Calendar event";
    const startAt = event.start?.dateTime ?? null;
    const endAt = event.end?.dateTime ?? null;
    const joinUrl = event.onlineMeeting?.joinUrl ?? null;
    const guests = (event.attendees ?? []).map((a) => a.emailAddress?.name).filter(Boolean) as string[];

    await toats.insertOne({
      ownerId: doc.userId,
      captureId: null,
      tier: "regular",
      state: "open",
      title,
      notes: event.bodyPreview ?? null,
      enrichments: {
        time: { at: startAt, endAt },
        ...(kind === "meeting" ? { communication: { joinUrl } } : {}),
        ...(guests.length > 0 ? { people: guests } : {}),
      },
      meta: { externalId: extId, source: "microsoft_calendar", syncedAt: now },
      createdAt: now,
      updatedAt: now,
    });
    imported++;
  }

  await calendarSyncTokens.updateOne({ userId: doc.userId, provider: PROVIDER }, { $set: { lastSyncedAt: now } });

  if (imported > 0) {
    await notifyUserDevices(doc.userId, {
      "notification-title": "Calendar synced",
      "notification-body": `${imported} new toat${imported !== 1 ? "s" : ""} from your Microsoft Calendar`,
    }).catch(() => null);
  }

  return { imported, skipped };
}

export async function disconnectMicrosoftCalendar(userId: string): Promise<void> {
  const { calendarSyncTokens, settings } = await getCollections();
  const now = new Date();
  await calendarSyncTokens.updateOne({ userId, provider: PROVIDER }, { $set: { connected: false, updatedAt: now } });
  await settings.updateOne(
    { userId },
    { $set: { "syncConnections.microsoft.connected": false, "syncConnections.microsoft.updatedAt": now, updatedAt: now } },
  );
}

export function generateState(): string {
  return randomBytes(32).toString("base64url");
}
