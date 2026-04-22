/**
 * Verifies events row landed, timeline query returns it.
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
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase
    .from('events')
    .select('id, title, starts_at, importance, status, confidence')
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('ERR', error);
    process.exit(1);
  }
  console.log(`events in db: ${data?.length}`);
  for (const e of data ?? []) console.log(' -', e);
}

void main();
