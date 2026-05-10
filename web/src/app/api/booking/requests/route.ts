import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";

type BookingRequestState = "pending" | "accepted" | "denied";
type BookingRange = "upcoming" | "past" | "all";

interface BookingRequestDocument {
  _id: ObjectId;
  ownerId: ObjectId | string;
  toatId?: string | null;
  slotStart?: Date | string;
  slotEnd?: Date | string;
  name?: string;
  email?: string;
  phone?: string | null;
  bookerHandle?: string | null;
  message?: string | null;
  state?: BookingRequestState;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface BookingToatDocument {
  _id: ObjectId;
  title?: string;
  enrichments?: {
    place?: { address?: string | null; placeName?: string | null };
    event?: { venueName?: string | null; address?: string | null };
    communication?: { contact?: string | null };
  };
}

function parseState(value: string | null): BookingRequestState | "all" {
  if (value === "pending" || value === "accepted" || value === "denied") return value;
  return "all";
}

function parseRange(value: string | null): BookingRange {
  if (value === "past" || value === "all") return value;
  return "upcoming";
}

function asDate(value: Date | string | undefined): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return new Date(0);
}

function toIso(value: Date | string | undefined): string {
  return asDate(value).toISOString();
}

function toBookingRequestDocument(value: unknown): BookingRequestDocument {
  return value as BookingRequestDocument;
}

function toBookingToatDocument(value: unknown): BookingToatDocument {
  return value as BookingToatDocument;
}

function locationFromToat(toat: BookingToatDocument | undefined): string | null {
  return (
    toat?.enrichments?.place?.address ??
    toat?.enrichments?.place?.placeName ??
    toat?.enrichments?.event?.venueName ??
    toat?.enrichments?.event?.address ??
    null
  );
}

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const state = parseState(searchParams.get("state"));
  const range = parseRange(searchParams.get("range"));
  const now = new Date();
  const ownerId = new ObjectId(user.mongoId);

  const { bookingRequests, toats } = await getCollections();
  const filter: Record<string, unknown> = { ownerId };

  if (state !== "all") filter.state = state;
  if (range === "upcoming") filter.slotEnd = { $gte: now };
  if (range === "past") filter.slotEnd = { $lt: now };

  const docs = (await bookingRequests
    .find(filter)
    .sort({ slotStart: range === "past" ? -1 : 1, createdAt: -1 })
    .limit(200)
    .toArray()).map(toBookingRequestDocument);

  const toatIds = docs
    .map((doc) => doc.toatId)
    .filter((id): id is string => typeof id === "string" && ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const toatDocs = toatIds.length > 0
    ? (await toats.find({ _id: { $in: toatIds }, ownerId }).toArray()).map(toBookingToatDocument)
    : [];
  const toatById = new Map(toatDocs.map((toat) => [toat._id.toString(), toat]));

  return NextResponse.json({
    requests: docs.map((doc) => {
      const toatId = typeof doc.toatId === "string" ? doc.toatId : null;
      const toat = toatId ? toatById.get(toatId) : undefined;
      return {
        id: doc._id.toString(),
        toatId,
        title: toat?.title ?? `${doc.name ?? "Someone"} booked time`,
        slotStart: toIso(doc.slotStart),
        slotEnd: toIso(doc.slotEnd),
        name: doc.name ?? "Unknown",
        email: doc.email ?? "",
        phone: doc.phone ?? null,
        bookerHandle: doc.bookerHandle ?? null,
        message: doc.message ?? null,
        state: doc.state ?? "pending",
        location: locationFromToat(toat),
        createdAt: toIso(doc.createdAt),
        updatedAt: toIso(doc.updatedAt),
      };
    }),
  });
}
