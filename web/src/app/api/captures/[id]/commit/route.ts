import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { serializeToat } from "@/app/api/toats/route";

/**
 * POST /api/captures/[id]/commit
 *
 * Promotes selected pending toats to "active" and deletes unselected ones.
 * Body: { selectedIds: string[] }
 *
 * Returns: { toats: SerializedToat[] } — only the promoted toats
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
    // Client may also send back edited toat fields keyed by id
    edits: z
      .record(
        z.string(),
        z.object({
          title: z.string().optional(),
          tier: z.enum(["urgent", "important", "regular"]).optional(),
          datetime: z.string().nullable().optional(),
          endDatetime: z.string().nullable().optional(),
          location: z.string().nullable().optional(),
          link: z.string().nullable().optional(),
          people: z.array(z.string()).optional(),
          notes: z.string().nullable().optional(),
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

  // Fetch all pending toats for this capture (owned by this user)
  const pendingToats = await toats
    .find({
      captureId: captureOid,
      ownerId,
      status: "pending",
    })
    .toArray();

  const selectedSet = new Set(selectedIds);

  // Delete unselected pending toats
  const unselectedIds = pendingToats
    .filter((t) => !selectedSet.has(t._id.toString()))
    .map((t) => t._id);

  if (unselectedIds.length > 0) {
    await toats.deleteMany({ _id: { $in: unselectedIds }, ownerId });
  }

  // Promote selected to active, applying any edits
  const now = new Date();
  for (const toat of pendingToats) {
    const toatIdStr = toat._id.toString();
    if (!selectedSet.has(toatIdStr)) continue;

    const edit = edits[toatIdStr];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {
      status: "active",
      updatedAt: now,
    };

    if (edit) {
      if (edit.title !== undefined) update.title = edit.title;
      if (edit.tier !== undefined) update.tier = edit.tier;
      if (edit.datetime !== undefined)
        update.datetime = edit.datetime ? new Date(edit.datetime) : null;
      if (edit.endDatetime !== undefined)
        update.endDatetime = edit.endDatetime ? new Date(edit.endDatetime) : null;
      if (edit.location !== undefined) update.location = edit.location;
      if (edit.link !== undefined) update.link = edit.link;
      if (edit.people !== undefined) update.people = edit.people;
      if (edit.notes !== undefined) update.notes = edit.notes;
    }

    await toats.updateOne({ _id: toat._id, ownerId }, { $set: update });
  }

  // Return the promoted toats
  const promotedOids = pendingToats
    .filter((t) => selectedSet.has(t._id.toString()))
    .map((t) => t._id);

  const savedToats = await toats.find({ _id: { $in: promotedOids }, ownerId }).toArray();

  return NextResponse.json({
    toats: savedToats.map(serializeToat),
  });
}
