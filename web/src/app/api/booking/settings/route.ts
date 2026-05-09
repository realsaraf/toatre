import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";

const DEFAULT_SETTINGS = {
  enabled: false,
  windowDays: [1, 2, 3, 4, 5],
  windowStart: "09:00",
  windowEnd: "17:00",
  slotLength: 30 as 30 | 60,
  bufferMinutes: 0,
  advanceNoticeMinutes: 60,
  maxDaysAhead: 14,
};

function serializeBookingSettings(doc: Record<string, unknown> | null, timezone: string) {
  if (!doc) return { ...DEFAULT_SETTINGS, timezone };
  return {
    enabled: doc.enabled === true,
    windowDays: Array.isArray(doc.windowDays) ? (doc.windowDays as number[]) : DEFAULT_SETTINGS.windowDays,
    windowStart: typeof doc.windowStart === "string" ? doc.windowStart : DEFAULT_SETTINGS.windowStart,
    windowEnd: typeof doc.windowEnd === "string" ? doc.windowEnd : DEFAULT_SETTINGS.windowEnd,
    slotLength: doc.slotLength === 60 ? 60 : (30 as 30 | 60),
    bufferMinutes: typeof doc.bufferMinutes === "number" ? doc.bufferMinutes : DEFAULT_SETTINGS.bufferMinutes,
    advanceNoticeMinutes: typeof doc.advanceNoticeMinutes === "number" ? doc.advanceNoticeMinutes : DEFAULT_SETTINGS.advanceNoticeMinutes,
    maxDaysAhead: typeof doc.maxDaysAhead === "number" ? doc.maxDaysAhead : DEFAULT_SETTINGS.maxDaysAhead,
    timezone: typeof doc.timezone === "string" ? doc.timezone : timezone,
  };
}

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { bookingSettings, users, settings } = await getCollections();
  const [bookingDoc, userDoc, settingsDoc] = await Promise.all([
    bookingSettings.findOne({ userId: user.mongoId }),
    users.findOne({ _id: { $toString: user.mongoId } }),
    settings.findOne({ userId: user.mongoId }),
  ]);

  const timezone =
    (typeof settingsDoc?.timezone === "string" && settingsDoc.timezone) ||
    (typeof userDoc?.timezone === "string" && userDoc.timezone) ||
    "UTC";

  return NextResponse.json(serializeBookingSettings(bookingDoc as Record<string, unknown> | null, timezone));
}

const PatchSchema = z.object({
  enabled: z.boolean().optional(),
  windowDays: z.array(z.number().int().min(0).max(6)).optional(),
  windowStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  windowEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  slotLength: z.union([z.literal(30), z.literal(60)]).optional(),
  bufferMinutes: z.number().int().min(0).max(60).optional(),
  advanceNoticeMinutes: z.number().int().min(0).max(1440).optional(),
  maxDaysAhead: z.number().int().min(1).max(90).optional(),
});

export async function PATCH(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 422 });
  }

  const { bookingSettings, settings } = await getCollections();
  const settingsDoc = await settings.findOne({ userId: user.mongoId });
  const timezone = (typeof settingsDoc?.timezone === "string" && settingsDoc.timezone) || "UTC";

  const update = { ...parsed.data, timezone, updatedAt: new Date() };
  await bookingSettings.updateOne(
    { userId: user.mongoId },
    { $set: update, $setOnInsert: { userId: user.mongoId } },
    { upsert: true },
  );

  const updated = await bookingSettings.findOne({ userId: user.mongoId });
  return NextResponse.json(serializeBookingSettings(updated as Record<string, unknown> | null, timezone));
}
