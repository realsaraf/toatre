import { google, calendar_v3 } from "googleapis";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongo/collections";
import { decryptSecret, encryptSecret } from "@/lib/security/token-crypto";
import type { SyncDirection } from "@/lib/settings/defaults";

const PROVIDER = "googleCalendar";
const LOOKAHEAD_DAYS = 120;

type SyncStats = {
  imported: number;
  exported: number;
  skipped: number;
};

type TokenDoc = {
  _id?: ObjectId;
  userId: string;
  provider: typeof PROVIDER;
  direction: SyncDirection;
  connected: boolean;
  encryptedRefreshToken: string;
  encryptedAccessToken?: string | null;
  accessTokenExpiresAt?: Date | null;
  scope?: string | null;
  connectedAt: Date;
  forwardOnlyFrom: Date;
  lastSyncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function googleCalendarRedirectUri(): string {
  return `${appUrl()}/api/sync/google/callback`;
}

export function createGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET are required.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, googleCalendarRedirectUri());
}

export async function syncGoogleCalendarForUser(userId: string): Promise<SyncStats> {
  const { calendarSyncTokens } = await getCollections();
  const tokenDoc = await calendarSyncTokens.findOne({ userId, provider: PROVIDER, connected: true }) as TokenDoc | null;
  if (!tokenDoc) {
    return { imported: 0, exported: 0, skipped: 0 };
  }

  return syncGoogleCalendarToken(tokenDoc);
}

export async function syncAllGoogleCalendars(): Promise<SyncStats & { users: number }> {
  const { calendarSyncTokens } = await getCollections();
  const docs = await calendarSyncTokens.find({ provider: PROVIDER, connected: true }).toArray() as TokenDoc[];
  const total = { imported: 0, exported: 0, skipped: 0, users: 0 };

  for (const doc of docs) {
    try {
      const stats = await syncGoogleCalendarToken(doc);
      total.imported += stats.imported;
      total.exported += stats.exported;
      total.skipped += stats.skipped;
      total.users += 1;
    } catch (error) {
      console.error("[google-calendar/sync-all] user failed", doc.userId, error);
      total.skipped += 1;
    }
  }

  return total;
}

export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  const { calendarSyncTokens, settings } = await getCollections();
  const now = new Date();
  await calendarSyncTokens.updateOne(
    { userId, provider: PROVIDER },
    { $set: { connected: false, updatedAt: now } },
  );
  await settings.updateOne(
    { userId },
    {
      $set: {
        "syncConnections.googleCalendar.connected": false,
        "syncConnections.googleCalendar.connectedAt": null,
        "syncConnections.googleCalendar.forwardOnlyFrom": null,
        "syncConnections.googleCalendar.updatedAt": now,
        updatedAt: now,
      },
    },
  );
}

async function syncGoogleCalendarToken(tokenDoc: TokenDoc): Promise<SyncStats> {
  const oauth = createGoogleOAuthClient();
  oauth.setCredentials({
    refresh_token: decryptSecret(tokenDoc.encryptedRefreshToken),
    access_token: tokenDoc.encryptedAccessToken ? decryptSecret(tokenDoc.encryptedAccessToken) : undefined,
    expiry_date: tokenDoc.accessTokenExpiresAt?.getTime(),
  });

  oauth.on("tokens", async (tokens) => {
    const { calendarSyncTokens } = await getCollections();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (tokens.refresh_token) updates.encryptedRefreshToken = encryptSecret(tokens.refresh_token);
    if (tokens.access_token) updates.encryptedAccessToken = encryptSecret(tokens.access_token);
    if (tokens.expiry_date) updates.accessTokenExpiresAt = new Date(tokens.expiry_date);
    await calendarSyncTokens.updateOne({ userId: tokenDoc.userId, provider: PROVIDER }, { $set: updates });
  });

  const calendar = google.calendar({ version: "v3", auth: oauth });
  const stats: SyncStats = { imported: 0, exported: 0, skipped: 0 };

  if (tokenDoc.direction === "sourceToToatre" || tokenDoc.direction === "twoWay") {
    const imported = await importGoogleEvents(calendar, tokenDoc);
    stats.imported += imported.imported;
    stats.skipped += imported.skipped;
  }

  if (tokenDoc.direction === "toatreToSource" || tokenDoc.direction === "twoWay") {
    const exported = await exportToatreToGoogle(calendar, tokenDoc);
    stats.exported += exported.exported;
    stats.skipped += exported.skipped;
  }

  const now = new Date();
  const { calendarSyncTokens, settings } = await getCollections();
  await calendarSyncTokens.updateOne(
    { userId: tokenDoc.userId, provider: PROVIDER },
    { $set: { lastSyncedAt: now, updatedAt: now } },
  );
  await settings.updateOne(
    { userId: tokenDoc.userId },
    { $set: { "syncConnections.googleCalendar.lastSyncedAt": now, updatedAt: now } },
  );

  return stats;
}

async function importGoogleEvents(calendar: calendar_v3.Calendar, tokenDoc: TokenDoc): Promise<Pick<SyncStats, "imported" | "skipped">> {
  const stats = { imported: 0, skipped: 0 };
  const { toats } = await getCollections();
  const ownerId = new ObjectId(tokenDoc.userId);
  const timeMin = tokenDoc.forwardOnlyFrom.toISOString();
  const timeMax = new Date(Date.now() + LOOKAHEAD_DAYS * 86400000).toISOString();

  const response = await calendar.events.list({
    calendarId: "primary",
    singleEvents: true,
    orderBy: "startTime",
    timeMin,
    timeMax,
    maxResults: 250,
  });

  for (const event of response.data.items ?? []) {
    if (!event.id || event.status === "cancelled") {
      stats.skipped += 1;
      continue;
    }

    const start = parseGoogleDate(event.start);
    if (!start || start < tokenDoc.forwardOnlyFrom) {
      stats.skipped += 1;
      continue;
    }

    const end = parseGoogleDate(event.end);
    const existing = await toats.findOne({
      ownerId,
      externalProvider: PROVIDER,
      externalEventId: event.id,
    });

    const now = new Date();
    const doc = {
      ownerId,
      captureId: null,
      kind: event.hangoutLink || event.conferenceData ? "meeting" : "event",
      tier: "regular",
      title: event.summary || "Untitled calendar toat",
      datetime: start,
      endDatetime: end,
      location: event.location ?? null,
      link: event.hangoutLink ?? event.htmlLink ?? null,
      people: (event.attendees ?? [])
        .map((attendee) => attendee.displayName || attendee.email)
        .filter((value): value is string => Boolean(value)),
      notes: event.description ?? null,
      status: "active",
      externalProvider: PROVIDER,
      externalCalendarId: "primary",
      externalEventId: event.id,
      syncOrigin: "google",
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    if (existing) {
      await toats.updateOne(
        { _id: existing._id, ownerId },
        {
          $set: {
            kind: doc.kind,
            title: doc.title,
            datetime: doc.datetime,
            endDatetime: doc.endDatetime,
            location: doc.location,
            link: doc.link,
            people: doc.people,
            notes: doc.notes,
            lastSyncedAt: now,
            updatedAt: now,
          },
        },
      );
    } else {
      await toats.insertOne(doc);
    }
    stats.imported += 1;
  }

  return stats;
}

async function exportToatreToGoogle(calendar: calendar_v3.Calendar, tokenDoc: TokenDoc): Promise<Pick<SyncStats, "exported" | "skipped">> {
  const stats = { exported: 0, skipped: 0 };
  const { toats } = await getCollections();
  const ownerId = new ObjectId(tokenDoc.userId);
  const now = new Date();

  const docs = await toats.find({
    ownerId,
    datetime: { $gte: tokenDoc.forwardOnlyFrom },
    status: { $ne: "cancelled" },
    $or: [
      { externalProvider: { $exists: false } },
      { externalProvider: null },
      { syncOrigin: "toatre" },
    ],
  }).sort({ datetime: 1, createdAt: 1 }).limit(250).toArray();

  for (const toat of docs) {
    if (!toat.datetime || toat.status === "done" || toat.status === "archived") {
      stats.skipped += 1;
      continue;
    }

    const eventBody = toGoogleEvent(toat);
    const externalEventId = typeof toat.externalEventId === "string" ? toat.externalEventId : null;
    let savedEventId = externalEventId;

    if (externalEventId) {
      await calendar.events.patch({ calendarId: "primary", eventId: externalEventId, requestBody: eventBody });
    } else {
      const created = await calendar.events.insert({ calendarId: "primary", requestBody: eventBody });
      savedEventId = created.data.id ?? null;
    }

    if (!savedEventId) {
      stats.skipped += 1;
      continue;
    }

    await toats.updateOne(
      { _id: toat._id, ownerId },
      {
        $set: {
          externalProvider: PROVIDER,
          externalCalendarId: "primary",
          externalEventId: savedEventId,
          syncOrigin: "toatre",
          lastSyncedAt: now,
          updatedAt: now,
        },
      },
    );
    stats.exported += 1;
  }

  return stats;
}

function toGoogleEvent(toat: Record<string, unknown>): calendar_v3.Schema$Event {
  const start = toat.datetime instanceof Date ? toat.datetime : new Date(String(toat.datetime));
  const end = toat.endDatetime instanceof Date
    ? toat.endDatetime
    : new Date(start.getTime() + 60 * 60 * 1000);

  return {
    summary: typeof toat.title === "string" ? toat.title : "Toatre toat",
    description: typeof toat.notes === "string" ? toat.notes : undefined,
    location: typeof toat.location === "string" ? toat.location : undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };
}

function parseGoogleDate(value: calendar_v3.Schema$EventDateTime | undefined): Date | null {
  const raw = value?.dateTime ?? value?.date;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.TOATRE_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
