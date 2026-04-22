/**
 * Direct smoke test of extraction pipeline against real OpenAI.
 * Run with: pnpm exec tsx scripts/test-extraction.ts
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(__dirname, '..');

  for (const line of readFileSync(resolve(repoRoot, '.env.local'), 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }

  const { extractEvent, ExtractionValidationError } = await import('../packages/ai/src/index.ts');

  const samples = [
    'Dentist appointment with Dr. Singh next Tuesday at 3pm.',
    'Flight AA123 to SFO Friday 6:45am.',
    "Mom's birthday dinner Saturday 7pm at Roka Akor.",
  ];

  let ok = 0;
  let fail = 0;
  for (const s of samples) {
    process.stdout.write(`> ${s}\n`);
    try {
      const r = await extractEvent({
        rawContent: s,
        timezone: 'America/New_York',
        nowIso: new Date().toISOString(),
      });
      console.log('  OK', {
        title: r.event.title,
        startsAt: r.event.startsAt,
        importance: r.event.importance,
        confidence: r.event.confidence,
      });
      ok++;
    } catch (e) {
      const err = e as Error & { issues?: unknown };
      console.log('  FAIL', err.message);
      if (err instanceof ExtractionValidationError) {
        console.log('    issues:', JSON.stringify(err.issues));
      }
      fail++;
    }
  }
  console.log(`\nresult: ${ok} pass / ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

void main();
