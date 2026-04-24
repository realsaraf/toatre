import Link from 'next/link';
import PlottoMark from '@/components/plotto-mark';
import SignInForm from './sign-in-form';

export const metadata = {
  title: 'Sign in · Plotto',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-3 text-fg">
          <PlottoMark className="h-10 w-10 shrink-0" />
          <span className="text-xl font-semibold tracking-tight">Plotto</span>
        </Link>
        <div className="rounded-2xl border border-line bg-card p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-fg">
            Welcome back
          </h1>
          <p className="mb-6 text-sm text-fg-muted">
            Use Google, Apple, or a 6-digit email code. If the email is the same and verified,
            Supabase will keep it in the same Plotto account.
          </p>
          <SignInForm initialError={error ?? null} />
        </div>
        <p className="mt-6 text-center text-xs text-fg-subtle">
          By signing in you agree to Plotto&apos;s{' '}
          <Link href="/tos" className="underline hover:text-fg-muted">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-fg-muted">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
