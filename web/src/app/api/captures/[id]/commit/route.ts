import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { serializeToat } from "@/app/api/toats/route";

/**
 * POST /api/captures/[id]/commit
 *
 * Keeps selected toats and deletes unselected ones for a capture.
 * Body: { selectedIds: string[], edits?: Record<id, partial-toat> }
 *
 * Returns: { toats: SerializedToat[] } — only the kept toats
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { id: captureId } = await params;
  if (!ObjectId.isValid(captureId)) {
    return NextResponse.json({ error: "Invalid capture id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const BodySchema = z.object({
    selectedIds: z.array(z.string()),
    edits: z
      .record(
        z.string(),
        z.object({
          title: z.string().optional(),
          tier: z.enum(["urgent", "important", "regular"]).optional(),
          notes: z.string().nullable().optional(),
          enrichments: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .optional()
      .default({}),
  });

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { selectedIds, edits } = parsed.data;
  const ownerId = new ObjectId(user.mongoId);
  const captureOid = new ObjectId(captureId);
  const { toats } = await getCollections();

  // Fetch all toats for this capture owned by this user
  const captureToats = await toats
    .find({ captureId: captureOid, ownerId })
    .toArray();

  const selectedSet = new Set(selectedIds);

  // Delete unselected toats
  const unselectedIds = captureToats
    .filter((t) => !selectedSet.has(t._id.toString()))
    .map((t) => t._id);

  if (unselectedIds.length > 0) {
    await toats.deleteMany({ _id: { $in: unselectedIds }, ownerId });
  }

  // Apply any edits to selected toats
  const now = new Date();
  for (const toat of captureToats) {
    const toatIdStr = toat._id.toString();
    if (!selectedSet.has(toatIdStr)) continue;

    const edit = edits[toatIdStr];
    if (!edit) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = { updatedAt: now };
    if (edit.title !== undefined) update.title = edit.title;
    if (edit.tier !== undefined) update.tier = edit.tier;
    if (edit.notes !== undefined) update.notes = edit.notes;
    if (edit.enrichments !== undefined) update.enrichments = { ...toat.enrichments, ...edit.enrichments };

    await toats.updateOne({ _id: toat._id, ownerId }, { $set: update });
  }

  // Return the kept toats
  const keptOids = captureToats
    .filter((t) => selectedSet.has(t._id.toString()))
    .map((t) => t._id);

  const savedToats = await toats.find({ _id: { $in: keptOids }, ownerId }).toArray();

  return NextResponse.json({
    toats: savedToats.map(serializeToat),
  });
}

