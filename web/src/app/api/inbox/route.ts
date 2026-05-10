import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { migrateTemplateData, migrateStatus, type Enrichments } from "@/types";

type BookingRequestState = "pending" | "accepted" | "denied";

type InboxBookingRequest = {
  id: string;
  toatId: string | null;
  title: string;
  slotStart: string;
  slotEnd: string;
  name: string;
  email: string;
  phone: string | null;
  bookerHandle: string | null;
  message: string | null;
  state: BookingRequestState;
  location: string | null;
  createdAt: string;
  updatedAt: string;
};

interface BookingRequestDocument {
  _id: ObjectId;
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

interface UserDocument {
  _id: ObjectId;
  displayName?: string | null;
  email?: string | null;
  handle?: string | null;
  photoUrl?: string | null;
}

interface ShareDocument {
  _id: ObjectId;
  ownerId?: ObjectId | string;
  toatId?: ObjectId | string;
  token?: string;
  role?: string;
  scope?: string;
  recipientName?: string | null;
  recipientRelationship?: string | null;
  recipientHandle?: string | null;
  recipientEmail?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface ToatDocument {
  _id: ObjectId;
  title?: string;
  tier?: string;
  state?: string;
  status?: string;
  notes?: string | null;
  captureId?: ObjectId | string | null;
  enrichments?: Enrichments;
  template?: string;
  templateData?: unknown;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface ConnectionDocument {
  handle?: string | null;
  email?: string | null;
  name?: string | null;
  relationship?: string | null;
}

function asDate(value: Date | string | undefined): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return new Date(0);
}

function toIso(value: Date | string | undefined): string {
  return asDate(value).toISOString();
}

function toObjectId(value: ObjectId | string | undefined | null): ObjectId | null {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) return new ObjectId(value);
  return null;
}

function locationFromEnrichments(enrichments: Enrichments | undefined): string | null {
  return (
    enrichments?.place?.address ??
    enrichments?.place?.placeName ??
    enrichments?.event?.venueName ??
    enrichments?.event?.address ??
    null
  );
}

function serializeToat(doc: ToatDocument) {
  const enrichments: Enrichments = doc.enrichments ? doc.enrichments : migrateTemplateData(doc);
  return {
    id: doc._id.toString(),
    tier: doc.tier ?? "regular",
    state: doc.state ?? migrateStatus(doc.status),
    title: doc.title ?? "Shared toat",
    notes: doc.notes ?? null,
    enrichments,
    captureId: doc.captureId?.toString() ?? null,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

function serializeBookingRequest(doc: BookingRequestDocument, toat: ToatDocument | undefined): InboxBookingRequest {
  const enrichments: Enrichments | undefined = toat?.enrichments ? toat.enrichments : toat ? migrateTemplateData(toat) : undefined;
  return {
    id: doc._id.toString(),
    toatId: typeof doc.toatId === "string" ? doc.toatId : null,
    title: toat?.title ?? `${doc.name ?? "Someone"} wants to book time`,
    slotStart: toIso(doc.slotStart),
    slotEnd: toIso(doc.slotEnd),
    name: doc.name ?? "Unknown",
    email: doc.email ?? "",
    phone: doc.phone ?? null,
    bookerHandle: doc.bookerHandle ?? null,
    message: doc.message ?? null,
    state: doc.state ?? "pending",
    location: locationFromEnrichments(enrichments),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const ownerId = new ObjectId(user.mongoId);
  const { users, bookingRequests, toats, acl, connections } = await getCollections();
  const viewerDoc = await users.findOne({ _id: ownerId }) as UserDocument | null;
  const viewerHandle = typeof viewerDoc?.handle === "string" ? viewerDoc.handle.toLowerCase() : null;
  const viewerEmail = (typeof viewerDoc?.email === "string" ? viewerDoc.email : user.email)?.toLowerCase() ?? null;
  const now = new Date();

  const bookingDocs = (await bookingRequests
    .find({ ownerId, state: "pending", slotEnd: { $gte: now } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()) as BookingRequestDocument[];

  const bookingToatIds = bookingDocs
    .map((doc) => toObjectId(doc.toatId))
    .filter((id): id is ObjectId => id !== null);
  const bookingToatDocs = bookingToatIds.length > 0
    ? ((await toats.find({ _id: { $in: bookingToatIds }, ownerId }).toArray()) as ToatDocument[])
    : [];
  const bookingToatById = new Map(bookingToatDocs.map((doc) => [doc._id.toString(), doc]));

  const trustedConnectionDocs = (await connections.find({ ownerId }).toArray()) as ConnectionDocument[];
  const trustedHandles = new Set(trustedConnectionDocs.map((connection) => connection.handle?.toLowerCase()).filter((value): value is string => Boolean(value)));
  const trustedEmails = new Set(trustedConnectionDocs.map((connection) => connection.email?.toLowerCase()).filter((value): value is string => Boolean(value)));

  const recipientClauses: Record<string, string>[] = [];
  if (viewerHandle) recipientClauses.push({ recipientHandle: viewerHandle });
  if (viewerEmail) recipientClauses.push({ recipientEmail: viewerEmail });

  let shareDocs: ShareDocument[] = [];
  if (recipientClauses.length > 0) {
    shareDocs = (await acl
      .find({ scope: "connection", $or: recipientClauses })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()) as ShareDocument[];
  }

  const shareOwnerIds = shareDocs
    .map((share) => toObjectId(share.ownerId))
    .filter((id): id is ObjectId => id !== null);
  const shareToatIds = shareDocs
    .map((share) => toObjectId(share.toatId))
    .filter((id): id is ObjectId => id !== null);

  const [shareOwnerDocs, shareToatDocs] = await Promise.all([
    shareOwnerIds.length > 0 ? users.find({ _id: { $in: shareOwnerIds } }).toArray() as Promise<UserDocument[]> : Promise.resolve([]),
    shareToatIds.length > 0 ? toats.find({ _id: { $in: shareToatIds } }).toArray() as Promise<ToatDocument[]> : Promise.resolve([]),
  ]);
  const shareOwnerById = new Map(shareOwnerDocs.map((doc) => [doc._id.toString(), doc]));
  const shareToatById = new Map(shareToatDocs.map((doc) => [doc._id.toString(), doc]));

  const sharedToats = shareDocs
    .filter((share) => {
      const owner = toObjectId(share.ownerId);
      const ownerDoc = owner ? shareOwnerById.get(owner.toString()) : null;
      const ownerHandle = ownerDoc?.handle?.toLowerCase() ?? null;
      const ownerEmail = ownerDoc?.email?.toLowerCase() ?? null;
      return (
        (ownerHandle && trustedHandles.has(ownerHandle)) ||
        (ownerEmail && trustedEmails.has(ownerEmail)) ||
        trustedHandles.size + trustedEmails.size === 0
      );
    })
    .map((share) => {
      const toatId = toObjectId(share.toatId);
      const owner = toObjectId(share.ownerId);
      const toat = toatId ? shareToatById.get(toatId.toString()) : null;
      const ownerDoc = owner ? shareOwnerById.get(owner.toString()) : null;
      if (!toat || !share.token) return null;
      return {
        id: share._id.toString(),
        token: share.token,
        shareUrl: `/j/${share.token}`,
        role: typeof share.role === "string" ? share.role : "view",
        createdAt: toIso(share.createdAt),
        updatedAt: toIso(share.updatedAt),
        sender: {
          id: owner?.toString() ?? null,
          name: ownerDoc?.displayName ?? ownerDoc?.handle ?? "Connection",
          handle: ownerDoc?.handle ?? null,
          email: ownerDoc?.email ?? null,
          photoUrl: ownerDoc?.photoUrl ?? null,
        },
        recipient: {
          name: share.recipientName ?? null,
          relationship: share.recipientRelationship ?? null,
        },
        toat: serializeToat(toat),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return NextResponse.json({
    bookingRequests: bookingDocs.map((doc) => serializeBookingRequest(doc, typeof doc.toatId === "string" ? bookingToatById.get(doc.toatId) : undefined)),
    sharedToats,
  });
}
