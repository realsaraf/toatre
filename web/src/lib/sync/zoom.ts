/**
 * Zoom meetings sync helpers.
 * Uses Zoom OAuth 2.0. Imports upcoming scheduled meetings as toats.
 */
import { randomBytes } from "crypto";
import { encryptSecret, decryptSecret } from "@/lib/security/token-crypto";
import { getCollections } from "@/lib/mongo/collections";
import { notifyUserDevices } from "@/lib/pings/notify-devices";

const PROVIDER = "zoom";
const API_URL = "https://api.zoom.us/v2";
const TOKEN_URL = "https://zoom.us/oauth/token";
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

export function zoomRedirectUri(): string {
  return `${appUrl()}/api/sync/zoom/callback`;
}

function appUrl(): string {
  return process.env.TOATRE_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://toatre.com";
}

function requireClientId(): string {
  const v = process.env.ZOOM_CLIENT_ID;
  if (!v) throw new Error("ZOOM_CLIENT_ID env var is required.");
  return v;
}

function requireClientSecret(): string {
  const v = process.env.ZOOM_CLIENT_SECRET;
  if (!v) throw new Error("ZOOM_CLIENT_SECRET env var is required.");
  return v;
}

export function zoomAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: requireClientId(),
    redirect_uri: zoomRedirectUri(),
    state,
  });
  return `https://zoom.us/oauth/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  const credentials = Buffer.from(`${requireClientId()}:${requireClientSecret()}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: zoomRedirectUri(),
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
    body,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Zoom token exchange failed: ${txt}`);
  }
  const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
  if (!data.access_token || !data.refresh_token) {
    throw new Error("Zoom did not return tokens. Try connecting again.");
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
  if (!res.ok) throw new Error("Zoom refresh failed.");
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

export async function syncZoomForUser(userId: string): Promise<SyncStats> {
  const { calendarSyncTokens } = await getCollections();
  const doc = await calendarSyncTokens.findOne({ userId, provider: PROVIDER, connected: true }) as TokenDoc | null;
  if (!doc) return { imported: 0, skipped: 0 };
  return syncZoomToken(doc);
}

export async function syncAllZoom(): Promise<SyncStats & { users: number }> {
  const { calendarSyncTokens } = await getCollections();
  const docs = (await calendarSyncTokens.find({ provider: PROVIDER, connected: true }).toArray()) as unknown as TokenDoc[];
  const total = { imported: 0, skipped: 0, users: 0 };
  for (const doc of docs) {
    try {
      const s = await syncZoomToken(doc);
      total.imported += s.imported;
      total.skipped += s.skipped;
      total.users++;
    } catch (err) {
      console.error("[zoom/sync-all] user failed", doc.userId, err);
    }
  }
  return total;
}

async function syncZoomToken(doc: TokenDoc): Promise<SyncStats> {
  const token = await getValidAccessToken(doc);
  const { toats, calendarSyncTokens } = await getCollections();

  const now = new Date();
  const from = now.toISOString().split(".")[0] + "Z";
  const to = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400000).toISOString().split(".")[0] + "Z";

  interface ZoomMeeting {
    id?: number;
    uuid?: string;
    topic?: string;
    start_time?: string;
    duration?: number;
    join_url?: string;
  }

  interface ZoomListResponse {
    meetings?: ZoomMeeting[];
  }

  const url = `${API_URL}/users/me/meetings?type=scheduled&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&page_size=100`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return { imported: 0, skipped: 0 };

  const data = (await res.json()) as ZoomListResponse;
  const meetings = data.meetings ?? [];

  let imported = 0;
  let skipped = 0;

  for (const meeting of meetings) {
    if (!meeting.id || !meeting.start_time) { skipped++; continue; }
    const extId = `zoom:${meeting.id}`;
    const exists = await toats.findOne({ ownerId: doc.userId, "meta.externalId": extId });
    if (exists) { skipped++; continue; }

    const endAt = meeting.start_time && meeting.duration
      ? new Date(new Date(meeting.start_time).getTime() + meeting.duration * 60000).toISOString()
      : null;

    await toats.insertOne({
      ownerId: doc.userId,
      captureId: null,
      tier: "regular",
      state: "open",
      title: meeting.topic ?? "Zoom meeting",
      notes: null,
      enrichments: {
        time: { at: meeting.start_time ?? null, endAt },
        communication: { joinUrl: meeting.join_url ?? null },
      },
      meta: { externalId: extId, source: "zoom", syncedAt: now },
      createdAt: now,
      updatedAt: now,
    });
    imported++;
  }

  await calendarSyncTokens.updateOne({ userId: doc.userId, provider: PROVIDER }, { $set: { lastSyncedAt: now } });

  if (imported > 0) {
    await notifyUserDevices(doc.userId, {
      "notification-title": "Calendar synced",
      "notification-body": `${imported} new toat${imported !== 1 ? "s" : ""} from your Zoom`,
    }).catch(() => null);
  }

  return { imported, skipped };
}

export async function disconnectZoom(userId: string): Promise<void> {
  const { calendarSyncTokens, settings } = await getCollections();
  const now = new Date();
  await calendarSyncTokens.updateOne({ userId, provider: PROVIDER }, { $set: { connected: false, updatedAt: now } });
  await settings.updateOne(
    { userId },
    { $set: { "syncConnections.zoom.connected": false, "syncConnections.zoom.updatedAt": now, updatedAt: now } },
  );
}

export function generateState(): string {
  return randomBytes(32).toString("base64url");
}
