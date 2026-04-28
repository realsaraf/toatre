import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { syncAllGoogleCalendars, syncGoogleCalendarForUser } from "@/lib/sync/google-calendar";

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const stats = await syncGoogleCalendarForUser(user.mongoId);
  return NextResponse.json({ ok: true, stats });
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await syncAllGoogleCalendars();
  return NextResponse.json({ ok: true, stats });
}
