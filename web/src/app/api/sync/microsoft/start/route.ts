import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { microsoftAuthUrl } from "@/lib/sync/microsoft-calendar";
import { hashSecret } from "@/lib/security/token-crypto";

const BodySchema = z.object({
  direction: z.enum(["sourceToToatre", "toatreToSource", "twoWay"]),
  returnTo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_SYNC_MICROSOFT_ENABLED !== "true") {
    return NextResponse.json({ error: "Microsoft Calendar sync is not enabled." }, { status: 503 });
  }

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
    provider: "microsoft",
    direction: parsed.data.direction,
    returnTo: sanitizeReturnTo(parsed.data.returnTo),
    createdAt: now,
    expiresAt,
    usedAt: null,
  });

  const authUrl = microsoftAuthUrl(state);
  return NextResponse.json({ authUrl, expiresAt: expiresAt.toISOString() });
}

function sanitizeReturnTo(value: string | undefined): string {
  if (!value || !value.startsWith("/")) return "/settings?sync=microsoft";
  return value;
}
