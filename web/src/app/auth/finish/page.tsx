"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

async function createSession(user: User): Promise<{ hasHandle: boolean }> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    throw new Error("Session creation failed");
  }

  const data = (await res.json()) as { ok: boolean; hasHandle: boolean };
  return { hasHandle: data.hasHandle ?? false };
}

export default function AuthFinishPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"checking" | "needs-email" | "working" | "error">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      router.replace("/login");
      return;
    }

    const storedEmail = window.localStorage.getItem("toatre_email_for_link") ?? "";
    setEmail(storedEmail);

    if (!storedEmail) {
      setStatus("needs-email");
      return;
    }

    void completeSignIn(storedEmail);
  }, [router]);

  const completeSignIn = async (emailAddress: string) => {
    setStatus("working");
    setError(null);

    try {
      const result = await signInWithEmailLink(auth, emailAddress, window.location.href);
      window.localStorage.removeItem("toatre_email_for_link");

      const { hasHandle } = await createSession(result.user);
      router.replace(hasHandle ? "/timeline" : "/signup");
    } catch {
      setStatus("error");
      setError("Couldn't finish the magic link sign-in. Request a fresh link and try again.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      return;
    }

    await completeSignIn(email);
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <img src="/icon.png" alt="Toatre" style={styles.logoIcon} />
          <span style={styles.logoText}>toatre</span>
        </div>

        <h1 style={styles.heading}>Finishing sign-in</h1>
        <p style={styles.subtext}>
          {status === "needs-email"
            ? "Confirm the email address that received your magic link."
            : "Hold on while we bring your timeline back."}
        </p>

        {status === "needs-email" || status === "error" || status === "working" ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={styles.input}
            />

            <button
              type="submit"
              disabled={status === "working" || !email}
              style={{
                ...styles.button,
                opacity: status === "working" || !email ? 0.6 : 1,
                cursor: status === "working" || !email ? "not-allowed" : "pointer",
              }}
            >
              {status === "working" ? "Finishing..." : "Finish sign-in"}
            </button>
          </form>
        ) : (
          <div style={styles.statusBox}>
            <div style={styles.spinner} aria-hidden />
            <p style={styles.statusText}>Checking your link…</p>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </main>
  );
}

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
    fontSize: 24,
    fontWeight: 700,
    color: "var(--color-text)",
    letterSpacing: "-0.02em",
  },
  heading: {
    fontSize: 30,
    fontWeight: 700,
    color: "var(--color-text)",
    margin: "0 0 12px",
  },
  subtext: {
    fontSize: 15,
    color: "var(--color-text-secondary)",
    lineHeight: 1.6,
    margin: "0 0 24px",
  },
  form: {
    display: "grid",
    gap: 14,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid var(--color-border-strong)",
    background: "rgba(15, 23, 42, 0.45)",
    color: "var(--color-text)",
    fontSize: 15,
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
  },
  statusBox: {
    display: "grid",
    justifyItems: "center",
    gap: 12,
    padding: "20px 0 8px",
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid rgba(99, 102, 241, 0.2)",
    borderTopColor: "var(--color-primary)",
    animation: "spin 1s linear infinite",
  },
  statusText: {
    margin: 0,
    fontSize: 15,
    color: "var(--color-text-secondary)",
  },
  error: {
    marginTop: 16,
    marginBottom: 0,
    color: "#FCA5A5",
    fontSize: 14,
    lineHeight: 1.5,
  },
};