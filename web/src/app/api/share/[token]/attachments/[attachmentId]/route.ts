/**
 * GET /api/share/[token]/attachments/[attachmentId]
 *
 * Public attachment proxy — no auth required.
 * Security gate: the share token must resolve to a valid ACL entry.
 *
 * Query params:
 *   ?download=1  — force Content-Disposition: attachment (triggers browser download)
 *   (default)    — Content-Disposition: inline (renders in browser / img tag)
 */
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongo/collections";
import { getBytesFromSpaces } from "@/lib/storage/spaces";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; attachmentId: string }> }
) {
  const { token, attachmentId } = await params;

  const { acl, toats } = await getCollections();
  const share = await acl.findOne({ token });
  if (!share) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const toatId = share.toatId instanceof ObjectId ? share.toatId : null;
  if (!toatId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const toat = await toats.findOne({ _id: toatId });
  if (!toat) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const attachments = Array.isArray(toat.attachments) ? toat.attachments : [];
  const attachment = attachments.find(
    (a: { id: string }) => a.id === attachmentId
  );
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  let bytes: Uint8Array;
  let contentType: string | undefined;
  try {
    ({ bytes, contentType } = await getBytesFromSpaces(attachment.key));
  } catch {
    return NextResponse.json({ error: "File unavailable." }, { status: 502 });
  }

  const forceDownload = req.nextUrl.searchParams.get("download") === "1";
  // Sanitise label to a safe filename (strip non-ASCII + special chars)
  const safeLabel = attachment.label.replace(/[^\w\s.-]/g, "_").trim() || "attachment";
  const isPdf = (contentType ?? attachment.mimeType) === "application/pdf";
  const ext = isPdf ? ".pdf" : "";

  const headers = new Headers();
  headers.set("Content-Type", contentType ?? attachment.mimeType ?? "application/octet-stream");
  headers.set("Content-Length", String(bytes.byteLength));
  headers.set(
    "Content-Disposition",
    forceDownload
      ? `attachment; filename="${safeLabel}${ext}"`
      : "inline"
  );
  // Token is the security gate — allow CDN/browser caching for 1 hour
  headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

  return new Response(bytes as unknown as BodyInit, { status: 200, headers });
}
