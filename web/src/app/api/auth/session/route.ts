import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getCollections } from "@/lib/mongo/collections";
import { cookies } from "next/headers";

const COOKIE_NAME = "toatre_session";
const SESSION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function normalizeTimezone(input: unknown): string | null {
  return typeof input === "string" && input.trim().length > 0 ? input.trim() : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { idToken: string; timezone?: string };
    const { idToken } = body;
    const timezone = normalizeTimezone(body.timezone);

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const adminAuth = getAdminAuth();

    // Create a long-lived session cookie from the short-lived ID token
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MS,
    });

    // Decode token to find / create the MongoDB user record
    const decoded = await adminAuth.verifyIdToken(idToken);
    const { users, settings } = await getCollections();

    const mongoUser = await users.findOne({ firebaseUid: decoded.uid });
    if (!mongoUser) {
      const now = new Date();
      await users.insertOne({
        firebaseUid: decoded.uid,
        email: decoded.email ?? null,
        handle: null,
        displayName: decoded.name ?? null,
        photoUrl: decoded.picture ?? null,
        timezone: timezone ?? "UTC",
        createdAt: now,
        updatedAt: now,
      });
    } else if (timezone && mongoUser.timezone === "UTC") {
      const settingsDoc = await settings.findOne({ userId: mongoUser._id.toString() });
      const hasSavedTimezone =
        typeof settingsDoc?.timezone === "string" && settingsDoc.timezone.trim().length > 0;

      if (!hasSavedTimezone) {
        await users.updateOne(
          { _id: mongoUser._id },
          { $set: { timezone, updatedAt: new Date() } },
        );
      }
    }

    const hasHandle = !!(mongoUser?.handle);

    // Set httpOnly session cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ ok: true, hasHandle });
  } catch (err) {
    console.error("[auth/session] error:", err);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
