import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getOpenAI, MODELS } from "@/lib/ai/openai";

/**
 * POST /api/transcribe
 *
 * Accepts multipart/form-data with an `audio` file.
 * Returns { transcript: string }
 */
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;
  void user; // auth check only

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const audioFile = formData.get("audio");
  if (!audioFile || typeof audioFile === "string") {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  const arrayBuffer = await (audioFile as Blob).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const file = new File([buffer], "audio.webm", { type: (audioFile as Blob).type || "audio/webm" });

  const openai = getOpenAI();
  try {
    const result = await openai.audio.transcriptions.create({
      model: MODELS.whisper,
      file,
      language: "en",
    });
    return NextResponse.json({ transcript: result.text });
  } catch (err) {
    console.error("[transcribe] Whisper error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }
}
