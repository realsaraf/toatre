import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { serializeToat } from "@/app/api/toats/route";
import {
  deleteToatPushReminders,
  syncToatPushReminders,
} from "@/lib/pings/compute";
import { deleteFromSpaces } from "@/lib/storage/spaces";

/**
 * POST /api/captures/[id]/commit
 *
 * Keeps selected toats, deletes unselected ones, and persists any manually added review toats for a capture.
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
          title: z.string().max(200).optional(),
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
  const captureToatIds = new Set(captureToats.map((toat) => toat._id.toString()));

  // Delete unselected toats
  const unselectedIds = captureToats
    .filter((t) => !selectedSet.has(t._id.toString()))
    .map((t) => t._id);

  if (unselectedIds.length > 0) {
    await toats.deleteMany({ _id: { $in: unselectedIds }, ownerId });
    for (const unselectedId of unselectedIds) {
      await deleteToatPushReminders({
        userId: user.mongoId,
        toatId: unselectedId.toString(),
      });
    }
    // Clean up any Spaces attachments on the deleted toats (fire-and-forget per key)
    const unselectedWithAttachments = captureToats.filter(
      (t) => !selectedSet.has(t._id.toString()) && Array.isArray(t.attachments) && (t.attachments as unknown[]).length > 0
    );
    if (unselectedWithAttachments.length > 0) {
      const keys: string[] = unselectedWithAttachments.flatMap(
        (t) => (t.attachments as Array<{ key: string }>).map((a) => a.key)
      );
      void Promise.allSettled(keys.map((key) => deleteFromSpaces(key)));
    }
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

  const addedToatDocs = selectedIds
    .filter((selectedId) => !captureToatIds.has(selectedId))
    .map((selectedId) => edits[selectedId])
    .filter((edit) => edit?.title?.trim())
    .map((edit) => ({
      ownerId,
      captureId: captureOid,
      tier: edit.tier ?? "regular",
      state: "open" as const,
      title: edit.title!.trim(),
      notes: edit.notes ?? null,
      enrichments: edit.enrichments ?? {},
      createdAt: now,
      updatedAt: now,
    }));

  let addedOids: ObjectId[] = [];
  if (addedToatDocs.length > 0) {
    const result = await toats.insertMany(addedToatDocs);
    addedOids = Object.values(result.insertedIds) as ObjectId[];
  }

  // Return the kept toats
  const keptOids = captureToats
    .filter((t) => selectedSet.has(t._id.toString()))
    .map((t) => t._id);
  keptOids.push(...addedOids);

  const savedToats = await toats.find({ _id: { $in: keptOids }, ownerId }).toArray();
  for (const toat of savedToats) {
    await syncToatPushReminders(toat);
  }

  return NextResponse.json({
    toats: savedToats.map(serializeToat),
  });
}

