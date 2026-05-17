import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";

// ─── DELETE /api/toats/[id]/links/[linkId] ──────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> },
) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { id, linkId } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid toat ID" }, { status: 400 });
  }

  const { toats } = await getCollections();

  // Verify ownership and remove the link atomically
  const result = await toats.updateOne(
    { _id: new ObjectId(id), ownerId: new ObjectId(user.mongoId) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { $pull: { links: { id: linkId } as any }, $set: { updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Toat not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
