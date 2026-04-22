/**
 * Runtime env for the web app.
 *
 * IMPORTANT: Next.js only inlines `process.env.NEXT_PUBLIC_*` into client
 * bundles for *literal* property accesses. Dynamic access via
 * `process.env[varName]` is NOT substituted, so those references end up
 * undefined at runtime. We therefore read every NEXT_PUBLIC_* var with a
 * direct literal access here.
 */
function must(v: string | undefined, name: string): string {
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}
function opt(v: string | undefined): string | undefined {
  return v && v.length > 0 ? v : undefined;
}

// Literal references so Next.js inlines them at build time.
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const NEXT_PUBLIC_POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const NEXT_PUBLIC_POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const NEXT_PUBLIC_SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const env = {
  SUPABASE_URL: must(NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: must(NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: opt(process.env.SUPABASE_SERVICE_ROLE_KEY),
  OPENAI_API_KEY: opt(process.env.OPENAI_API_KEY),
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  LANGFUSE_PUBLIC_KEY: opt(process.env.LANGFUSE_PUBLIC_KEY),
  LANGFUSE_SECRET_KEY: opt(process.env.LANGFUSE_SECRET_KEY),
  LANGFUSE_HOST: process.env.LANGFUSE_HOST || 'https://us.cloud.langfuse.com',
  POSTHOG_KEY: opt(NEXT_PUBLIC_POSTHOG_KEY),
  POSTHOG_HOST: NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  SENTRY_DSN: opt(NEXT_PUBLIC_SENTRY_DSN),
};

export const publicEnv = {
  SUPABASE_URL: env.SUPABASE_URL,
  SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
  POSTHOG_KEY: env.POSTHOG_KEY,
  POSTHOG_HOST: env.POSTHOG_HOST,
  SENTRY_DSN: env.SENTRY_DSN,
};
