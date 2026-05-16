import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth/access-policy";
import { requireUser } from "@/lib/auth/require-user";

export async function requireAdminUser(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) {
    return { user: null, errorResponse } as const;
  }

  const isAdmin = isAdminEmail(user.email);
  const usedGoogle = user.signInProvider === "google.com";

  if (!isAdmin || !usedGoogle) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          error: "admin_forbidden",
          message: "Admin access requires realsaraf@gmail.com signed in with Google.",
        },
        { status: 403 }
      ),
    } as const;
  }

  return { user, errorResponse: null } as const;
}
