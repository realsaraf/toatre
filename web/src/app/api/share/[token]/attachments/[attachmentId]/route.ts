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
import { getSignedSpacesUrl } from "@/lib/storage/spaces";

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

  const forceDownload = req.nextUrl.searchParams.get("download") === "1";
  const safeLabel = attachment.label.replace(/[^\w\s.-]/g, "_").trim() || "attachment";
  const mimeType = attachment.mimeType ?? "application/octet-stream";
  const filename =
    mimeType === "application/pdf" && !safeLabel.toLowerCase().endsWith(".pdf")
      ? `${safeLabel}.pdf`
      : safeLabel;

  let signedUrl: string;
  try {
    signedUrl = await getSignedSpacesUrl(attachment.key, {
      expiresIn: 900,
      contentType: mimeType,
      contentDisposition: forceDownload ? "attachment" : "inline",
      filename,
    });
  } catch {
    return NextResponse.json({ error: "File unavailable." }, { status: 502 });
  }

  return NextResponse.redirect(signedUrl, {
    status: 307,
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
