import { NextRequest, NextResponse } from "next/server";
import { getCollections } from "@/lib/mongo/collections";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/cleanup-captures
 * Called by the DigitalOcean scheduled job daily at 03:00 UTC.
 * Prunes LLM input/output blobs from captures older than 30 days
 * (respects the user's voice_retention = false setting — audio files
 * are already deleted at upload time when retention is off; this
 * removes the stored transcript text).
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { captures } = await getCollections();
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await captures.updateMany(
      { createdAt: { $lt: cutoff }, llmInput: { $exists: true } },
      { $unset: { llmInput: "", llmOutput: "", audioUrl: "" } }
    );

    return NextResponse.json({
      ok: true,
      cleaned: result.modifiedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/cleanup-captures] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
