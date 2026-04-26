import { z } from "zod";
import { getOpenAI, MODELS } from "./openai";
import { readFileSync } from "fs";
import { join } from "path";

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const ToatKindSchema = z.enum(["task", "event", "meeting", "errand", "deadline", "idea"]);
export const ToatTierSchema = z.enum(["urgent", "important", "regular"]);

export const ExtractedToatSchema = z.object({
  kind: ToatKindSchema,
  tier: ToatTierSchema,
  title: z.string(),
  datetime: z.string().nullable(),
  endDatetime: z.string().nullable(),
  location: z.string().nullable(),
  link: z.string().nullable(),
  people: z.array(z.string()),
  notes: z.string().nullable(),
});

export const ExtractionResultSchema = z.object({
  toats: z.array(ExtractedToatSchema),
});

export type ExtractedToat = z.infer<typeof ExtractedToatSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ─── Load system prompt ───────────────────────────────────────────────────────

function getSystemPrompt(nowIso: string, timezone: string): string {
  const promptPath = join(process.cwd(), "src/lib/ai/prompts/extract.system.md");
  const base = readFileSync(promptPath, "utf-8");
  return `${base}\n\nUser's current time: ${nowIso}\nUser's timezone: ${timezone}`;
}

// ─── Main extraction function ─────────────────────────────────────────────────

export async function extractToats(
  transcript: string,
  options: { timezone?: string; now?: Date } = {}
): Promise<ExtractionResult> {
  const now = options.now ?? new Date();
  const timezone = options.timezone ?? "UTC";
  const nowIso = now.toISOString();

  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: MODELS.extract,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: getSystemPrompt(nowIso, timezone),
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
}
