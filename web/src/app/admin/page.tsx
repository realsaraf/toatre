"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { ToatreMark } from "@/components/ToatreMark";

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
  const activeCount = rows.filter((row) => row.isActive).length;
  const inactiveCount = rows.length - activeCount;

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
        <section style={styles.shell}>
          <div style={styles.loadingCard}>Loading preview access…</div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={styles.page}>
        <section style={styles.shell}>
          <Hero />
          <section style={styles.panelCard}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.eyebrow}>Admin access</p>
                <h1 style={styles.title}>Preview access control</h1>
                <p style={styles.text}>Sign in with Google as realsaraf@gmail.com to manage who can enter Toatre during invite-only preview.</p>
              </div>
            </div>
            <button style={styles.primaryButton} onClick={() => void signInWithGoogle()}>
              Continue with Google
            </button>
          </section>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main style={styles.page}>
        <section style={styles.shell}>
          <Hero />
          <section style={styles.panelCard}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.eyebrow}>Access denied</p>
                <h1 style={styles.title}>This page is reserved for the preview owner</h1>
                <p style={styles.text}>Only realsaraf@gmail.com signed in with Google can manage preview access.</p>
              </div>
            </div>
            <button style={styles.secondaryButton} onClick={() => void signOut()}>
              Sign out
            </button>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <Hero />

        <section style={styles.panelCard}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.eyebrow}>Invite-only preview</p>
              <h1 style={styles.title}>Toatre preview access</h1>
              <p style={styles.text}>Manage which emails can step into Toatre before the wider launch.</p>
            </div>
            <button style={styles.headerGhostButton} onClick={() => void signOut()}>
              Sign out
            </button>
          </div>

          <div style={styles.statGrid}>
            <StatCard label="Approved" value={String(rows.length)} tone="brand" />
            <StatCard label="Active" value={String(activeCount)} tone="success" />
            <StatCard label="Inactive" value={String(inactiveCount)} tone="muted" />
          </div>

          <section style={styles.composerCard}>
            <div style={styles.composerCopy}>
              <h2 style={styles.sectionTitle}>Add preview access</h2>
              <p style={styles.sectionText}>Drop in an email and it will be saved as active preview access immediately.</p>
            </div>
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
                style={{ ...styles.primaryButton, opacity: busy || !newEmail.trim() ? 0.65 : 1 }}
              >
                Add user
              </button>
            </div>
          </section>

          {flash ? <p style={styles.success}>{flash}</p> : null}
          {error ? <p style={styles.error}>{error}</p> : null}

          <section style={styles.listSection}>
            <div style={styles.listHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Approved emails</h2>
                <p style={styles.sectionText}>Activate, pause, or remove access as the preview expands.</p>
              </div>
            </div>

            <div style={styles.list}>
              {rows.map((row) => (
                <article key={row.email} style={styles.rowCard}>
                  <div style={styles.rowMain}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={styles.rowTopline}>
                        <div style={styles.email}>{row.email}</div>
                        <span style={{
                          ...styles.statusBadge,
                          ...(row.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive),
                        }}>
                          {row.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div style={styles.meta}>Updated by {row.updatedBy} · {new Date(row.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={styles.actions}>
                    <button
                      type="button"
                      onClick={() => void setActive(row.email, !row.isActive)}
                      style={styles.secondaryButton}
                      disabled={busy}
                    >
                      {row.isActive ? "Pause access" : "Activate"}
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

              {!busy && rows.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyOrb}>✦</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <h3 style={styles.emptyTitle}>No preview members yet</h3>
                    <p style={styles.emptyText}>Start with your first approved email and build the preview list from there.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function Hero() {
  return (
    <section style={styles.heroCard}>
      <div style={styles.heroGlow} />
      <div style={styles.heroContent}>
        <div style={styles.brandRow}>
          <div style={styles.brandIconWrap}>
            <img src="/icon.png" alt="Toatre" style={styles.brandIcon} />
          </div>
          <ToatreMark width={152} />
        </div>
        <p style={styles.heroEyebrow}>Preview control room</p>
        <h2 style={styles.heroTitle}>Keep the invite-only rollout calm, curated, and on-brand.</h2>
        <p style={styles.heroText}>This is the private surface for deciding who can step into Toatre before launch.</p>
      </div>
      <div style={styles.heroAccentCard}>
        <span style={styles.heroAccentLabel}>Mode</span>
        <strong style={styles.heroAccentValue}>Invite-only preview</strong>
      </div>
    </section>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "brand" | "success" | "muted" }) {
  const toneStyle =
    tone === "brand"
      ? styles.statToneBrand
      : tone === "success"
        ? styles.statToneSuccess
        : styles.statToneMuted;

  return (
    <article style={{ ...styles.statCard, ...toneStyle }}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "32px 20px 48px",
    background: "radial-gradient(circle at 50% -10%, rgba(245, 158, 11, 0.24), rgba(245, 158, 11, 0.08) 24%, rgba(8, 12, 32, 0) 46%), linear-gradient(180deg, #05081A 0%, #090D22 28%, #0B112A 100%)",
  },
  shell: {
    width: "min(100%, 1120px)",
    margin: "0 auto",
    display: "grid",
    gap: 22,
  },
  heroCard: {
    width: "100%",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(18, 24, 49, 0.84))",
    boxShadow: "0 34px 120px rgba(0,0,0,0.34)",
    padding: "28px",
    position: "relative",
    overflow: "hidden",
    display: "grid",
    gap: 18,
  },
  heroGlow: {
    position: "absolute",
    inset: "auto -40px -80px auto",
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.28), rgba(245,158,11,0.14) 38%, rgba(99,102,241,0) 70%)",
    filter: "blur(10px)",
    pointerEvents: "none",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gap: 12,
    maxWidth: 700,
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  brandIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    background: "rgba(255,255,255,0.08)",
    display: "grid",
    placeItems: "center",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    objectFit: "cover",
  },
  heroEyebrow: {
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(245, 158, 11, 0.88)",
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(30px, 5vw, 48px)",
    lineHeight: 1.02,
    fontWeight: 700,
    color: "#F8FAFC",
    maxWidth: 760,
  },
  heroText: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.6,
    color: "rgba(226, 232, 240, 0.74)",
    maxWidth: 620,
  },
  heroAccentCard: {
    position: "relative",
    zIndex: 1,
    justifySelf: "start",
    display: "grid",
    gap: 4,
    padding: "14px 18px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
  },
  heroAccentLabel: {
    fontSize: 12,
    color: "rgba(226, 232, 240, 0.62)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  heroAccentValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: 700,
  },
  panelCard: {
    width: "100%",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(180deg, rgba(17, 24, 39, 0.92), rgba(15, 23, 42, 0.88))",
    backdropFilter: "blur(18px)",
    padding: "28px",
    boxShadow: "0 30px 90px rgba(0,0,0,0.28)",
    display: "grid",
    gap: 22,
  },
  loadingCard: {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(15, 23, 42, 0.88)",
    padding: "40px",
    color: "#F8FAFC",
    textAlign: "center",
    fontSize: 18,
  },
  title: {
    margin: 0,
    color: "#F8FAFC",
    fontSize: 34,
    lineHeight: 1.2,
    fontWeight: 700,
  },
  eyebrow: {
    margin: "0 0 10px",
    color: "rgba(245, 158, 11, 0.88)",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    fontSize: 12,
    fontWeight: 700,
  },
  text: {
    margin: "10px 0 0",
    color: "rgba(226, 232, 240, 0.68)",
    fontSize: 16,
    lineHeight: 1.6,
  },
  panelHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  headerGhostButton: {
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "11px 16px",
    background: "rgba(255,255,255,0.05)",
    color: "#F8FAFC",
    fontWeight: 600,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  statCard: {
    borderRadius: 20,
    padding: "18px 18px 16px",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "grid",
    gap: 8,
  },
  statToneBrand: {
    background: "linear-gradient(135deg, rgba(79, 70, 229, 0.18), rgba(245, 158, 11, 0.14))",
  },
  statToneSuccess: {
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.16), rgba(16, 185, 129, 0.1))",
  },
  statToneMuted: {
    background: "linear-gradient(135deg, rgba(148, 163, 184, 0.12), rgba(71, 85, 105, 0.08))",
  },
  statLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "rgba(226, 232, 240, 0.66)",
  },
  statValue: {
    fontSize: 32,
    lineHeight: 1,
    color: "#F8FAFC",
    fontWeight: 700,
  },
  composerCard: {
    display: "grid",
    gap: 14,
    borderRadius: 22,
    padding: 20,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  composerCopy: {
    display: "grid",
    gap: 6,
  },
  sectionTitle: {
    margin: 0,
    color: "#F8FAFC",
    fontSize: 20,
    lineHeight: 1.2,
    fontWeight: 650,
  },
  sectionText: {
    margin: 0,
    color: "rgba(226, 232, 240, 0.64)",
    lineHeight: 1.55,
  },
  addRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
  },
  input: {
    borderRadius: 16,
    border: "1px solid rgba(99, 102, 241, 0.34)",
    background: "rgba(7, 11, 29, 0.42)",
    color: "#F8FAFC",
    padding: "14px 16px",
    fontSize: 15,
  },
  listSection: {
    display: "grid",
    gap: 14,
  },
  listHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  list: {
    display: "grid",
    gap: 12,
  },
  rowCard: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    background: "rgba(255,255,255,0.04)",
  },
  rowMain: {
    flex: 1,
    minWidth: 260,
  },
  rowTopline: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  email: {
    color: "#F8FAFC",
    fontWeight: 700,
    fontSize: 17,
  },
  meta: {
    color: "rgba(148, 163, 184, 0.86)",
    fontSize: 12,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
  },
  statusBadgeActive: {
    background: "rgba(34, 197, 94, 0.14)",
    color: "#86EFAC",
    border: "1px solid rgba(34, 197, 94, 0.25)",
  },
  statusBadgeInactive: {
    background: "rgba(148, 163, 184, 0.14)",
    color: "#CBD5E1",
    border: "1px solid rgba(148, 163, 184, 0.22)",
  },
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  primaryButton: {
    borderRadius: 16,
    border: "none",
    minHeight: 50,
    padding: "0 20px",
    color: "white",
    fontWeight: 700,
    background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
    boxShadow: "0 16px 36px rgba(79, 70, 229, 0.26)",
  },
  secondaryButton: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    minHeight: 44,
    padding: "0 14px",
    background: "rgba(255,255,255,0.05)",
    color: "#F8FAFC",
    fontWeight: 600,
  },
  dangerButton: {
    borderRadius: 14,
    border: "1px solid rgba(248, 113, 113, 0.34)",
    minHeight: 44,
    padding: "0 14px",
    background: "rgba(127, 29, 29, 0.26)",
    color: "#FECACA",
    fontWeight: 600,
  },
  success: {
    margin: 0,
    color: "#86EFAC",
    fontWeight: 600,
  },
  error: {
    margin: 0,
    color: "#FCA5A5",
    fontWeight: 600,
  },
  emptyState: {
    borderRadius: 22,
    border: "1px dashed rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
    padding: "28px 20px",
    display: "grid",
    justifyItems: "center",
    textAlign: "center",
    gap: 14,
  },
  emptyOrb: {
    width: 54,
    height: 54,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(79, 70, 229, 0.24), rgba(245, 158, 11, 0.22))",
    color: "#F8FAFC",
    fontSize: 24,
  },
  emptyTitle: {
    margin: 0,
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: 650,
  },
  emptyText: {
    margin: 0,
    color: "rgba(226, 232, 240, 0.66)",
    maxWidth: 420,
    lineHeight: 1.6,
  },
};
