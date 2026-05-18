import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { uploadToSpaces } from "@/lib/storage/spaces";
import { getOpenAI, MODELS } from "@/lib/ai/openai";
import type { ToatAttachment } from "@/types";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── AI label generation ────────────────────────────────────────────────────

async function generateLabel(
  filename: string,
  mimeType: string,
  buffer: Buffer
): Promise<string> {
  const openai = getOpenAI();
  try {
    if (mimeType.startsWith("image/")) {
      const base64 = buffer.toString("base64");
      const res = await openai.chat.completions.create({
        model: MODELS.extract,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "low",
                },
              },
              {
                type: "text",
                text: 'Give a concise 2–4 word label for this attachment. Be specific (e.g. "Flight ticket", "ID card", "Hotel booking", "Doctor receipt"). Reply with just the label, no punctuation or quotes.',
              },
            ],
          },
        ],
        max_tokens: 20,
      });
      const label = res.choices[0]?.message?.content?.trim();
      if (label) return label.slice(0, 40);
    } else {
      // PDF — derive label from filename
      const base = filename
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();
      const res = await openai.chat.completions.create({
        model: MODELS.extractFast,
        messages: [
          {
            role: "user",
            content: `Generate a concise 2–4 word label for a PDF file named "${base}". Examples: "Flight ticket", "Visa letter", "Tax document", "Hotel booking". Reply with just the label, no punctuation or quotes.`,
          },
        ],
        max_tokens: 20,
      });
      const label = res.choices[0]?.message?.content?.trim();
      if (label) return label.slice(0, 40);
    }
  } catch {
    // Fallback: sanitised filename
  }
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .slice(0, 40);
}

// ─── POST /api/toats/[id]/attachments ───────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid toat id" }, { status: 400 });
  }

  // Verify ownership
  const { toats } = await getCollections();
  const toat = await toats.findOne({
    _id: new ObjectId(id),
    ownerId: new ObjectId(user.mongoId),
  });
  if (!toat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field is required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only images (JPEG, PNG, WEBP, GIF) and PDF are allowed" },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const attachmentId = crypto.randomUUID();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const key = `attachments/${user.mongoId}/${id}/${attachmentId}.${ext}`;

  try {
    await uploadToSpaces(key, buffer, file.type);
  } catch (err) {
    console.error("[attachments] Spaces upload failed:", err);
    return NextResponse.json({ error: "File storage unavailable" }, { status: 503 });
  }

  const label = await generateLabel(file.name, file.type, buffer);

  const attachment: ToatAttachment = {
    id: attachmentId,
    key,
    label,
    mimeType: file.type,
    size: file.size,
    createdAt: new Date(),
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (toats as any).updateOne(
      { _id: new ObjectId(id) },
      { $push: { attachments: attachment } }
    );
  } catch (err) {
    console.error("[attachments] DB write failed:", err);
    return NextResponse.json({ error: "Failed to save attachment" }, { status: 500 });
  }

  return NextResponse.json(
    {
      attachment: {
        id: attachment.id,
        label: attachment.label,
        mimeType: attachment.mimeType,
        size: attachment.size,
        createdAt: attachment.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
