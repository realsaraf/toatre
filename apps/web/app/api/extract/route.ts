import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { extractEvent, estimateCostCents, ExtractionValidationError } from '@plotto/ai';
import { supabaseServer } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  rawContent: z.string().min(1).max(20_000),
  source: z
    .enum(['share_sheet', 'voice', 'manual', 'email', 'screenshot'])
    .default('manual'),
  timezone: z.string().default('UTC'),
});

export async function POST(req: NextRequest) {
  if (!env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // 1) Write capture row first (audit trail even if extraction fails)
  const { data: capture, error: capErr } = await supabase
    .from('captures')
    .insert({
      user_id: user.id,
      raw_content: body.rawContent,
      source: body.source,
      processed: false,
    })
    .select('id')
    .single();
  if (capErr || !capture) {
    return NextResponse.json({ error: capErr?.message ?? 'capture insert failed' }, { status: 500 });
  }

  // 2) Call LLM
  const started = Date.now();
  let result;
  try {
    result = await extractEvent({
      rawContent: body.rawContent,
      timezone: body.timezone,
      nowIso: new Date().toISOString(),
      model: env.OPENAI_MODEL,
      apiKey: env.OPENAI_API_KEY,
    });
  } catch (e) {
    const details =
      e instanceof ExtractionValidationError
        ? { issues: e.issues }
        : undefined;
    await supabase
      .from('captures')
      .update({
        llm_input: { timezone: body.timezone, model: env.OPENAI_MODEL },
        llm_output: { error: (e as Error).message, ...details },
        processed: false,
      })
      .eq('id', capture.id);
    return NextResponse.json(
      { error: (e as Error).message, ...details },
      { status: 502 },
    );
  }
  const latencyMs = Date.now() - started;
  const costCents = estimateCostCents(result.model, result.usage);

  // 3) Insert event
  const { data: eventRow, error: evErr } = await supabase
    .from('events')
    .insert({
      user_id: user.id,
      title: result.event.title,
      description: result.event.description,
      starts_at: result.event.startsAt,
      ends_at: result.event.endsAt,
      location: result.event.location,
      all_day: result.event.allDay,
      recurrence_rule: result.event.recurrenceRule,
      importance: result.event.importance,
      reminder_strategy: result.event.reminderStrategy,
      confidence: result.event.confidence,
      source_capture_id: capture.id,
      status: 'active',
    })
    .select('id')
    .single();
  if (evErr || !eventRow) {
    return NextResponse.json({ error: evErr?.message ?? 'event insert failed' }, { status: 500 });
  }

  // 4) Mark capture processed + cost
  await supabase
    .from('captures')
    .update({
      llm_input: { timezone: body.timezone, model: result.model },
      llm_output: result.raw as object,
      llm_model: result.model,
      llm_cost_cents: costCents,
      processed: true,
    })
    .eq('id', capture.id);

  // 5) Fire-and-forget Langfuse trace (best effort)
  void logToLangfuse({
    input: body.rawContent,
    output: result.raw,
    model: result.model,
    usage: result.usage,
    latencyMs,
    userId: user.id,
    captureId: capture.id,
    eventId: eventRow.id,
  });

  return NextResponse.json({
    capture_id: capture.id,
    event_id: eventRow.id,
    event: result.event,
  });
}

async function logToLangfuse(p: {
  input: string;
  output: unknown;
  model: string;
  usage: { inputTokens: number; outputTokens: number } | null;
  latencyMs: number;
  userId: string;
  captureId: string;
  eventId: string;
}) {
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) return;
  try {
    const { Langfuse } = await import('langfuse');
    const lf = new Langfuse({
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
      baseUrl: env.LANGFUSE_HOST,
    });
    const trace = lf.trace({
      name: 'extract_event',
      userId: p.userId,
      metadata: { captureId: p.captureId, eventId: p.eventId },
    });
    trace.generation({
      name: 'openai.chat.completions',
      model: p.model,
      input: p.input,
      output: p.output,
      usage: p.usage
        ? {
            input: p.usage.inputTokens,
            output: p.usage.outputTokens,
            total: p.usage.inputTokens + p.usage.outputTokens,
          }
        : undefined,
    });
    await lf.flushAsync();
  } catch {
    // langfuse optional — swallow
  }
}
