"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Spinner, GoogleIcon, AppleIcon } from "./_components/LoginIcons";
import { styles } from "./login.styles";

export default function LoginPage() {
  const { signInWithGoogle, signInWithApple, sendMagicLink, pendingRedirect } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState<"google" | "apple" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // After a sign-in redirect returns, the AuthProvider exposes the result here.
  useEffect(() => {
    if (pendingRedirect) {
      if (pendingRedirect.accessLevel === "blocked") {
        router.push("/invite-preview");
        return;
      }
      if (pendingRedirect.accessLevel === "admin") {
        router.push("/admin");
        return;
      }
      router.push(pendingRedirect.hasHandle ? "/timeline" : "/signup");
    }
  }, [pendingRedirect, router]);

  const handleGoogle = async () => {
    setBusy("google");
    setError(null);
    try {
      await signInWithGoogle();
      // Page navigates away; nothing to do.
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? "";
      const msg = e instanceof Error ? e.message : "";
      console.error("[login] google sign-in failed", { code, msg, raw: e });
      setError(`Google sign-in failed${code ? ` (${code})` : ""}. Please try again.`);
      setBusy(null);
    }
  };

  const handleApple = async () => {
    setBusy("apple");
    setError(null);
    try {
      await signInWithApple();
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? "";
      const msg = e instanceof Error ? e.message : "";
      console.error("[login] apple sign-in failed", { code, msg, raw: e });
      setError(`Apple sign-in failed${code ? ` (${code})` : ""}. Please try again.`);
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
        <p style={styles.subtext}>Own your slice of time.</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        {linkSent ? (
          <div style={styles.linkSentBox}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>âœ‰ï¸</div>
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

/* â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

