import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { getObservedOpenAI, flushObservedOpenAI } from "@/lib/ai/langfuse";
import { MODELS } from "@/lib/ai/openai";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BusyBlock {
  startMs: number;
  endMs: number;
  title: string;
}

interface SuggestedSlot {
  startIso: string;
  endIso: string;
  label: string;
  clashFree: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseToatDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toatPrimaryDate(toat: Record<string, unknown>): Date | null {
  const enrichments = toat.enrichments;
  if (!enrichments || typeof enrichments !== "object") return null;
  const time = (enrichments as Record<string, unknown>).time;
  if (!time || typeof time !== "object") return null;
  const t = time as Record<string, unknown>;
  return (
    parseToatDate(t.at) ??
    parseToatDate(t.startAt) ??
    parseToatDate(t.dueAt) ??
    parseToatDate(toat.datetime)
  );
}

function toatDurationMs(toat: Record<string, unknown>): number {
  const enrichments = toat.enrichments;
  if (!enrichments || typeof enrichments !== "object") return 60 * 60 * 1000;
  const time = (enrichments as Record<string, unknown>).time;
  if (!time || typeof time !== "object") return 60 * 60 * 1000;
  const t = time as Record<string, unknown>;
  const mins = typeof t.duration === "number" && t.duration > 0 ? t.duration : 60;
  return mins * 60 * 1000;
}

/**
 * Build busy blocks from user's open toats.
 * Only toats that have a concrete datetime are considered.
 */
function buildBusyBlocks(
  toats: Record<string, unknown>[],
  windowStart: Date,
  windowEnd: Date,
): BusyBlock[] {
  const blocks: BusyBlock[] = [];

  for (const toat of toats) {
    const start = toatPrimaryDate(toat);
    if (!start) continue;

    const durationMs = toatDurationMs(toat);
    const end = new Date(start.getTime() + durationMs);

    // Only include if it overlaps the search window.
    if (end.getTime() <= windowStart.getTime()) continue;
    if (start.getTime() >= windowEnd.getTime()) continue;

    blocks.push({
      startMs: start.getTime(),
      endMs: end.getTime(),
      title: typeof toat.title === "string" ? toat.title : "Untitled toat",
    });
  }

  return blocks.sort((a, b) => a.startMs - b.startMs);
}

/**
 * Given a list of busy blocks and a desired duration, find free slots
 * within [windowStart, windowEnd] at 15-minute granularity.
 */
function findFreeSlots(
  busyBlocks: BusyBlock[],
  windowStart: Date,
  windowEnd: Date,
  durationMs: number,
  maxSlots: number = 5,
): Date[] {
  const slots: Date[] = [];
  const step = 15 * 60 * 1000; // 15-min grid
  let cursor = windowStart.getTime();

  // Round up to next 15-min boundary.
  const remainder = cursor % step;
  if (remainder !== 0) cursor += step - remainder;

  while (cursor + durationMs <= windowEnd.getTime() && slots.length < maxSlots) {
    const slotEnd = cursor + durationMs;
    const clashes = busyBlocks.some(
      (b) => b.startMs < slotEnd && b.endMs > cursor,
    );

    if (!clashes) {
      slots.push(new Date(cursor));
    }

    cursor += step;
  }

  return slots;
}

/**
 * Use GPT to parse a natural-language scheduling request into a structured
 * window descriptor. Returns { windowStart, windowEnd, durationMs }.
 */
async function parseSchedulingRequest(
  query: string,
  userTimezone: string,
  userId: string,
): Promise<{ windowStart: Date; windowEnd: Date; durationMs: number }> {
  const now = new Date();
  const nowIso = now.toISOString();

  const client = getObservedOpenAI({
    traceName: "schedule.suggest",
    userId,
    generationName: "parseSchedulingRequest",
  });

  const completion = await client.chat.completions.create({
    model: MODELS.extractFast,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You extract scheduling windows from natural-language requests.
Current time: ${nowIso}
User timezone: ${userTimezone}

Return ONLY a JSON object with:
- windowStart: ISO 8601 string — the start of the search window
- windowEnd: ISO 8601 string — the end of the search window  
- durationMinutes: integer — desired appointment/task duration in minutes

Rules:
- "Monday evening" means the next Monday, 18:00–23:00 in the user's timezone
- "this afternoon" means today 12:00–18:00
- "tomorrow morning" means tomorrow 07:00–12:00
- If duration is not mentioned, default to 60 minutes
- If the day is ambiguous, pick the next upcoming occurrence
- Always return valid ISO 8601 strings

Example output: {"windowStart":"2026-04-28T18:00:00+05:30","windowEnd":"2026-04-28T23:00:00+05:30","durationMinutes":60}`,
      },
      {
        role: "user",
        content: query,
      },
    ],
  });

  await flushObservedOpenAI(client);

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("AI returned malformed JSON for scheduling window.");
  }

  const windowStart = typeof parsed.windowStart === "string"
    ? new Date(parsed.windowStart)
    : null;
  const windowEnd = typeof parsed.windowEnd === "string"
    ? new Date(parsed.windowEnd)
    : null;
  const durationMins = typeof parsed.durationMinutes === "number" && parsed.durationMinutes > 0
    ? parsed.durationMinutes
    : 60;

  if (!windowStart || Number.isNaN(windowStart.getTime())) {
    throw new Error("Could not parse a scheduling window start from your request.");
  }
  if (!windowEnd || Number.isNaN(windowEnd.getTime())) {
    throw new Error("Could not parse a scheduling window end from your request.");
  }
  if (windowEnd.getTime() <= windowStart.getTime()) {
    throw new Error("Scheduling window end must be after start.");
  }

  return { windowStart, windowEnd, durationMs: durationMins * 60 * 1000 };
}

// ── Route handler ─────────────────────────────────────────────────────────────

/**
 * POST /api/schedule/suggest
 *
 * Body: { query: string }
 *   query — natural-language request, e.g. "suggest a 1 hour window Monday
 *           evening after six"
 *
 * Returns: { slots: SuggestedSlot[], busyCount: number }
 */
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { query } = body as Record<string, unknown>;
  if (typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "query is required." }, { status: 400 });
  }

  // Look up user timezone from settings.
  const { settings, toats } = await getCollections();
  const settingsDoc = await settings.findOne({ userId: user.mongoId });
  const userTimezone =
    typeof settingsDoc?.timezone === "string" && settingsDoc.timezone
      ? settingsDoc.timezone
      : "UTC";

  // Parse the natural-language request into a concrete window.
  let windowStart: Date;
  let windowEnd: Date;
  let durationMs: number;

  try {
    ({ windowStart, windowEnd, durationMs } = await parseSchedulingRequest(
      query.trim(),
      userTimezone,
      user.mongoId,
    ));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not understand your scheduling request." },
      { status: 422 },
    );
  }

  // Fetch toats in a ±24-hour buffer around the window to catch overlapping events.
  const bufferMs = 24 * 60 * 60 * 1000;
  const ownerId = new ObjectId(user.mongoId);
  const rawToats = await toats
    .find({
      ownerId,
      state: { $ne: "done" },
      $or: [
        { "enrichments.time.at": { $gte: new Date(windowStart.getTime() - bufferMs), $lte: new Date(windowEnd.getTime() + bufferMs) } },
        { "enrichments.time.startAt": { $gte: new Date(windowStart.getTime() - bufferMs), $lte: new Date(windowEnd.getTime() + bufferMs) } },
        { datetime: { $gte: new Date(windowStart.getTime() - bufferMs), $lte: new Date(windowEnd.getTime() + bufferMs) } },
      ],
    })
    .toArray() as Record<string, unknown>[];

  const busyBlocks = buildBusyBlocks(rawToats, windowStart, windowEnd);
  const freeSlots = findFreeSlots(busyBlocks, windowStart, windowEnd, durationMs);

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const slots: SuggestedSlot[] = freeSlots.map((start) => {
    const end = new Date(start.getTime() + durationMs);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      label: `${timeFormatter.format(start)} – ${new Intl.DateTimeFormat("en-US", { timeZone: userTimezone, hour: "numeric", minute: "2-digit" }).format(end)}`,
      clashFree: true,
    };
  });

  return NextResponse.json({
    slots,
    busyCount: busyBlocks.length,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    durationMinutes: Math.round(durationMs / 60000),
  });
}
