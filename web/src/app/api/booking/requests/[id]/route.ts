import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { sendBookingNotification } from "@/lib/email/booking";
import { notifyUserDevices } from "@/lib/pings/notify-devices";
import { createGoogleMeetEvent } from "@/lib/sync/google-calendar";

const PatchSchema = z.object({
  state: z.enum(["accepted", "denied"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 422 });
  }

  const { bookingRequests, users, toats } = await getCollections();

  let requestId: ObjectId;
  try { requestId = new ObjectId(id); }
  catch { return NextResponse.json({ error: "Invalid id" }, { status: 400 }); }

  const reqDoc = await bookingRequests.findOne({ _id: requestId });
  if (!reqDoc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only the owner can accept/deny
  if (reqDoc.ownerId.toString() !== user.mongoId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (reqDoc.state !== "pending") {
    return NextResponse.json({ error: "Already resolved" }, { status: 409 });
  }

  const now = new Date();
  const newState = parsed.data.state;

  await bookingRequests.updateOne(
    { _id: requestId },
    { $set: { state: newState, updatedAt: now } },
  );

  // If denied, archive the inbox toat
  if (newState === "denied" && reqDoc.toatId) {
    await toats.updateOne(
      { _id: new ObjectId(reqDoc.toatId as string) },
      { $set: { state: "archived", updatedAt: now } },
    );
  }

  // Notify the booker via email
  const ownerDoc = await users.findOne({ _id: new ObjectId(user.mongoId) });
  const ownerName = typeof ownerDoc?.displayName === "string" ? ownerDoc.displayName : user.email ?? "Toatre";

  // Create Google Meet when accepted
  let meetLink: string | null = null;
  if (newState === "accepted") {
    const ownerEmail = typeof ownerDoc?.email === "string" ? ownerDoc.email : null;
    if (ownerEmail) {
      meetLink = await createGoogleMeetEvent(user.mongoId, {
        ownerEmail,
        ownerName,
        bookerEmail: reqDoc.email as string,
        bookerName: reqDoc.name as string,
        slotStart: new Date(reqDoc.slotStart as Date),
        slotEnd: new Date(reqDoc.slotEnd as Date),
        message: (reqDoc.message as string | null) ?? null,
      }).catch(() => null);

      if (meetLink) {
        await bookingRequests.updateOne(
          { _id: requestId },
          { $set: { meetLink, updatedAt: now } },
        );
      }
    }
  }

  void sendBookingNotification({
    type: newState === "accepted" ? "accepted" : "denied",
    toEmail: reqDoc.email as string,
    ownerName,
    bookerName: reqDoc.name as string,
    bookerEmail: reqDoc.email as string,
    slotStart: new Date(reqDoc.slotStart as Date),
    slotEnd: new Date(reqDoc.slotEnd as Date),
    message: null,
    toatId: reqDoc.toatId as string | null,
    meetLink: meetLink ?? null,
  }).catch(() => null);

  // Push notification to booker if they have a Toatre account
  if (reqDoc.bookerUserId) {
    const stateLabel = newState === "accepted" ? "accepted" : "declined";
    const slotLabel = new Date(reqDoc.slotStart as Date).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
    void notifyUserDevices(reqDoc.bookerUserId as string, {
      action: "booking_response",
      "notification-title": `Booking ${stateLabel}`,
      "notification-body": `${ownerName} ${stateLabel} your request for ${slotLabel}`,
    }).catch(() => null);
  }

  return NextResponse.json({ state: newState });
}
