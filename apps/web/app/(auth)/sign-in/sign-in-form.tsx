'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

type Status = 'idle' | 'sending' | 'code_sent' | 'verifying' | 'verified' | 'error';

export default function SignInForm({ initialError }: { initialError: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>(initialError ? 'error' : 'idle');
  const [oauthProvider, setOauthProvider] = useState<null | 'google' | 'apple'>(null);
  const [message, setMessage] = useState<string | null>(initialError);

  function callbackUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/auth/callback?next=/timeline`;
  }

  async function signInWithProvider(provider: 'google' | 'apple') {
    setOauthProvider(provider);
    setStatus('idle');
    setMessage(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl(),
      },
    });
    if (error) {
      setOauthProvider(null);
      setStatus('error');
      setMessage(error.message);
    }
  }

  async function requestOtp(isResend = false) {
    setStatus('sending');
    setMessage(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }
    setStatus('code_sent');
    setMessage(isResend ? 'Code resent! Check your inbox.' : 'Code sent! Check your inbox.');
  }

  async function sendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOauthProvider(null);
    await requestOtp(false);
  }

  async function verifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('verifying');
    setMessage(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }
    setStatus('verified');
    router.push('/timeline');
  }

  function resetToEmailStep() {
    setCode('');
    setMessage(null);
    setStatus('idle');
  }

  const isBusy = status === 'sending' || status === 'verifying' || status === 'verified';

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => signInWithProvider('google')}
          disabled={isBusy || oauthProvider !== null}
          className="w-full rounded-lg border border-line-strong bg-card px-4 py-2.5 text-sm font-semibold text-fg shadow-sm transition hover:border-line-strong hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {oauthProvider === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </button>
        <button
          type="button"
          onClick={() => signInWithProvider('apple')}
          disabled={isBusy || oauthProvider !== null}
          className="w-full rounded-lg border border-line-strong bg-card px-4 py-2.5 text-sm font-semibold text-fg shadow-sm transition hover:border-line-strong hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {oauthProvider === 'apple' ? 'Opening Apple…' : 'Continue with Apple'}
        </button>
      </div>

      <div className="relative py-1">
        <div className="border-t border-line" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-medium uppercase tracking-wider text-fg-subtle">
          Or sign in with email code
        </span>
      </div>

      {status !== 'code_sent' && status !== 'verifying' && status !== 'verified' ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-fg-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line-strong bg-card px-3.5 py-2.5 text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={isBusy || oauthProvider !== null}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg shadow-sm transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-fg-muted">
              6-digit code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              pattern="\d{6}"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-line-strong bg-card px-3.5 py-3 text-center font-mono text-2xl tracking-widest text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'verifying' || status === 'verified'}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg shadow-sm transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'verifying' ? 'Verifying…' : status === 'verified' ? 'Signed in!' : 'Verify code'}
          </button>
          <div className="flex items-center justify-between text-xs text-fg-muted">
            <button type="button" onClick={resetToEmailStep} className="underline hover:text-fg">
              Change email
            </button>
            <button
              type="button"
              onClick={() => {
                setCode('');
                requestOtp(true);
              }}
              disabled={status === 'verifying' || status === 'verified'}
              className="underline hover:text-fg disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </form>
      )}

      {message && (
        <p
          className={
            status === 'error'
              ? 'text-sm text-red-700'
              : 'text-sm text-fg-muted'
          }
        >
          {message}
        </p>
      )}
      <p className="text-xs text-fg-muted">
        Same verified email means the Google, Apple, and email-code identities will
        be linked to one Plotto account.
      </p>
    </div>
  );
}
