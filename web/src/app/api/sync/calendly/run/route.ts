import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { syncAllCalendly, syncCalendlyForUser } from "@/lib/sync/calendly";

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const stats = await syncCalendlyForUser(user.mongoId);
  return NextResponse.json({ ok: true, stats });
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await syncAllCalendly();
  return NextResponse.json({ ok: true, stats });
}
