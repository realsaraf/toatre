import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { resolveAccessLevel } from "@/lib/auth/access-policy";

/**
 * Returns the current authenticated user's profile.
 * Auth: `Authorization: Bearer <firebase-id-token>`.
 *
 * Mirrors the Mutqin pattern — pure Bearer, no session cookies. Mobile and
 * web call this after sign-in to discover whether the user has set a handle.
 */
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  try {
    const { users } = await getCollections();
    const mongoUser = await users.findOne({ firebaseUid: user.uid });
    const accessLevel = await resolveAccessLevel(user.email ?? null);

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      handle: mongoUser?.handle ?? null,
      displayName: mongoUser?.displayName ?? null,
      photoUrl: mongoUser?.photoUrl ?? null,
      accessLevel,
    });
  } catch (error) {
    console.error("[auth/me] failed", error);
    return NextResponse.json(
      {
        error: "internal",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
