"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { styles } from "./signup.styles";

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const sanitize = (v: string) =>
    v.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || handle.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ handle }),
      });

      let data: { error?: string } | null = null;
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        data = (await res.json()) as { error?: string };
      }

      if (!res.ok) throw new Error(data?.error ?? "Failed to save handle");
      router.push("/timeline");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Toatre" style={styles.logoIcon} />
          <span style={styles.logoText}>toatre</span>
        </div>

        {/* Steps indicator */}
        <div style={styles.steps}>
          <div style={{ ...styles.step, ...styles.stepDone }}>âœ“</div>
          <div style={styles.stepLine} />
          <div style={{ ...styles.step, ...styles.stepActive }}>2</div>
          <div style={styles.stepLine} />
          <div style={styles.step}>3</div>
        </div>

        <h1 style={styles.heading}>Pick your handle</h1>
        <p style={styles.subtext}>
          This is your unique @name â€” how others find and share with you.
        </p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <span style={styles.atSign}>@</span>
            <input
              type="text"
              placeholder="yourname"
              value={handle}
              onChange={(e) => setHandle(sanitize(e.target.value))}
              required
              minLength={2}
              maxLength={20}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              style={styles.handleInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-strong)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          <p style={styles.hint}>
            {handle.length > 0 ? (
              <>
                <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                  @{handle}
                </span>{" "}
                Â· {handle.length}/20 characters
              </>
            ) : (
              "Letters, numbers, and underscores only. 2â€“20 characters."
            )}
          </p>

          <button
            type="submit"
            disabled={busy || handle.length < 2}
            style={{
              ...styles.submitBtn,
              opacity: busy || handle.length < 2 ? 0.55 : 1,
              cursor: busy || handle.length < 2 ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Savingâ€¦" : "Continue â†’"}
          </button>
        </form>

        <p style={styles.skipHint}>
          You can change your handle later in Settings.
        </p>
      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.png"
          alt=""
          style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 16 }}
        />
      </div>
    </main>
  );
}

