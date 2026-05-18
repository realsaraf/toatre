import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongo/collections";
import { migrateTemplateData, migrateStatus, type Enrichments } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Missing share token." }, { status: 400 });
  }

  const { acl, toats, users } = await getCollections();
  const share = await acl.findOne({ token });
  const toatId = share?.toatId instanceof ObjectId ? share.toatId : null;
  const toat = toatId ? await toats.findOne({ _id: toatId }) : null;

  if (!share || !toat) {
    return NextResponse.json({ error: "Shared toat not found." }, { status: 404 });
  }

  const ownerId =
    share.ownerId instanceof ObjectId
      ? share.ownerId
      : ObjectId.isValid(String(share.ownerId))
        ? new ObjectId(String(share.ownerId))
        : null;
  const owner = ownerId ? await users.findOne({ _id: ownerId }) : null;
  const ownerName =
    (typeof owner?.displayName === "string" && owner.displayName) ||
    (typeof owner?.email === "string" && owner.email.split("@")[0]) ||
    "Someone";

  return NextResponse.json({
    toat: serializeToat(toat),
    share: {
      role: typeof share.role === "string" ? share.role : "view",
      scope: typeof share.scope === "string" ? share.scope : "link",
      ownerName,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeToat(doc: any) {
  const enrichments: Enrichments = doc.enrichments
    ? doc.enrichments
    : migrateTemplateData(doc);

  const attachments = Array.isArray(doc.attachments)
    ? doc.attachments.map((attachment: any) => ({
        id: attachment.id,
        label: attachment.label,
        mimeType: attachment.mimeType,
        size: attachment.size,
        createdAt: (attachment.createdAt instanceof Date
          ? attachment.createdAt
          : new Date(attachment.createdAt)).toISOString(),
      }))
    : [];

  const links = Array.isArray(doc.links)
    ? doc.links.map((link: any) => ({
        id: link.id,
        url: link.url,
        label: link.label,
        ogTitle: link.ogTitle ?? null,
        ogDescription: link.ogDescription ?? null,
        ogImage: link.ogImage ?? null,
        createdAt: (link.createdAt instanceof Date
          ? link.createdAt
          : new Date(link.createdAt)).toISOString(),
      }))
    : [];

  return {
    id: doc._id.toString(),
    tier: doc.tier ?? "regular",
    state: doc.state ?? migrateStatus(doc.status),
    title: doc.title,
    notes: doc.notes ?? null,
    enrichments,
    captureId: doc.captureId?.toString() ?? null,
    attachments,
    links,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}