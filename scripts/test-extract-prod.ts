/**
 * End-to-end test against PROD (https://www.getplotto.com).
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

  const BASE = 'https://www.getplotto.com';
  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'realsaraf@gmail.com',
  });
  if (linkErr) { console.error(linkErr); process.exit(1); }
  const hashed = linkData.properties?.hashed_token!;

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: sess, error: otpErr } = await anon.auth.verifyOtp({
    type: 'magiclink',
    token_hash: hashed,
  });
  if (otpErr || !sess.session) { console.error(otpErr); process.exit(1); }

  const cookieName = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`;
  const cookieVal = encodeURIComponent(
    JSON.stringify({
      access_token: sess.session.access_token,
      refresh_token: sess.session.refresh_token,
      expires_at: sess.session.expires_at,
      expires_in: sess.session.expires_in,
      token_type: sess.session.token_type,
      user: sess.user,
    }),
  );

  const res = await fetch(`${BASE}/api/extract`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: `${cookieName}=${cookieVal}` },
    body: JSON.stringify({
      rawContent: 'Lunch with Sam on Thursday 1pm at Joe Beef.',
      source: 'manual',
      timezone: 'America/New_York',
    }),
  });
  console.log('HTTP', res.status);
  console.log(await res.text());
  process.exit(res.ok ? 0 : 1);
}

void main();
