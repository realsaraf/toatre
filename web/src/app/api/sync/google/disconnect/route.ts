import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { disconnectGoogleCalendar } from "@/lib/sync/google-calendar";

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  await disconnectGoogleCalendar(user.mongoId);
  return NextResponse.json({ ok: true });
}
