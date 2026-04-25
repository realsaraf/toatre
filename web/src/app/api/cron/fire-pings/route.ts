import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/fire-pings
 * Called by the DigitalOcean scheduled job every minute.
 * Finds due reminders and dispatches them via the appropriate channel
 * (push → FCM, email → Resend, SMS → Twilio).
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // TODO Phase 4: import and call dispatchDuePings()
    // const { fired, errors } = await dispatchDuePings();
    const fired = 0;
    const errors = 0;

    return NextResponse.json({
      ok: true,
      fired,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/fire-pings] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
