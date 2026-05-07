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

  const { acl, toats } = await getCollections();
  const share = await acl.findOne({ token });
  const toatId = share?.toatId instanceof ObjectId ? share.toatId : null;
  const toat = toatId ? await toats.findOne({ _id: toatId }) : null;

  if (!share || !toat) {
    return NextResponse.json({ error: "Shared toat not found." }, { status: 404 });
  }

  return NextResponse.json({
    toat: serializeToat(toat),
    share: {
      role: typeof share.role === "string" ? share.role : "view",
      scope: typeof share.scope === "string" ? share.scope : "link",
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeToat(doc: any) {
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