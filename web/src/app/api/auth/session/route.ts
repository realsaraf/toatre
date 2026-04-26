import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getCollections } from "@/lib/mongo/collections";
import { getAppRouterSession } from "@/lib/auth/session";
import type { DbUser } from "@/types/db";

const bodySchema = z.object({
  idToken: z.string().min(1),
});

// Simple in-memory rate limiter: max 10 requests per minute per IP.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "idToken is required." },
      { status: 400 }
    );
  }

  const { idToken } = parsed.data;

  let decodedToken;
  try {
    decodedToken = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired ID token." },
      { status: 401 }
    );
  }

  let users;
  try {
    ({ users } = await getCollections());
  } catch {
    return NextResponse.json(
      { error: "Database unavailable." },
      { status: 503 }
    );
  }

  const now = new Date();

  await users.updateOne(
    { firebaseUid: decodedToken.uid },
    {
      $set: {
        email: decodedToken.email ?? null,
        displayName: decodedToken.name ?? null,
        photoUrl: decodedToken.picture ?? null,
        updatedAt: now,
      },
      $setOnInsert: {
        firebaseUid: decodedToken.uid,
        handle: null,
        providers: decodedToken.firebase?.sign_in_provider
          ? [decodedToken.firebase.sign_in_provider]
          : [],
        fcmTokens: [],
        timezone: "UTC",
        createdAt: now,
      },
    },
    { upsert: true }
  );

  const mongoUser = await users.findOne({ firebaseUid: decodedToken.uid });
  if (!mongoUser) {
    return NextResponse.json(
      { error: "Failed to upsert user." },
      { status: 500 }
    );
  }

  const dbUser: DbUser = {
    _id: mongoUser._id.toString(),
    firebase_uid: mongoUser.firebaseUid as string,
    email: (mongoUser.email as string) ?? "",
    display_name: (mongoUser.displayName as string | null) ?? null,
    handle: (mongoUser.handle as string | null) ?? null,
    photo_url: (mongoUser.photoUrl as string | null) ?? null,
    providers: (mongoUser.providers as string[]) ?? [],
    fcm_tokens: (mongoUser.fcmTokens as string[]) ?? [],
    timezone: (mongoUser.timezone as string) ?? "UTC",
    created_at: mongoUser.createdAt as Date,
    updated_at: mongoUser.updatedAt as Date,
  };

  // Save the session cookie before building the response so the cookie
  // is flushed into the Next.js response headers.
  try {
    const session = await getAppRouterSession();
    session.firebaseUid = decodedToken.uid;
    session.userId = dbUser._id;
    session.email = dbUser.email;
    await session.save();
  } catch {
    // Non-fatal: if SESSION_SECRET is missing in dev we still return the
    // user payload so the client can operate with the Firebase token alone.
  }

  return NextResponse.json({ ok: true, user: dbUser });
}
