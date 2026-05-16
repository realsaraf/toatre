import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getCollections } from "@/lib/mongo/collections";
import { resolveAccessLevel } from "@/lib/auth/access-policy";

export interface AuthenticatedUser {
  uid: string;           // Firebase UID
  email: string | null;
  mongoId: string;       // MongoDB _id as string
  signInProvider: string | null;
}

function requestedTimezone(request: NextRequest): string | null {
  const value = request.headers.get("x-toatre-timezone")?.trim();
  return value ? value : null;
}

/**
 * Verify the Firebase ID token from the Authorization header.
 * Returns the user or throws a 401 response.
 *
 * Usage in API route:
 *   const { user, errorResponse } = await requireUser(request);
 *   if (errorResponse) return errorResponse;
 */
export async function requireUser(
  request: NextRequest
): Promise<{ user: AuthenticatedUser; errorResponse: null } | { user: null; errorResponse: NextResponse }> {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Missing Authorization header", v: "v2-mongo-trycatch" },
        { status: 401 }
      ),
    };
  }

  const idToken = authorization.slice(7);

  let decodedToken;
  try {
    decodedToken = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }

  let mongoUser;
  try {
    const timezone = requestedTimezone(request);
    const { users, settings } = await getCollections();
    mongoUser = await users.findOne({ firebaseUid: decodedToken.uid });

    if (!mongoUser) {
      // First-time login — create the user record.
      const now = new Date();
      const result = await users.insertOne({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email ?? null,
        handle: null,
        displayName: decodedToken.name ?? null,
        photoUrl: decodedToken.picture ?? null,
        timezone: timezone ?? "UTC",
        createdAt: now,
        updatedAt: now,
      });
      mongoUser = await users.findOne({ _id: result.insertedId });
    } else if (timezone && mongoUser.timezone === "UTC") {
      const settingsDoc = await settings.findOne({ userId: mongoUser._id.toString() });
      const hasSavedTimezone =
        typeof settingsDoc?.timezone === "string" && settingsDoc.timezone.trim().length > 0;

      if (!hasSavedTimezone) {
        const now = new Date();
        await users.updateOne(
          { _id: mongoUser._id },
          { $set: { timezone, updatedAt: now } },
        );
        mongoUser = { ...mongoUser, timezone, updatedAt: now };
      }
    }
  } catch (error) {
    console.error("[requireUser] mongo failure", error);
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          error: "User store unavailable",
          message: error instanceof Error ? error.message : String(error),
          v: "v3-mongo-wrap",
        },
        { status: 500 }
      ),
    };
  }

  const accessLevel = await resolveAccessLevel(decodedToken.email ?? null);
  if (accessLevel === "blocked") {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          error: "invite_only_preview",
          message: "Toatre is currently invite-only preview.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user: {
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
      mongoId: mongoUser!._id.toString(),
      signInProvider: typeof decodedToken.firebase?.sign_in_provider === "string"
        ? decodedToken.firebase.sign_in_provider
        : null,
    },
    errorResponse: null,
  };
}
