import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongo/collections";
import { sendBookingNotification } from "@/lib/email/booking";
import { notifyUserDevices } from "@/lib/pings/notify-devices";

const RequestSchema = z.object({
  slotStart: z.string().datetime({ offset: true }),
  slotEnd: z.string().datetime({ offset: true }),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(30).nullable().optional(),
  bookerHandle: z.string().max(50).nullable().optional(),
  message: z.string().max(500).nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 422 });
  }

  const { users, bookingSettings, bookingRequests, toats } = await getCollections();

  // Resolve host handle → user
  const cleanHandle = handle.replace(/^@/, '').toLowerCase();
  const ownerDoc = await users.findOne({ handle: cleanHandle });
  if (!ownerDoc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bsDoc = await bookingSettings.findOne({ userId: ownerDoc._id.toString() });
  if (!bsDoc || bsDoc.enabled !== true) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const slotStart = new Date(parsed.data.slotStart);
  const slotEnd = new Date(parsed.data.slotEnd);

  // Validate slot isn't in the past
  const advanceMs = ((typeof bsDoc.advanceNoticeMinutes === "number" ? bsDoc.advanceNoticeMinutes : 60)) * 60000;
  if (slotStart.getTime() < Date.now() + advanceMs) {
    return NextResponse.json({ error: "This slot is no longer available." }, { status: 409 });
  }

  // Clash check: existing toats
  const ownerId = new ObjectId(ownerDoc._id);
  const clashingToat = await toats.findOne({
    ownerId,
    $nor: [
      { state: { $in: ["done", "archived"] } },
      { status: { $in: ["cancelled", "done"] } },
    ],
    $or: [
      { "enrichments.time.at": { $gte: slotStart.toISOString(), $lt: slotEnd.toISOString() } },
      { "enrichments.time.startAt": { $gte: slotStart.toISOString(), $lt: slotEnd.toISOString() } },
    ],
  });
  if (clashingToat) {
    return NextResponse.json({ error: "This slot is no longer available." }, { status: 409 });
  }

  // Clash check: existing pending/accepted booking requests
  const clashingRequest = await bookingRequests.findOne({
    ownerId,
    state: { $ne: "denied" },
    slotStart: { $lt: slotEnd },
    slotEnd: { $gt: slotStart },
  });
  if (clashingRequest) {
    return NextResponse.json({ error: "This slot is no longer available." }, { status: 409 });
  }

  // Resolve booker's handle to a userId if provided
  let bookerUserId: string | null = null;
  const rawHandle = parsed.data.bookerHandle?.replace(/^@+/, "").toLowerCase() ?? null;
  if (rawHandle) {
    const bookerDoc = await users.findOne({ handle: rawHandle });
    if (bookerDoc) bookerUserId = bookerDoc._id.toString();
  }

  const now = new Date();
  const ownerMongoId = ownerDoc._id.toString();

  // Create the inbox toat for the owner
  const slotLabel = slotStart.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  const toatTitle = `${parsed.data.name} wants to meet — ${slotLabel}`;

  const toatDoc = {
    ownerId,
    captureId: null,
    tier: "important" as const,
    state: "open" as const,
    title: toatTitle,
    notes: parsed.data.message ?? null,
    enrichments: {
      time: {
        at: slotStart.toISOString(),
        endAt: slotEnd.toISOString(),
        duration: Math.round((slotEnd.getTime() - slotStart.getTime()) / 60000),
      },
      communication: {
        contact: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        channel: "message" as const,
        message: parsed.data.message ?? null,
      },
    },
    bookingRequestId: null as string | null, // filled below after request is created
    source: "booking_request" as const,
    createdAt: now,
    updatedAt: now,
  };

  const toatResult = await toats.insertOne(toatDoc);
  const toatId = toatResult.insertedId.toString();

  // Create the booking request
  const reqDoc = {
    ownerId,
    toatId,
    slotStart,
    slotEnd,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    bookerHandle: rawHandle,
    bookerUserId,
    message: parsed.data.message ?? null,
    state: "pending" as const,
    createdAt: now,
    updatedAt: now,
  };
  const reqResult = await bookingRequests.insertOne(reqDoc);
  const requestId = reqResult.insertedId.toString();

  // Back-link the toat to the request
  await toats.updateOne({ _id: toatResult.insertedId }, { $set: { bookingRequestId: requestId } });

  // Notify owner via email + push
  const ownerEmail = typeof ownerDoc.email === "string" ? ownerDoc.email : null;
  const ownerName = typeof ownerDoc.displayName === "string" ? ownerDoc.displayName : handle;
  if (ownerEmail) {
    void sendBookingNotification({
      type: "new_request",
      toEmail: ownerEmail,
      ownerName,
      bookerName: parsed.data.name,
      bookerEmail: parsed.data.email,
      slotStart,
      slotEnd,
      message: parsed.data.message ?? null,
      toatId,
    }).catch(() => null);
  }

  void notifyUserDevices(ownerMongoId, {
    action: "booking_request",
    toatId,
    "notification-title": "New booking request",
    "notification-body": `${parsed.data.name} wants to meet on ${slotLabel}`,
  }).catch(() => null);

  return NextResponse.json({ requestId }, { status: 201 });
}
