"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";

type ApprovedUser = {
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

const ADMIN_EMAIL = "realsaraf@gmail.com";

export default function AdminPage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [rows, setRows] = useState<ApprovedUser[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const isAdmin = useMemo(() => user?.email?.toLowerCase() === ADMIN_EMAIL, [user?.email]);

  const loadRows = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/approved-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json()) as { users?: ApprovedUser[]; error?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? data.error ?? "Failed to load approved users.");
      }
      setRows(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) return;
    void loadRows();
  }, [user, isAdmin]);

  const addUser = async () => {
    if (!user || !newEmail.trim()) return;
    setBusy(true);
    setError(null);
    setFlash(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/approved-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? data.error ?? "Could not add the user.");
      }
      setNewEmail("");
      setFlash("Approved user saved.");
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const setActive = async (email: string, isActive: boolean) => {
    if (!user) return;
    setBusy(true);
    setError(null);
    setFlash(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/approved-users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, isActive }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? data.error ?? "Could not update status.");
      }
      setFlash("User status updated.");
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const removeUser = async (email: string) => {
    if (!user) return;
    setBusy(true);
    setError(null);
    setFlash(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/approved-users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? data.error ?? "Could not remove the user.");
      }
      setFlash("Approved user removed.");
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>Loading admin…</section>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <h1 style={styles.title}>Admin access</h1>
          <p style={styles.text}>Sign in with Google as realsaraf@gmail.com to manage preview access.</p>
          <button style={styles.primaryButton} onClick={() => void signInWithGoogle()}>
            Continue with Google
          </button>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <h1 style={styles.title}>Admin access denied</h1>
          <p style={styles.text}>Only realsaraf@gmail.com can use this page, signed in with Google.</p>
          <button style={styles.secondaryButton} onClick={() => void signOut()}>
            Sign out
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Toatre preview access</h1>
        <p style={styles.text}>Manage which emails can access Toatre during invite-only preview.</p>

        <div style={styles.addRow}>
          <input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="user@email.com"
            style={styles.input}
          />
          <button
            type="button"
            onClick={addUser}
            disabled={busy || !newEmail.trim()}
            style={{ ...styles.primaryButton, width: 150, opacity: busy || !newEmail.trim() ? 0.65 : 1 }}
          >
            Add user
          </button>
        </div>

        {flash ? <p style={styles.success}>{flash}</p> : null}
        {error ? <p style={styles.error}>{error}</p> : null}

        <div style={styles.list}>
          {rows.map((row) => (
            <article key={row.email} style={styles.rowCard}>
              <div>
                <div style={styles.email}>{row.email}</div>
                <div style={styles.meta}>Updated by {row.updatedBy} · {new Date(row.updatedAt).toLocaleString()}</div>
              </div>
              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={() => void setActive(row.email, !row.isActive)}
                  style={styles.secondaryButton}
                  disabled={busy}
                >
                  {row.isActive ? "Inactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => void removeUser(row.email)}
                  style={styles.dangerButton}
                  disabled={busy}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}

          {!busy && rows.length === 0 ? <p style={styles.text}>No approved users yet.</p> : null}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    display: "grid",
    placeItems: "center",
    background: "radial-gradient(circle at top, rgba(245, 158, 11, 0.18), rgba(2, 6, 23, 1) 58%)",
  },
  card: {
    width: "100%",
    maxWidth: 900,
    borderRadius: 20,
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(15, 23, 42, 0.82)",
    backdropFilter: "blur(14px)",
    padding: "24px",
  },
  title: {
    margin: "0 0 10px",
    color: "var(--color-text)",
    fontSize: 30,
    lineHeight: 1.2,
  },
  text: {
    margin: "0 0 18px",
    color: "var(--color-text-secondary)",
    lineHeight: 1.6,
  },
  addRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    marginBottom: 14,
  },
  input: {
    borderRadius: 12,
    border: "1px solid var(--color-border-strong)",
    background: "rgba(15, 23, 42, 0.65)",
    color: "var(--color-text)",
    padding: "12px 14px",
  },
  list: {
    display: "grid",
    gap: 10,
    marginTop: 10,
  },
  rowCard: {
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.24)",
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  email: {
    color: "var(--color-text)",
    fontWeight: 700,
  },
  meta: {
    color: "var(--color-text-secondary)",
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    display: "flex",
    gap: 8,
  },
  primaryButton: {
    borderRadius: 12,
    border: "none",
    padding: "12px 14px",
    color: "white",
    fontWeight: 700,
    background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
  },
  secondaryButton: {
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.38)",
    padding: "10px 12px",
    background: "transparent",
    color: "var(--color-text)",
  },
  dangerButton: {
    borderRadius: 12,
    border: "1px solid rgba(248, 113, 113, 0.55)",
    padding: "10px 12px",
    background: "rgba(127, 29, 29, 0.24)",
    color: "#FCA5A5",
  },
  success: {
    margin: "0 0 12px",
    color: "#86EFAC",
  },
  error: {
    margin: "0 0 12px",
    color: "#FCA5A5",
  },
};
