import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { templateToKind, emptyTemplateData } from "@/types";
import { TemplateDataSchema, ToatTemplateSchema } from "@/lib/ai/extract";

const ToatQuerySchema = z.object({
  range: z.enum(["today", "week", "upcoming", "past", "all"]).optional().default("all"),
});

/**
 * GET /api/toats
 * Returns the authenticated user's toats, grouped-friendly sorted by datetime.
 */
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
  const filter: Record<string, any> = { ownerId, status: { $ne: "cancelled" } };

  if (range === "today") {
    filter.datetime = { $gte: startOfToday, $lt: endOfToday };
  } else if (range === "week") {
    filter.datetime = { $gte: endOfToday, $lt: endOfWeek };
  } else if (range === "upcoming") {
    filter.datetime = { $gte: endOfWeek };
  } else if (range === "past") {
    filter.datetime = { $lt: startOfToday };
  }

  const docs = await toats
    .find(filter)
    .sort({ datetime: 1, createdAt: 1 })
    .limit(200)
    .toArray();

  return NextResponse.json({
    toats: docs.map(serializeToat),
  });
}

/**
 * POST /api/toats
 * Manually create a single toat.
 */
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const BodySchema = z.object({
    template: ToatTemplateSchema,
    tier: z.enum(["urgent", "important", "regular"]).optional().default("regular"),
    title: z.string().min(1).max(200),
    datetime: z.string().nullable().optional(),
    endDatetime: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    link: z.string().url().nullable().optional(),
    people: z.array(z.string()).optional().default([]),
    notes: z.string().nullable().optional(),
    templateData: z.record(z.string(), z.unknown()).optional().nullable(),
  });

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 422 });
  }

  const { toats } = await getCollections();
  const ownerId = new ObjectId(user.mongoId);
  const now = new Date();
  const template = parsed.data.template;

  // Normalise templateData — inject discriminator and validate; fall back to empty shape.
  const rawTd = parsed.data.templateData != null
    ? { template, ...parsed.data.templateData }
    : { template };
  const tdResult = TemplateDataSchema.safeParse(rawTd);
  const templateData = tdResult.success ? tdResult.data : emptyTemplateData(template);

  const doc = {
    ownerId,
    captureId: null,
    template,
    kind: templateToKind(template),
    tier: parsed.data.tier,
    title: parsed.data.title,
    datetime: parsed.data.datetime ? new Date(parsed.data.datetime) : null,
    endDatetime: parsed.data.endDatetime ? new Date(parsed.data.endDatetime) : null,
    location: parsed.data.location ?? null,
    link: parsed.data.link ?? null,
    people: parsed.data.people,
    notes: parsed.data.notes ?? null,
    templateData,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const result = await toats.insertOne(doc);
  const saved = await toats.findOne({ _id: result.insertedId });

  return NextResponse.json({ toat: serializeToat(saved!) }, { status: 201 });
}

// ─── Serializer ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeToat(doc: any) {
  const template = doc.template ?? "task";
  return {
    id: doc._id.toString(),
    template,
    kind: doc.kind ?? templateToKind(template),
    tier: doc.tier ?? "regular",
    title: doc.title,
    datetime: doc.datetime ? (doc.datetime as Date).toISOString() : null,
    endDatetime: doc.endDatetime ? (doc.endDatetime as Date).toISOString() : null,
    location: doc.location ?? null,
    link: doc.link ?? null,
    people: doc.people ?? [],
    notes: doc.notes ?? null,
    status: doc.status ?? "active",
    templateData: doc.templateData ?? emptyTemplateData(template),
    captureId: doc.captureId?.toString() ?? null,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}
