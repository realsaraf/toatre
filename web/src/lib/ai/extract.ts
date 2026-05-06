import { z } from "zod";
import { MODELS } from "./openai";
import { flushObservedOpenAI, getObservedOpenAI } from "./langfuse";
import { readFileSync } from "fs";
import { join } from "path";

// ─── Enrichment sub-schemas ───────────────────────────────────────────────────

const TimeSchema = z.object({
  at: z.string().nullable().optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  reminderAt: z.string().nullable().optional(),
  recurrence: z.string().nullable().optional(),
});

const PlaceSchema = z.object({
  placeName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

const ChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
});

const ActionSchema = z.object({
  type: z.enum(["task", "checklist", "errand"]),
  checklist: z.array(ChecklistItemSchema).optional(),
  completedAt: z.string().nullable().optional(),
});

const CommunicationSchema = z.object({
  contact: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  channel: z.enum(["call", "message", "email"]).nullable().optional(),
  joinUrl: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
});

const EventSchema = z.object({
  eventKind: z.enum(["social", "family", "work", "public", "other"]).nullable().optional(),
  host: z.string().nullable().optional(),
  guests: z.array(z.string()).optional(),
  rsvpStatus: z.enum(["going", "maybe", "declined"]).nullable().optional(),
  venueName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  ticketUrl: z.string().nullable().optional(),
});

const MoneySchema = z.object({
  amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  merchant: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
});

const ThoughtSchema = z.object({
  type: z.enum(["idea", "note", "decision", "memory"]).nullable().optional(),
  content: z.string().nullable().optional(),
  revisitAt: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const EnrichmentsSchema = z.object({
  time: TimeSchema.optional(),
  people: z.array(z.string()).optional(),
  place: PlaceSchema.optional(),
  action: ActionSchema.optional(),
  communication: CommunicationSchema.optional(),
  event: EventSchema.optional(),
  money: MoneySchema.optional(),
  thought: ThoughtSchema.optional(),
});

export const ToatTierSchema = z.enum(["urgent", "important", "regular"]);

export const ExtractedToatSchema = z.object({
  tier: ToatTierSchema,
  title: z.string(),
  notes: z.string().nullable(),
  enrichments: EnrichmentsSchema.optional().default({}),
});

export const ExtractionResultSchema = z.object({
  toats: z.array(ExtractedToatSchema),
});

export type ExtractedToat = z.infer<typeof ExtractedToatSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a UTC Date to a local ISO 8601 string with offset included.
 * Timezone is expected in "UTC+HH:MM" / "UTC-HH:MM" format.
 * Returns a string like "2026-05-06T03:30:00+05:30" so the LLM sees
 * the correct *local* date and never needs to do offset math itself.
 */
function toLocalIso(now: Date, timezone: string): string {
  const match = timezone.match(/^UTC([+-])(\d{2}):(\d{2})$/);
  if (!match) return now.toISOString();
  const sign = match[1] === "+" ? 1 : -1;
  const offsetMinutes = sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10));
  const localMs = now.getTime() + offsetMinutes * 60_000;
  const local = new Date(localMs);
  // local.toISOString() gives a UTC-offset-adjusted string ending in "Z" — strip it
  const base = local.toISOString().replace("Z", "");
  const absOffset = Math.abs(offsetMinutes);
  const oh = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const om = String(absOffset % 60).padStart(2, "0");
  const offsetStr = `${match[1]}${oh}:${om}`;
  return `${base}${offsetStr}`;
}

// ─── Load system prompt ───────────────────────────────────────────────────────

function getSystemPrompt(nowLocalIso: string, timezone: string, connectionContext?: string): string {
  const promptPath = join(process.cwd(), "src/lib/ai/prompts/extract.system.md");
  const base = readFileSync(promptPath, "utf-8");
  return [
    base,
    `User's current local time: ${nowLocalIso}`,
    `User's timezone: ${timezone}`,
    connectionContext,
  ].filter(Boolean).join("\n\n");
}

// ─── Main extraction function ─────────────────────────────────────────────────

export async function extractToats(
  transcript: string,
  options: { timezone?: string; now?: Date; userId?: string; connectionContext?: string } = {}
): Promise<ExtractionResult> {
  const now = options.now ?? new Date();
  const timezone = options.timezone ?? "UTC";
  const nowIso = toLocalIso(now, timezone);

  const openai = getObservedOpenAI({
    traceName: "capture.extract-toats",
    generationName: "capture.extract-toats",
    userId: options.userId,
    tags: ["capture", "extract"],
    metadata: {
      timezone,
      transcriptLength: transcript.length,
      hasConnectionContext: Boolean(options.connectionContext),
    },
  });

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.extract,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: getSystemPrompt(nowIso, timezone, options.connectionContext) },
        { role: "user", content: transcript },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from extraction model");

    const parsed = JSON.parse(raw);
    return ExtractionResultSchema.parse(parsed);
  } finally {
    await flushObservedOpenAI(openai);
  }
}
