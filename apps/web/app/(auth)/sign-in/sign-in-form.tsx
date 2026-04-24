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

  const GOOGLE_BG = '#ffffff';
  const GOOGLE_BG_HOVER = '#f8f9fa';
  const GOOGLE_BORDER = '#dadce0';
  const GOOGLE_TEXT = '#3c4043';
  const APPLE_BG = '#000000';
  const APPLE_BG_HOVER = '#1a1a1a';

  function onGoogleMouseEnter(e: React.MouseEvent<HTMLButtonElement>) {
    if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = GOOGLE_BG_HOVER;
  }
  function onGoogleMouseLeave(e: React.MouseEvent<HTMLButtonElement>) {
    if (!e.currentTarget.disabled)
      e.currentTarget.style.backgroundColor = oauthProvider === 'google' ? GOOGLE_BG_HOVER : GOOGLE_BG;
  }
  function onAppleMouseEnter(e: React.MouseEvent<HTMLButtonElement>) {
    if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = APPLE_BG_HOVER;
  }
  function onAppleMouseLeave(e: React.MouseEvent<HTMLButtonElement>) {
    if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = APPLE_BG;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {/* Google — brand guidelines: white bg, #dadce0 border, 4-colour G logo */}
        <button
          type="button"
          onClick={() => signInWithProvider('google')}
          disabled={isBusy || oauthProvider !== null}
          className="flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: oauthProvider === 'google' ? GOOGLE_BG_HOVER : GOOGLE_BG,
            borderColor: GOOGLE_BORDER,
            color: GOOGLE_TEXT,
          }}
          onMouseEnter={onGoogleMouseEnter}
          onMouseLeave={onGoogleMouseLeave}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {oauthProvider === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </button>

        {/* Apple — brand guidelines: black bg, white Apple logo */}
        <button
          type="button"
          onClick={() => signInWithProvider('apple')}
          disabled={isBusy || oauthProvider !== null}
          className="flex w-full items-center justify-center gap-3 rounded-lg border-0 px-4 py-2.5 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: APPLE_BG, color: '#ffffff' }}
          onMouseEnter={onAppleMouseEnter}
          onMouseLeave={onAppleMouseLeave}
        >
          <svg width="16" height="18" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 405.8 15.6 280.4 15.6 159.4c0-81.7 28.2-157.6 79.4-212.3C149.6-104.8 225.3-137 296.3-137c69.2 0 126.4 42.5 170.1 42.5 42.8 0 109.7-45 188.1-45 30.5 0 110.6 2.6 167.6 66.4zm-142.6-131c-21.4 24.3-53.5 42.5-87.5 42.5-5.2 0-10.3-.6-15.6-1.3-1.3-5.8-1.9-11.6-1.9-17.9 0-22.7 9.7-46.4 26.9-63.3 19.5-19.5 49.4-34.1 76-34.7 1.3 6.5 1.9 12.9 1.9 19.5 0 23.3-9 46.4-19.8 55.2z" fill="#fff"/>
          </svg>
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
