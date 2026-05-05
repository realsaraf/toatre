import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { migrateTemplateData, migrateStatus, type Enrichments } from "@/types";
import { EnrichmentsSchema } from "@/lib/ai/extract";

const ToatQuerySchema = z.object({
  range: z.enum(["today", "week", "upcoming", "past", "all"]).optional().default("all"),
});

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const parsed = ToatQuerySchema.safeParse({ range: searchParams.get("range") ?? undefined });
  const range = parsed.success ? parsed.data.range : "all";

  const { toats } = await getCollections();
  const ownerId = new ObjectId(user.mongoId);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {
    ownerId,
    // Support both old status field and new state field
    $nor: [
      { state: { $in: ["done", "archived"] } },
      { status: { $in: ["cancelled", "done"] } },
    ],
  };

  if (range === "today") filter["enrichments.time.at"] = { $gte: startOfToday.toISOString(), $lt: endOfToday.toISOString() };
  else if (range === "week") filter["enrichments.time.at"] = { $gte: endOfToday.toISOString(), $lt: endOfWeek.toISOString() };
  else if (range === "upcoming") filter["enrichments.time.at"] = { $gte: endOfWeek.toISOString() };
  else if (range === "past") filter["enrichments.time.at"] = { $lt: startOfToday.toISOString() };

  const docs = await toats.find(filter).sort({ "enrichments.time.at": 1, createdAt: 1 }).limit(200).toArray();
  return NextResponse.json({ toats: docs.map(serializeToat) });
}

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const BodySchema = z.object({
    tier: z.enum(["urgent", "important", "regular"]).optional().default("regular"),
    title: z.string().min(1).max(200),
    notes: z.string().nullable().optional(),
    enrichments: EnrichmentsSchema.optional().default({}),
  });

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 422 });
  }

  const { toats } = await getCollections();
  const ownerId = new ObjectId(user.mongoId);
  const now = new Date();

  const doc = {
    ownerId,
    captureId: null,
    tier: parsed.data.tier,
    state: "open" as const,
    title: parsed.data.title,
    notes: parsed.data.notes ?? null,
    enrichments: parsed.data.enrichments as Enrichments,
    createdAt: now,
    updatedAt: now,
  };

  const result = await toats.insertOne(doc);
  const saved = await toats.findOne({ _id: result.insertedId });
  return NextResponse.json({ toat: serializeToat(saved!) }, { status: 201 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeToat(doc: any) {
  // Normalise enrichments: new docs have enrichments field; old docs have templateData
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
