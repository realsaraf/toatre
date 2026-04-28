import { NextRequest, NextResponse } from "next/server";
import { getCollections } from "@/lib/mongo/collections";
import { createGoogleOAuthClient, syncGoogleCalendarForUser } from "@/lib/sync/google-calendar";
import { encryptSecret, hashSecret } from "@/lib/security/token-crypto";

const PROVIDER = "googleCalendar";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return htmlResponse("Google Calendar connection cancelled", "Google returned an error before Toatre could connect your calendar.");
  }

  if (!code || !state) {
    return htmlResponse("Google Calendar connection failed", "The Google callback was missing a code or state value.", 400);
  }

  const { calendarSyncStates, calendarSyncTokens, settings } = await getCollections();
  const stateDoc = await calendarSyncStates.findOne({ stateHash: hashSecret(state), usedAt: null });
  if (!stateDoc || !(stateDoc.expiresAt instanceof Date) || stateDoc.expiresAt < new Date()) {
    return htmlResponse("Google Calendar connection expired", "Please return to Toatre and try connecting Google Calendar again.", 400);
  }

  const oauth = createGoogleOAuthClient();
  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    return htmlResponse(
      "Google Calendar needs one more approval",
      "Google did not return an offline refresh token. Try connecting again and approve calendar access when prompted.",
      400,
    );
  }

  const now = new Date();
  const userId = stateDoc.userId as string;
  const direction = stateDoc.direction as "sourceToToatre" | "toatreToSource" | "twoWay";
  const existing = await calendarSyncTokens.findOne({ userId, provider: PROVIDER });
  const connectedAt = existing?.connectedAt instanceof Date ? existing.connectedAt : now;
  const forwardOnlyFrom = existing?.forwardOnlyFrom instanceof Date ? existing.forwardOnlyFrom : now;

  await calendarSyncTokens.updateOne(
    { userId, provider: PROVIDER },
    {
      $set: {
        direction,
        connected: true,
        encryptedRefreshToken: encryptSecret(tokens.refresh_token),
        encryptedAccessToken: tokens.access_token ? encryptSecret(tokens.access_token) : null,
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope ?? null,
        connectedAt,
        forwardOnlyFrom,
        updatedAt: now,
      },
      $setOnInsert: {
        userId,
        provider: PROVIDER,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  await settings.updateOne(
    { userId },
    {
      $set: {
        "syncConnections.googleCalendar": {
          provider: PROVIDER,
          direction,
          connected: true,
          connectedAt,
          forwardOnlyFrom,
          updatedAt: now,
        },
        updatedAt: now,
      },
      $setOnInsert: { userId },
    },
    { upsert: true },
  );

  await calendarSyncStates.updateOne({ _id: stateDoc._id }, { $set: { usedAt: now } });

  try {
    await syncGoogleCalendarForUser(userId);
  } catch (syncError) {
    console.error("[google-calendar/callback] initial sync failed", syncError);
  }

  return htmlResponse(
    "Google Calendar connected",
    "Toatre will sync forward-looking calendar items from this point on. You can close this tab and return to Toatre.",
  );
}

function htmlResponse(title: string, body: string, status = 200) {
  return new NextResponse(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#fbfaff;color:#111827;display:grid;min-height:100vh;place-items:center;margin:0;padding:24px}.card{max-width:520px;background:white;border:1px solid #e5e7eb;border-radius:24px;padding:28px;box-shadow:0 24px 80px rgba(31,41,55,.10)}h1{margin:0 0 12px;font-size:28px}p{margin:0;color:#4b5563;line-height:1.6}</style></head><body><main class="card"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p></main></body></html>`, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] ?? char));
}
