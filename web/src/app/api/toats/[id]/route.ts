import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { ObjectId } from "mongodb";
import { z } from "zod";

// ─── GET /api/toats/[id] ──────────────────────────────────────────────────────
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

// ─── PATCH /api/toats/[id] ────────────────────────────────────────────────────
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
    kind: z.enum(["task", "event", "meeting", "errand", "deadline", "idea"]).optional(),
    tier: z.enum(["urgent", "important", "regular"]).optional(),
    title: z.string().min(1).max(200).optional(),
    datetime: z.string().nullable().optional(),
    endDatetime: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    link: z.string().url().nullable().optional(),
    people: z.array(z.string()).optional(),
    notes: z.string().nullable().optional(),
    status: z.enum(["active", "snoozed", "done", "cancelled", "archived"]).optional(),
  });

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 422 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const $set: Record<string, any> = { updatedAt: new Date() };
  const data = parsed.data;

  if (data.kind !== undefined) $set.kind = data.kind;
  if (data.tier !== undefined) $set.tier = data.tier;
  if (data.title !== undefined) $set.title = data.title;
  if (data.datetime !== undefined) $set.datetime = data.datetime ? new Date(data.datetime) : null;
  if (data.endDatetime !== undefined) $set.endDatetime = data.endDatetime ? new Date(data.endDatetime) : null;
  if (data.location !== undefined) $set.location = data.location;
  if (data.link !== undefined) $set.link = data.link;
  if (data.people !== undefined) $set.people = data.people;
  if (data.notes !== undefined) $set.notes = data.notes;
  if (data.status !== undefined) $set.status = data.status;

  const { toats } = await getCollections();
  const result = await toats.findOneAndUpdate(
    { _id: new ObjectId(id), ownerId: new ObjectId(user.mongoId) },
    { $set },
    { returnDocument: "after" }
  );

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ toat: serializeToat(result) });
}

// ─── DELETE /api/toats/[id] ───────────────────────────────────────────────────
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

// ─── Serializer ───────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeToat(doc: any) {
  return {
    id: doc._id.toString(),
    kind: doc.kind,
    tier: doc.tier ?? "regular",
    title: doc.title,
    datetime: doc.datetime ? (doc.datetime as Date).toISOString() : null,
    endDatetime: doc.endDatetime ? (doc.endDatetime as Date).toISOString() : null,
    location: doc.location ?? null,
    link: doc.link ?? null,
    people: doc.people ?? [],
    notes: doc.notes ?? null,
    status: doc.status ?? "active",
    captureId: doc.captureId?.toString() ?? null,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}
