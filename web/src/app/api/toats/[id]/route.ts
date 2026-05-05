import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { migrateTemplateData, migrateStatus, type Enrichments } from "@/types";
import { EnrichmentsSchema } from "@/lib/ai/extract";

// â”€â”€â”€ GET /api/toats/[id] â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid toat id" }, { status: 400 });
  }

  const { toats } = await getCollections();
  const doc = await toats.findOne({
    _id: new ObjectId(id),
    ownerId: new ObjectId(user.mongoId),
  });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ toat: serializeToat(doc) });
}

// â”€â”€â”€ PATCH /api/toats/[id] â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid toat id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const PatchSchema = z.object({
    tier: z.enum(["urgent", "important", "regular"]).optional(),
    title: z.string().min(1).max(200).optional(),
    notes: z.string().nullable().optional(),
    state: z.enum(["open", "done", "archived"]).optional(),
    enrichments: EnrichmentsSchema.optional(),
    // Shallow merge for individual enrichment blocks
    "enrichments.time": EnrichmentsSchema.shape.time.optional(),
    "enrichments.people": EnrichmentsSchema.shape.people.optional(),
    "enrichments.place": EnrichmentsSchema.shape.place.optional(),
    "enrichments.action": EnrichmentsSchema.shape.action.optional(),
    "enrichments.communication": EnrichmentsSchema.shape.communication.optional(),
    "enrichments.event": EnrichmentsSchema.shape.event.optional(),
    "enrichments.money": EnrichmentsSchema.shape.money.optional(),
    "enrichments.thought": EnrichmentsSchema.shape.thought.optional(),
    // Legacy compat â€” callers may still send templateData
    templateData: z.record(z.string(), z.unknown()).optional(),
  });

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 422 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const $set: Record<string, any> = { updatedAt: new Date() };
  const data = parsed.data;

  if (data.tier !== undefined) $set.tier = data.tier;
  if (data.title !== undefined) $set.title = data.title;
  if (data.notes !== undefined) $set.notes = data.notes;
  if (data.state !== undefined) $set.state = data.state;
  if (data.enrichments !== undefined) $set.enrichments = data.enrichments;

  // Support dot-notation enrichment patches (e.g. patching just one block)
  const enrichmentKeys = ["time", "people", "place", "action", "communication", "event", "money", "thought"] as const;
  for (const key of enrichmentKeys) {
    const dotKey = `enrichments.${key}` as keyof typeof data;
    if (data[dotKey] !== undefined) $set[`enrichments.${key}`] = data[dotKey];
  }

  const { toats } = await getCollections();
  const result = await toats.findOneAndUpdate(
    { _id: new ObjectId(id), ownerId: new ObjectId(user.mongoId) },
    { $set },
    { returnDocument: "after" }
  );

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ toat: serializeToat(result) });
}

// â”€â”€â”€ DELETE /api/toats/[id] â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid toat id" }, { status: 400 });
  }

  const { toats } = await getCollections();
  const result = await toats.deleteOne({
    _id: new ObjectId(id),
    ownerId: new ObjectId(user.mongoId),
  });

  if (result.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// â”€â”€â”€ Serializer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeToat(doc: any) {
  const enrichments: Enrichments = doc.enrichments
    ? doc.enrichments
    : migrateTemplateData(doc);

  return {
    id: doc._id.toString(),
    tier: doc.tier ?? "regular",
    state: doc.state ?? migrateStatus(doc.status),
    title: doc.title,
    notes: doc.notes ?? null,
    enrichments,
    captureId: doc.captureId?.toString() ?? null,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}
