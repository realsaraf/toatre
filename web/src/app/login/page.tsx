"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithGoogle,
  sendEmailMagicLink,
  sendPhoneOtp,
  getClientAuth,
} from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import { RecaptchaVerifier, type ConfirmationResult } from "firebase/auth";

type Tab = "google" | "email" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("google");

  // Email tab state
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Phone tab state
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Google tab state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  // Redirect once AuthProvider has synced the session and user is confirmed.
  // AuthProvider's onIdTokenChanged calls syncSession, which POSTs the cookie
  // server-side before setting loading:false. So when we see !loading && user
  // the cookie is already set and the (authed) layout will let us through.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/timeline");
    }
  }, [user, loading, router]);

  // Initialise invisible reCAPTCHA for phone sign-in
  useEffect(() => {
    if (activeTab === "phone" && recaptchaRef.current && !recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        getClientAuth(),
        recaptchaRef.current,
        { size: "invisible" }
      );
    }
  }, [activeTab]);

  async function handleGoogle() {
    setGoogleLoading(true);
    setGoogleError("");
    try {
      await signInWithGoogle();
      // AuthProvider's onIdTokenChanged fires, calls syncSession (POST /api/auth/session),
      // then sets loading:false — the useEffect above handles the redirect.
    } catch {
      setGoogleError("I didn't quite catch that. Mind trying again?");
      setGoogleLoading(false);
    }
    // Keep googleLoading true while AuthProvider redirects — page unmounts naturally.
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError("");
    try {
      await sendEmailMagicLink(email);
      setEmailSent(true);
    } catch {
      setEmailError("I didn't quite catch that. Mind trying again?");
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePhoneSend(e: React.FormEvent) {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneError("");
    try {
      if (!recaptchaVerifierRef.current) {
        throw new Error("reCAPTCHA not ready.");
      }
      const result = await sendPhoneOtp(phone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setPhoneSent(true);
    } catch {
      setPhoneError("I didn't quite catch that. Mind trying again?");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handlePhoneVerify(e: React.FormEvent) {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneError("");
    try {
      if (!confirmationResult) throw new Error("No confirmation result.");
      await confirmationResult.confirm(otpCode);
      // AuthProvider's onIdTokenChanged fires, syncs session, and the useEffect
      // above handles the redirect — same pattern as Google sign-in.
    } catch {
      setPhoneError("That code didn't match. Try again?");
      setPhoneLoading(false);
    }
    // Keep phoneLoading true while AuthProvider redirects — page unmounts naturally.
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--color-text-muted)" }}>Just a moment…</p>
      </main>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "google", label: "Google" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Phone" },
  ];

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Wordmark */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-3xl font-bold tracking-tight brand-gradient-text"
          aria-label="Back to toatre homepage"
        >
          toatre
        </Link>
      </div>

      <div className="glass-card w-full max-w-sm p-8">
        {/* Tabs */}
        <div className="flex mb-6 gap-1 rounded-lg p-1" style={{ background: "var(--color-bg)" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 text-sm font-medium rounded-md transition-colors"
              style={
                activeTab === tab.id
                  ? {
                      background: "var(--color-bg-elevated)",
                      color: "var(--color-text)",
                    }
                  : { color: "var(--color-text-muted)" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Google tab */}
        {activeTab === "google" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
              Sign in with your Google account — no password needed.
            </p>
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
              style={{
                background: "linear-gradient(90deg, var(--color-gradient-start), var(--color-gradient-end))",
                color: "#fff",
              }}
            >
              {googleLoading ? "Signing in…" : "Continue with Google"}
            </button>
            {googleError && (
              <p className="text-sm text-center" style={{ color: "var(--color-error)" }}>
                {googleError}
              </p>
            )}
          </div>
        )}

        {/* Email tab */}
        {activeTab === "email" && (
          <div>
            {emailSent ? (
              <div className="text-center">
                <p className="text-base font-medium mb-2" style={{ color: "var(--color-text)" }}>
                  Check your inbox.
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  We&apos;ve sent you a link. It&apos;s good for a few minutes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    Email address
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                  style={{
                    background: "linear-gradient(90deg, var(--color-gradient-start), var(--color-gradient-end))",
                    color: "#fff",
                  }}
                >
                  {emailLoading ? "Sending…" : "Send magic link"}
                </button>
                {emailError && (
                  <p className="text-sm text-center" style={{ color: "var(--color-error)" }}>
                    {emailError}
                  </p>
                )}
              </form>
            )}
          </div>
        )}

        {/* Phone tab */}
        {activeTab === "phone" && (
          <div>
            <div ref={recaptchaRef} />
            {!phoneSent ? (
              <form onSubmit={handlePhoneSend} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    Phone number
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 415 555 1234"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                  style={{
                    background: "linear-gradient(90deg, var(--color-gradient-start), var(--color-gradient-end))",
                    color: "#fff",
                  }}
                >
                  {phoneLoading ? "Sending…" : "Send code"}
                </button>
                {phoneError && (
                  <p className="text-sm text-center" style={{ color: "var(--color-error)" }}>
                    {phoneError}
                  </p>
                )}
              </form>
            ) : (
              <form onSubmit={handlePhoneVerify} className="flex flex-col gap-4">
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  We sent a code to {phone}. Enter it below.
                </p>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    Verification code
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                  style={{
                    background: "linear-gradient(90deg, var(--color-gradient-start), var(--color-gradient-end))",
                    color: "#fff",
                  }}
                >
                  {phoneLoading ? "Verifying…" : "Verify"}
                </button>
                {phoneError && (
                  <p className="text-sm text-center" style={{ color: "var(--color-error)" }}>
                    {phoneError}
                  </p>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
