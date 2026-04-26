"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export default function LoginPage() {
  const { signInWithGoogle, signInWithApple, sendMagicLink } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState<"google" | "apple" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setBusy("google");
    setError(null);
    try {
      const { hasHandle } = await signInWithGoogle();
      router.push(hasHandle ? "/timeline" : "/signup");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (!msg.includes("popup-closed") && !msg.includes("cancelled")) {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setBusy(null);
    }
  };

  const handleApple = async () => {
    setBusy("apple");
    setError(null);
    try {
      const { hasHandle } = await signInWithApple();
      router.push(hasHandle ? "/timeline" : "/signup");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (!msg.includes("popup-closed") && !msg.includes("cancelled")) {
        setError("Apple sign-in failed. Please try again.");
      }
    } finally {
      setBusy(null);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy("email");
    setError(null);
    try {
      await sendMagicLink(email);
      setLinkSent(true);
    } catch {
      setError("Couldn't send the link. Check your email and try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Toatre" style={styles.logoIcon} />
          <span style={styles.logoText}>toatre</span>
        </div>

        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.subtext}>Your mic-first personal timeline.</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        {linkSent ? (
          <div style={styles.linkSentBox}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: "var(--color-text)" }}>
              Check your inbox
            </p>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              We sent a sign-in link to <strong>{email}</strong>
            </p>
            <button
              onClick={() => setLinkSent(false)}
              style={styles.linkSentBack}
            >
              Try a different email
            </button>
          </div>
        ) : (
          <>
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={!!busy}
              style={{
                ...styles.socialBtn,
                background: "#fff",
                color: "#1A1128",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                opacity: busy && busy !== "google" ? 0.5 : 1,
              }}
            >
              {busy === "google" ? <Spinner /> : <GoogleIcon />}
              Continue with Google
            </button>

            {/* Apple */}
            <button
              onClick={handleApple}
              disabled={!!busy}
              style={{
                ...styles.socialBtn,
                background: "#000",
                color: "#fff",
                border: "none",
                marginBottom: 24,
                opacity: busy && busy !== "apple" ? 0.5 : 1,
              }}
            >
              {busy === "apple" ? <Spinner light /> : <AppleIcon />}
              Continue with Apple
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>or continue with email</span>
              <div style={styles.dividerLine} />
            </div>

            {/* Email magic link */}
            <form onSubmit={handleEmail}>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border-strong)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="submit"
                disabled={!!busy || !email}
                style={{
                  ...styles.submitBtn,
                  opacity: busy && busy !== "email" || !email ? 0.55 : 1,
                  cursor: busy || !email ? "not-allowed" : "pointer",
                }}
              >
                {busy === "email" && <Spinner light />}
                Send magic link
              </button>
            </form>
          </>
        )}

        <p style={styles.legal}>
          By continuing you agree to our{" "}
          <a href="/tos" style={{ color: "var(--color-primary)" }}>Terms</a>{" "}
          and{" "}
          <a href="/privacy" style={{ color: "var(--color-primary)" }}>Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      className="animate-spin"
      aria-hidden
    >
      <circle
        cx={8}
        cy={8}
        r={6}
        stroke={light ? "rgba(255,255,255,0.3)" : "rgba(99,102,241,0.3)"}
        strokeWidth={2}
      />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        stroke={light ? "#fff" : "#6366F1"}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width={15} height={18} viewBox="0 0 814 1000" fill="white" aria-hidden>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-165.2-122.8C81.9 740.2 32 587.2 32 440.9c0-192.7 119.7-294.5 235.1-294.5 79.7 0 148.8 48.6 196.7 48.6 44.7 0 125.2-51.6 216.3-51.6 34.1 0 143.8 3.2 213.2 114.4zM445.4 250.5c4.5-87.5 56.3-168.7 118.3-213.8 57.5-42.2 133.6-69.6 208.4-71.2v15.8c-77.3 5.8-160.4 52-214.4 108.7-47.4 50.1-88.1 125.8-97.7 200.5h-14.6z" />
    </svg>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--color-bg)",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "var(--color-card)",
    borderRadius: 24,
    padding: "40px 32px",
    boxShadow: "0 8px 48px rgba(99, 102, 241, 0.10)",
    border: "1px solid var(--color-border)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    objectFit: "cover",
  },
  logoText: {
    fontSize: 22,
    fontWeight: 700,
    background: "linear-gradient(90deg, #6366F1, #F59E0B)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6,
    color: "var(--color-text)",
  },
  subtext: {
    fontSize: 15,
    color: "var(--color-text-secondary)",
    marginBottom: 28,
  },
  errorBox: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#DC2626",
    fontSize: 14,
    marginBottom: 16,
  },
  socialBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "13px 16px",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 10,
    transition: "opacity 0.15s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "var(--color-border)",
  },
  dividerText: {
    fontSize: 13,
    color: "var(--color-text-muted)",
    whiteSpace: "nowrap",
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    border: "1.5px solid var(--color-border-strong)",
    borderRadius: 12,
    fontSize: 15,
    color: "var(--color-text)",
    background: "#FAFAFA",
    marginBottom: 10,
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    display: "block",
  },
  submitBtn: {
    width: "100%",
    padding: "13px 16px",
    background: "linear-gradient(135deg, #6366F1, #7C3AED)",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "opacity 0.15s",
  },
  linkSentBox: {
    textAlign: "center",
    padding: "28px 20px",
    background: "var(--color-primary-light)",
    borderRadius: 16,
    marginBottom: 4,
  },
  linkSentBack: {
    marginTop: 16,
    color: "var(--color-primary)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  legal: {
    marginTop: 24,
    fontSize: 12,
    color: "var(--color-text-muted)",
    textAlign: "center",
    lineHeight: 1.5,
  },
};
