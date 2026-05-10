import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";

const DEFAULT_SETTINGS = {
  enabled: false,
  greetingMessage: "",
  pageTitle: "Let's find a time that works for you.",
  metaDescription: "Book a 1-on-1 session with me. Simple, quick and hassle-free.",
  windowDays: [1, 2, 3, 4, 5],
  windowStart: "09:00",
  windowEnd: "17:00",
  slotLength: 30 as 15 | 30 | 45 | 60,
  bufferMinutes: 15,
  advanceNoticeMinutes: 60,
  maxDaysAhead: 14,
  requireReason: false,
  disableDuringOfficeHours: false,
};

function isBookingSlotLength(input: unknown): input is 15 | 30 | 45 | 60 {
  return input === 15 || input === 30 || input === 45 || input === 60;
}

function serializeBookingSettings(doc: Record<string, unknown> | null, timezone: string) {
  if (!doc) return { ...DEFAULT_SETTINGS, timezone };
  return {
    enabled: doc.enabled === true,
    greetingMessage:
      typeof doc.greetingMessage === "string" ? doc.greetingMessage : DEFAULT_SETTINGS.greetingMessage,
    pageTitle:
      typeof doc.pageTitle === "string" && doc.pageTitle.trim().length > 0
        ? doc.pageTitle
        : DEFAULT_SETTINGS.pageTitle,
    metaDescription:
      typeof doc.metaDescription === "string" && doc.metaDescription.trim().length > 0
        ? doc.metaDescription
        : DEFAULT_SETTINGS.metaDescription,
    windowDays: Array.isArray(doc.windowDays) ? (doc.windowDays as number[]) : DEFAULT_SETTINGS.windowDays,
    windowStart: typeof doc.windowStart === "string" ? doc.windowStart : DEFAULT_SETTINGS.windowStart,
    windowEnd: typeof doc.windowEnd === "string" ? doc.windowEnd : DEFAULT_SETTINGS.windowEnd,
    slotLength: isBookingSlotLength(doc.slotLength) ? doc.slotLength : DEFAULT_SETTINGS.slotLength,
    bufferMinutes: typeof doc.bufferMinutes === "number" ? doc.bufferMinutes : DEFAULT_SETTINGS.bufferMinutes,
    advanceNoticeMinutes: typeof doc.advanceNoticeMinutes === "number" ? doc.advanceNoticeMinutes : DEFAULT_SETTINGS.advanceNoticeMinutes,
    maxDaysAhead: typeof doc.maxDaysAhead === "number" ? doc.maxDaysAhead : DEFAULT_SETTINGS.maxDaysAhead,
    requireReason: doc.requireReason === true,
    disableDuringOfficeHours: doc.disableDuringOfficeHours === true,
    timezone: typeof doc.timezone === "string" ? doc.timezone : timezone,
  };
}

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { bookingSettings, users, settings } = await getCollections();
  const [bookingDoc, userDoc, settingsDoc] = await Promise.all([
    bookingSettings.findOne({ userId: user.mongoId }),
    users.findOne({ _id: new ObjectId(user.mongoId) }),
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
  greetingMessage: z.string().max(2000).optional(),
  pageTitle: z.string().min(1).max(120).optional(),
  metaDescription: z.string().min(1).max(240).optional(),
  windowDays: z.array(z.number().int().min(0).max(6)).optional(),
  windowStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  windowEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  slotLength: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]).optional(),
  bufferMinutes: z.number().int().min(0).max(60).optional(),
  advanceNoticeMinutes: z.number().int().min(0).max(1440).optional(),
  maxDaysAhead: z.number().int().min(1).max(90).optional(),
  requireReason: z.boolean().optional(),
  disableDuringOfficeHours: z.boolean().optional(),
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
