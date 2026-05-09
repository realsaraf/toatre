/**
 * Calendly sync helpers.
 * Uses Calendly OAuth 2.0 + REST API v2.
 * Imports scheduled events (where the user is the host) as toats.
 */
import { randomBytes } from "crypto";
import { encryptSecret, decryptSecret } from "@/lib/security/token-crypto";
import { getCollections } from "@/lib/mongo/collections";
import { notifyUserDevices } from "@/lib/pings/notify-devices";

const PROVIDER = "calendly";
const API_URL = "https://api.calendly.com";
const TOKEN_URL = "https://auth.calendly.com/oauth/token";
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

export function calendlyRedirectUri(): string {
  return `${appUrl()}/api/sync/calendly/callback`;
}

function appUrl(): string {
  return process.env.TOATRE_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://toatre.com";
}

function requireClientId(): string {
  const v = process.env.CALENDLY_CLIENT_ID;
  if (!v) throw new Error("CALENDLY_CLIENT_ID env var is required.");
  return v;
}

function requireClientSecret(): string {
  const v = process.env.CALENDLY_CLIENT_SECRET;
  if (!v) throw new Error("CALENDLY_CLIENT_SECRET env var is required.");
  return v;
}

export function calendlyAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireClientId(),
    response_type: "code",
    redirect_uri: calendlyRedirectUri(),
    state,
  });
  return `https://auth.calendly.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  const credentials = Buffer.from(`${requireClientId()}:${requireClientSecret()}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: calendlyRedirectUri(),
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
    body,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Calendly token exchange failed: ${txt}`);
  }
  const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
  if (!data.access_token || !data.refresh_token) {
    throw new Error("Calendly did not return tokens. Try connecting again.");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  };
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date; newRefreshToken?: string }> {
  const credentials = Buffer.from(`${requireClientId()}:${requireClientSecret()}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
    body,
  });
  if (!res.ok) throw new Error("Calendly refresh failed.");
  const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
  return {
    accessToken: data.access_token,
    newRefreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  };
}

async function getValidAccessToken(doc: TokenDoc): Promise<string> {
  const now = new Date();
  const buffer = 5 * 60 * 1000;
  if (doc.encryptedAccessToken && doc.accessTokenExpiresAt && doc.accessTokenExpiresAt.getTime() - buffer > now.getTime()) {
    return decryptSecret(doc.encryptedAccessToken);
  }
  const refreshed = await refreshAccessToken(decryptSecret(doc.encryptedRefreshToken));
  const { calendarSyncTokens } = await getCollections();
  const updates: Record<string, unknown> = {
    encryptedAccessToken: encryptSecret(refreshed.accessToken),
    accessTokenExpiresAt: refreshed.expiresAt,
    updatedAt: now,
  };
  if (refreshed.newRefreshToken) updates.encryptedRefreshToken = encryptSecret(refreshed.newRefreshToken);
  await calendarSyncTokens.updateOne({ userId: doc.userId, provider: PROVIDER }, { $set: updates });
  return refreshed.accessToken;
}

export async function syncCalendlyForUser(userId: string): Promise<SyncStats> {
  const { calendarSyncTokens } = await getCollections();
  const doc = await calendarSyncTokens.findOne({ userId, provider: PROVIDER, connected: true }) as TokenDoc | null;
  if (!doc) return { imported: 0, skipped: 0 };
  return syncCalendlyToken(doc);
}

export async function syncAllCalendly(): Promise<SyncStats & { users: number }> {
  const { calendarSyncTokens } = await getCollections();
  const docs = (await calendarSyncTokens.find({ provider: PROVIDER, connected: true }).toArray()) as unknown as TokenDoc[];
  const total = { imported: 0, skipped: 0, users: 0 };
  for (const doc of docs) {
    try {
      const s = await syncCalendlyToken(doc);
      total.imported += s.imported;
      total.skipped += s.skipped;
      total.users++;
    } catch (err) {
      console.error("[calendly/sync-all] user failed", doc.userId, err);
    }
  }
  return total;
}

async function syncCalendlyToken(doc: TokenDoc): Promise<SyncStats> {
  const token = await getValidAccessToken(doc);
  const { toats, calendarSyncTokens } = await getCollections();

  // Get the user's Calendly URI first
  const meRes = await fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) return { imported: 0, skipped: 0 };
  const me = (await meRes.json()) as { resource?: { uri?: string; name?: string } };
  const userUri = me.resource?.uri;
  if (!userUri) return { imported: 0, skipped: 0 };

  const now = new Date();
  const minStartTime = now.toISOString();
  const maxStartTime = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400000).toISOString();

  interface CalendlyEvent {
    uri: string;
    name?: string;
    start_time?: string;
    end_time?: string;
    location?: { join_url?: string; location?: string };
    invitees_counter?: { active?: number };
    event_type?: string;
  }

  interface CalendlyEventsResponse {
    collection?: CalendlyEvent[];
  }

  const params = new URLSearchParams({ user: userUri, status: "active", min_start_time: minStartTime, max_start_time: maxStartTime, count: "100" });
  const evRes = await fetch(`${API_URL}/scheduled_events?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!evRes.ok) return { imported: 0, skipped: 0 };
  const evData = (await evRes.json()) as CalendlyEventsResponse;
  const events = evData.collection ?? [];

  let imported = 0;
  let skipped = 0;

  for (const event of events) {
    if (!event.uri || !event.start_time) { skipped++; continue; }
    const extId = `calendly:${event.uri}`;
    const exists = await toats.findOne({ ownerId: doc.userId, "meta.externalId": extId });
    if (exists) { skipped++; continue; }

    const joinUrl = event.location?.join_url ?? null;
    const title = event.name ?? "Calendly meeting";

    await toats.insertOne({
      ownerId: doc.userId,
      captureId: null,
      tier: "regular",
      state: "open",
      title,
      notes: null,
      enrichments: {
        time: { at: event.start_time ?? null, endAt: event.end_time ?? null },
        ...(joinUrl ? { communication: { joinUrl } } : {}),
      },
      meta: { externalId: extId, source: "calendly", syncedAt: now },
      createdAt: now,
      updatedAt: now,
    });
    imported++;
  }

  await calendarSyncTokens.updateOne({ userId: doc.userId, provider: PROVIDER }, { $set: { lastSyncedAt: now } });

  if (imported > 0) {
    await notifyUserDevices(doc.userId, {
      "notification-title": "Calendar synced",
      "notification-body": `${imported} new toat${imported !== 1 ? "s" : ""} from your Calendly`,
    }).catch(() => null);
  }

  return { imported, skipped };
}

export async function disconnectCalendly(userId: string): Promise<void> {
  const { calendarSyncTokens, settings } = await getCollections();
  const now = new Date();
  await calendarSyncTokens.updateOne({ userId, provider: PROVIDER }, { $set: { connected: false, updatedAt: now } });
  await settings.updateOne(
    { userId },
    { $set: { "syncConnections.calendly.connected": false, "syncConnections.calendly.updatedAt": now, updatedAt: now } },
  );
}

export function generateState(): string {
  return randomBytes(32).toString("base64url");
}
