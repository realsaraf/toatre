import { NextRequest, NextResponse } from "next/server";
import { getCollections } from "@/lib/mongo/collections";
import { exchangeCode, syncCalendlyForUser } from "@/lib/sync/calendly";
import { encryptSecret, hashSecret } from "@/lib/security/token-crypto";

const PROVIDER = "calendly";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return html("Calendly connection cancelled", "Calendly returned an error before Toatre could connect your account.");
  }

  if (!code || !state) {
    return html("Calendly connection failed", "The Calendly callback was missing a code or state value.", 400);
  }

  const { calendarSyncStates, calendarSyncTokens, settings } = await getCollections();
  const stateDoc = await calendarSyncStates.findOne({ stateHash: hashSecret(state), usedAt: null });
  if (!stateDoc || !(stateDoc.expiresAt instanceof Date) || stateDoc.expiresAt < new Date()) {
    return html("Calendly connection expired", "Please return to Toatre and try connecting Calendly again.", 400);
  }

  let tokens: { accessToken: string; refreshToken: string; expiresAt: Date };
  try {
    tokens = await exchangeCode(code);
  } catch (err) {
    console.error("[calendly/callback] token exchange failed", err);
    return html("Calendly connection failed", "Toatre could not complete the Calendly token exchange. Please try again.", 400);
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
        encryptedRefreshToken: encryptSecret(tokens.refreshToken),
        encryptedAccessToken: encryptSecret(tokens.accessToken),
        accessTokenExpiresAt: tokens.expiresAt,
        scope: "default",
        connectedAt,
        forwardOnlyFrom,
        updatedAt: now,
      },
      $setOnInsert: { userId, provider: PROVIDER, createdAt: now },
    },
    { upsert: true },
  );

  await settings.updateOne(
    { userId },
    {
      $set: {
        "syncConnections.calendly": { provider: PROVIDER, direction, connected: true, connectedAt, forwardOnlyFrom, updatedAt: now },
        updatedAt: now,
      },
      $setOnInsert: { userId },
    },
    { upsert: true },
  );

  await calendarSyncStates.updateOne({ _id: stateDoc._id }, { $set: { usedAt: now } });

  try {
    await syncCalendlyForUser(userId);
  } catch (syncErr) {
    console.error("[calendly/callback] initial sync failed", syncErr);
  }

  const returnTo = typeof stateDoc.returnTo === "string" && stateDoc.returnTo.startsWith("/") ? stateDoc.returnTo : "/settings?sync=calendly";
  return NextResponse.redirect(new URL(returnTo, process.env.TOATRE_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://toatre.com"));
}

function html(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#fbfaff;color:#111827;display:grid;min-height:100vh;place-items:center;margin:0;padding:24px}.card{max-width:520px;background:white;border:1px solid #e5e7eb;border-radius:24px;padding:28px;box-shadow:0 24px 80px rgba(31,41,55,.10)}h1{margin:0 0 12px;font-size:28px}p{margin:0;color:#4b5563;line-height:1.6}</style></head><body><main class="card"><h1>${esc(title)}</h1><p>${esc(body)}</p></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function esc(v: string) {
  return v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] ?? c));
}
