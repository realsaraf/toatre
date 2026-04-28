import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { createGoogleOAuthClient } from "@/lib/sync/google-calendar";
import { hashSecret } from "@/lib/security/token-crypto";

const BodySchema = z.object({
  direction: z.enum(["sourceToToatre", "toatreToSource", "twoWay"]),
  returnTo: z.string().optional(),
});

const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sync request.", details: parsed.error.flatten() }, { status: 422 });
  }

  const state = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  const { calendarSyncStates } = await getCollections();
  await calendarSyncStates.insertOne({
    stateHash: hashSecret(state),
    userId: user.mongoId,
    direction: parsed.data.direction,
    returnTo: sanitizeReturnTo(parsed.data.returnTo),
    createdAt: now,
    expiresAt,
    usedAt: null,
  });

  const oauth = createGoogleOAuthClient();
  const authUrl = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state,
    scope: ["openid", "email", "profile", GOOGLE_CALENDAR_SCOPE],
    include_granted_scopes: true,
  });

  return NextResponse.json({ authUrl, expiresAt: expiresAt.toISOString() });
}

function sanitizeReturnTo(value: string | undefined): string {
  if (!value || !value.startsWith("/")) {
    return "/settings?sync=google";
  }
  return value;
}
