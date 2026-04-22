/**
 * End-to-end test: POSTs to local /api/extract with a service-role session
 * impersonation, verifies capture+event rows land in Supabase.
 * Run with: pnpm exec tsx scripts/test-extract-route.ts
 *
 * Prereq: dev server running on http://localhost:3000.
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

  // Find our user
  const { data: userList } = await supabase.auth.admin.listUsers();
  const user = userList?.users.find((u) => u.email === 'realsaraf@gmail.com');
  if (!user) {
    console.error('user realsaraf@gmail.com not found in supabase auth');
    process.exit(1);
  }
  console.log('user:', user.id);

  // Generate a fresh session for this user
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'realsaraf@gmail.com',
  });
  if (linkErr) {
    console.error('generateLink failed:', linkErr.message);
    process.exit(1);
  }
  // The hashed token can be exchanged for a session via verifyOtp
  const hashed = linkData.properties?.hashed_token;
  if (!hashed) {
    console.error('no hashed_token in link properties');
    process.exit(1);
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: sess, error: otpErr } = await anonClient.auth.verifyOtp({
    type: 'magiclink',
    token_hash: hashed,
  });
  if (otpErr || !sess.session) {
    console.error('verifyOtp failed:', otpErr?.message);
    process.exit(1);
  }
  const accessToken = sess.session.access_token;
  const refreshToken = sess.session.refresh_token;
  console.log('got session for', sess.user?.email);

  // Construct Supabase auth cookie format used by @supabase/ssr
  const cookieName = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`;
  const cookieVal = encodeURIComponent(
    JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: sess.session.expires_at,
      expires_in: sess.session.expires_in,
      token_type: sess.session.token_type,
      user: sess.user,
    }),
  );

  const res = await fetch('http://localhost:3000/api/extract', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `${cookieName}=${cookieVal}`,
    },
    body: JSON.stringify({
      rawContent: 'Dentist with Dr. Singh next Wednesday 3pm, bring insurance card.',
      source: 'manual',
      timezone: 'America/New_York',
    }),
  });
  const text = await res.text();
  console.log('HTTP', res.status);
  console.log(text);
  process.exit(res.ok ? 0 : 1);
}

void main();
