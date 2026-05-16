"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";

export default function InvitePreviewPage() {
  const { user, loading, signOut } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitWaitlist = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/access/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { ok?: boolean; alreadyJoined?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Could not join the waitlist.");
      }
      if (data.alreadyJoined) {
        setMessage("You are already on the waitlist.");
      } else {
        setMessage("You are on the waitlist. We will Ping you when access opens.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Toatre is in invite-only preview</h1>
        <p style={styles.body}>
          Your sign-in was successful, but this account is not approved for Toatre yet.
          Join the waitlist and we will Ping you as soon as access opens.
        </p>

        <label style={styles.label} htmlFor="waitlist-email">Email</label>
        <input
          id="waitlist-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@email.com"
          style={styles.input}
        />

        <button
          type="button"
          onClick={submitWaitlist}
          disabled={busy || !email.trim()}
          style={{
            ...styles.primaryButton,
            opacity: busy || !email.trim() ? 0.65 : 1,
            cursor: busy || !email.trim() ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Joining..." : "Join waitlist"}
        </button>

        {message ? <p style={styles.success}>{message}</p> : null}
        {error ? <p style={styles.error}>{error}</p> : null}

        {!loading && user ? (
          <button type="button" onClick={() => void signOut()} style={styles.secondaryButton}>
            Sign out
          </button>
        ) : null}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "20px",
    background: "radial-gradient(circle at top, rgba(79, 70, 229, 0.20), rgba(2, 6, 23, 1) 55%)",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    border: "1px solid rgba(148, 163, 184, 0.25)",
    borderRadius: 20,
    background: "rgba(15, 23, 42, 0.82)",
    backdropFilter: "blur(14px)",
    padding: "24px",
  },
  title: {
    margin: "0 0 10px",
    color: "var(--color-text)",
    fontSize: 28,
    lineHeight: 1.2,
  },
  body: {
    margin: "0 0 20px",
    color: "var(--color-text-secondary)",
    lineHeight: 1.6,
  },
  label: {
    display: "block",
    marginBottom: 8,
    color: "var(--color-text)",
    fontSize: 14,
  },
  input: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid var(--color-border-strong)",
    background: "rgba(15, 23, 42, 0.65)",
    color: "var(--color-text)",
    padding: "12px 14px",
    marginBottom: 12,
  },
  primaryButton: {
    width: "100%",
    borderRadius: 12,
    border: "none",
    padding: "12px 14px",
    color: "white",
    fontWeight: 700,
    background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
  },
  secondaryButton: {
    marginTop: 14,
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.4)",
    padding: "11px 14px",
    background: "transparent",
    color: "var(--color-text)",
  },
  success: {
    marginTop: 12,
    marginBottom: 0,
    color: "#86EFAC",
  },
  error: {
    marginTop: 12,
    marginBottom: 0,
    color: "#FCA5A5",
  },
};
