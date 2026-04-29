import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { MODELS } from "@/lib/ai/openai";
import { extractToats } from "@/lib/ai/extract";
import { flushObservedOpenAI, getObservedOpenAI } from "@/lib/ai/langfuse";
import { buildConnectionContext, serializeConnection } from "@/lib/connections";
import { ObjectId } from "mongodb";
import { z } from "zod";

const RequestBodySchema = z.object({
  transcript: z.string().min(1).max(5000),
  timezone: z.string().optional(),
});

/**
 * POST /api/captures
 *
 * Body can be:
 *   - multipart/form-data: { audio: File, timezone?: string }  → Whisper transcription + extraction
 *   - application/json:   { transcript: string, timezone?: string } → extraction only
 *
 * Returns: { captureId, transcript, toats[] }
 */
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const contentType = request.headers.get("content-type") ?? "";

  let transcript: string;
  let timezone = "UTC";

  if (contentType.includes("multipart/form-data")) {
    // Audio mode — transcribe via Whisper first
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
    }

    const audioFile = formData.get("audio");
    const tzField = formData.get("timezone");
    if (tzField && typeof tzField === "string") timezone = tzField;

    if (!audioFile || typeof audioFile === "string") {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const uploadedFile = audioFile as File;
    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = uploadedFile.type || "application/octet-stream";
    const fileName = safeAudioFileName(uploadedFile.name, mimeType);

    const openai = getObservedOpenAI({
      traceName: "capture.transcribe",
      generationName: "capture.transcribe",
      userId: user.uid,
      tags: ["capture", "transcribe"],
      metadata: {
        timezone,
        mimeType,
        fileName,
        bytes: buffer.byteLength,
      },
    });
    // Whisper uses the file name extension to infer containers such as m4a.
    const file = new File([buffer], fileName, { type: mimeType });

    try {
      const whisperResult = await openai.audio.transcriptions.create({
        model: MODELS.whisper,
        file,
        language: "en",
      });
      transcript = whisperResult.text;
    } catch (err) {
      console.error("[captures] Whisper error:", err);
      return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
    } finally {
      await flushObservedOpenAI(openai);
    }
  } else {
    // JSON mode — transcript provided by client (on-device STT)
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = RequestBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 422 });
    }
    transcript = parsed.data.transcript;
    if (parsed.data.timezone) timezone = parsed.data.timezone;
  }

  // ── Extract toats ───────────────────────────────────────────────────────────
  let extraction;
  try {
    const { connections } = await getCollections();
    const connectionDocs = await connections
      .find({ ownerId: new ObjectId(user.mongoId) })
      .sort({ relationship: 1, name: 1 })
      .limit(50)
      .toArray();
    extraction = await extractToats(transcript, {
      timezone,
      now: new Date(),
      userId: user.uid,
      connectionContext: buildConnectionContext(connectionDocs.map(serializeConnection)),
    });
  } catch (err) {
    console.error("[captures] Extraction error:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 502 });
  }

  // ── Persist to MongoDB ──────────────────────────────────────────────────────
  const { captures, toats } = await getCollections();
  const now = new Date();
  const ownerId = new ObjectId(user.mongoId);

  // Insert capture record
  const captureResult = await captures.insertOne({
    ownerId,
    transcript,
    timezone,
    createdAt: now,
  });
  const captureId = captureResult.insertedId;

  // Insert toats
  const toatDocs = extraction.toats.map((t) => ({
    ownerId,
    captureId,
    kind: t.kind,
    tier: t.tier,
    title: t.title,
    datetime: t.datetime ? new Date(t.datetime) : null,
    endDatetime: t.endDatetime ? new Date(t.endDatetime) : null,
    location: t.location ?? null,
    link: t.link ?? null,
    people: t.people ?? [],
    notes: t.notes ?? null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  }));

  let insertedIds: ObjectId[] = [];
  if (toatDocs.length > 0) {
    const toatsResult = await toats.insertMany(toatDocs);
    insertedIds = Object.values(toatsResult.insertedIds) as ObjectId[];
  }

  const savedToats = toatDocs.map((t, i) => ({
    ...t,
    _id: insertedIds[i]?.toString() ?? null,
    ownerId: t.ownerId.toString(),
    captureId: t.captureId.toString(),
    datetime: t.datetime?.toISOString() ?? null,
    endDatetime: t.endDatetime?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return NextResponse.json({
    captureId: captureId.toString(),
    transcript,
    toats: savedToats,
  });
}

function safeAudioFileName(name: string | undefined, mimeType: string): string {
  const trimmed = name?.trim().replace(/[\\/]/g, "") ?? "";
  if (trimmed && /\.[a-z0-9]{2,5}$/i.test(trimmed)) {
    return trimmed;
  }

  if (mimeType.includes("mp4") || mimeType.includes("m4a") || mimeType.includes("aac")) {
    return "capture.m4a";
  }
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) {
    return "capture.mp3";
  }
  if (mimeType.includes("wav")) {
    return "capture.wav";
  }
  if (mimeType.includes("ogg")) {
    return "capture.ogg";
  }
  return "capture.webm";
}
