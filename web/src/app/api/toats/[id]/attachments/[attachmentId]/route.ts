import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { getBytesFromSpaces, deleteFromSpaces } from "@/lib/storage/spaces";
import type { ToatAttachment } from "@/types";

// ─── GET /api/toats/[id]/attachments/[attachmentId] ─────────────────────────
// Proxies the raw file from DO Spaces — auth-gated, no public URLs needed.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { id, attachmentId } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid toat id" }, { status: 400 });
  }

  const { toats } = await getCollections();
  const toat = await toats.findOne({
    _id: new ObjectId(id),
    ownerId: new ObjectId(user.mongoId),
  });
  if (!toat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attachment = (toat.attachments as ToatAttachment[] | undefined)?.find(
    (a) => a.id === attachmentId
  );
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  const { bytes, contentType } = await getBytesFromSpaces(attachment.key);
  const mimeType = contentType ?? attachment.mimeType;
  // Cast needed: Uint8Array<ArrayBufferLike> → ArrayBuffer to satisfy Blob/BodyInit types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = new Blob([bytes as any], { type: mimeType });

  return new NextResponse(blob, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.label)}"`,
      "Cache-Control": "private, max-age=86400",
    },
  });
}

// ─── DELETE /api/toats/[id]/attachments/[attachmentId] ──────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { id, attachmentId } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid toat id" }, { status: 400 });
  }

  const { toats } = await getCollections();
  const toat = await toats.findOne({
    _id: new ObjectId(id),
    ownerId: new ObjectId(user.mongoId),
  });
  if (!toat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attachment = (toat.attachments as ToatAttachment[] | undefined)?.find(
    (a) => a.id === attachmentId
  );
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  // Delete from Spaces first, then pull from the array
  await deleteFromSpaces(attachment.key);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (toats as any).updateOne(
    { _id: new ObjectId(id) },
    { $pull: { attachments: { id: attachmentId } } }
  );

  return NextResponse.json({ ok: true });
}
