import { z } from "zod";
import { MODELS } from "./openai";
import { flushObservedOpenAI, getObservedOpenAI } from "./langfuse";
import { readFileSync } from "fs";
import { join } from "path";

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const ToatTemplateSchema = z.enum([
  "meeting",
  "call",
  "appointment",
  "event",
  "deadline",
  "task",
  "checklist",
  "errand",
  "follow_up",
  "idea",
]);

export const ToatTierSchema = z.enum(["urgent", "important", "regular"]);

// ─── Template data sub-schemas ────────────────────────────────────────────────

const MeetingDataSchema = z.object({
  template: z.literal("meeting"),
  joinUrl: z.string().nullable(),
  attendees: z.array(z.string()),
  agenda: z.string().nullable(),
});

const CallDataSchema = z.object({
  template: z.literal("call"),
  phone: z.string().nullable(),
  contactName: z.string().nullable(),
});

const AppointmentDataSchema = z.object({
  template: z.literal("appointment"),
  providerName: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
});

const EventDataSchema = z.object({
  template: z.literal("event"),
  venue: z.string().nullable(),
  ticketUrl: z.string().nullable(),
  doorsAt: z.string().nullable(),
});

const DeadlineDataSchema = z.object({
  template: z.literal("deadline"),
  dueAt: z.string().nullable(),
  softDeadline: z.boolean(),
});

const TaskDataSchema = z.object({
  template: z.literal("task"),
  completedAt: z.string().nullable(),
});

const ChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
});

const ChecklistDataSchema = z.object({
  template: z.literal("checklist"),
  items: z.array(ChecklistItemSchema),
});

const ErrandDataSchema = z.object({
  template: z.literal("errand"),
  address: z.string().nullable(),
  storeOrVenue: z.string().nullable(),
});

const FollowUpDataSchema = z.object({
  template: z.literal("follow_up"),
  contactName: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  channel: z.enum(["call", "email", "message"]).nullable(),
});

const IdeaDataSchema = z.object({
  template: z.literal("idea"),
  revisitAt: z.string().nullable(),
  tags: z.array(z.string()),
});

export const TemplateDataSchema = z.discriminatedUnion("template", [
  MeetingDataSchema,
  CallDataSchema,
  AppointmentDataSchema,
  EventDataSchema,
  DeadlineDataSchema,
  TaskDataSchema,
  ChecklistDataSchema,
  ErrandDataSchema,
  FollowUpDataSchema,
  IdeaDataSchema,
]);

export const ExtractedToatSchema = z.object({
  template: ToatTemplateSchema,
  tier: ToatTierSchema,
  title: z.string(),
  datetime: z.string().nullable(),
  endDatetime: z.string().nullable(),
  location: z.string().nullable(),
  link: z.string().nullable(),
  people: z.array(z.string()),
  notes: z.string().nullable(),
  // Accept any object from the LLM — the API route validates/normalises it with
  // TemplateDataSchema.safeParse + emptyTemplateData fallback so a bad templateData
  // never kills the whole capture.
  templateData: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const ExtractionResultSchema = z.object({
  toats: z.array(ExtractedToatSchema),
});

export type ExtractedToat = z.infer<typeof ExtractedToatSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ─── Load system prompt ───────────────────────────────────────────────────────

function getSystemPrompt(nowIso: string, timezone: string, connectionContext?: string): string {
  const promptPath = join(process.cwd(), "src/lib/ai/prompts/extract.system.md");
  const base = readFileSync(promptPath, "utf-8");
  return [
    base,
    `User's current time: ${nowIso}`,
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
  const nowIso = now.toISOString();

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
        {
          role: "system",
          content: getSystemPrompt(nowIso, timezone, options.connectionContext),
        },
        {
          role: "user",
          content: transcript,
        },
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
