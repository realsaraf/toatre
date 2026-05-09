"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  AppBrand,
  BottomTabBar,
  CalendarIcon,
  InboxIcon,
  PeopleIcon,
  SearchIcon,
  TimelineIcon,
} from "@/components/mobile-ui";

interface BookingToat {
  id: string;
  title: string;
  state: string;
  bookingRequestId: string | null;
  enrichments?: {
    time?: { at?: string; endAt?: string };
    communication?: { contact?: string; email?: string; phone?: string; message?: string };
  };
  createdAt: string;
}

function formatSlot(at?: string, endAt?: string): string {
  if (!at) return "Time not set";
  const start = new Date(at);
  const startStr = start.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  if (!endAt) return startStr;
  const endStr = new Date(endAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${startStr} – ${endStr}`;
}

function timeFromNow(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function InboxPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [toats, setToats] = useState<BookingToat[]>([]);
  const [loadingState, setLoadingState] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  const authorizedFetch = useCallback(async (input: string, init?: RequestInit) => {
    if (!user) throw new Error("Auth required");
    const token = await user.getIdToken();
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetch(input, { ...init, headers });
  }, [user]);

  const loadInbox = useCallback(async () => {
    if (!user) return;
    setLoadingState(true);
    try {
      const res = await authorizedFetch("/api/toats?source=booking_request&state=open");
      const data = (await res.json()) as { toats?: BookingToat[] };
      setToats(data.toats ?? []);
    } catch { /* silent */ }
    finally { setLoadingState(false); }
  }, [authorizedFetch, user]);

  useEffect(() => { void loadInbox(); }, [loadInbox]);

  const act = useCallback(async (toat: BookingToat, state: "accepted" | "denied") => {
    if (!toat.bookingRequestId) return;
    setActioningId(toat.id);
    setNotice(null);
    try {
      const res = await authorizedFetch(`/api/booking/requests/${toat.bookingRequestId}`, {
        method: "PATCH",
        body: JSON.stringify({ state }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(d?.error ?? "Could not complete action.");
      }
      setNotice(state === "accepted" ? "Booking accepted — booker has been notified." : "Booking declined — booker has been notified.");
      void loadInbox();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActioningId(null);
    }
  }, [authorizedFetch, loadInbox]);

  return (
    <div style={s.page}>
      <div style={s.bgGlow1} />

      <header style={s.header}>
        <AppBrand />
      </header>

      <main style={s.main}>
        <div style={s.titleRow}>
          <h1 style={s.pageTitle}>Inbox</h1>
          <span style={s.badge}>{toats.length > 0 ? toats.length : ""}</span>
        </div>
        <p style={s.pageSubtitle}>Pending booking requests. Accept or decline each one.</p>

        {notice && (
          <div style={s.notice}>{notice}</div>
        )}

        {loadingState ? (
          <div style={s.center}>
            <div style={s.spinner} className="animate-spin" />
          </div>
        ) : toats.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>📭</div>
            <p style={s.emptyTitle}>All clear</p>
            <p style={s.emptyBody}>No pending booking requests right now.</p>
          </div>
        ) : (
          <div style={s.list}>
            {toats.map((toat) => {
              const comm = toat.enrichments?.communication;
              const time = toat.enrichments?.time;
              const isActioning = actioningId === toat.id;
              return (
                <div key={toat.id} style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={s.avatarCircle}>{(comm?.contact ?? "?")[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={s.bookerName}>{comm?.contact ?? "Unknown"}</p>
                      <p style={s.bookerEmail}>{comm?.email ?? ""}</p>
                    </div>
                    <span style={s.timeAgo}>{timeFromNow(toat.createdAt)}</span>
                  </div>

                  <div style={s.slotPill}>
                    <span style={{ fontSize: 14 }}>📅</span>
                    <span style={s.slotText}>{formatSlot(time?.at, time?.endAt)}</span>
                  </div>

                  {comm?.message && (
                    <p style={s.message}>&ldquo;{comm.message}&rdquo;</p>
                  )}

                  {comm?.phone && (
                    <p style={s.phoneRow}>📞 {comm.phone}</p>
                  )}

                  <div style={s.actionRow}>
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => void act(toat, "accepted")}
                      style={{ ...s.acceptBtn, ...(isActioning ? s.btnDisabled : {}) }}
                    >
                      {isActioning ? "…" : "Accept"}
                    </button>
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => void act(toat, "denied")}
                      style={{ ...s.denyBtn, ...(isActioning ? s.btnDisabled : {}) }}
                    >
                      {isActioning ? "…" : "Decline"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomTabBar
        items={[
          { label: "Timeline", icon: <TimelineIcon />, href: "/timeline" },
          { label: "Search", icon: <SearchIcon /> },
          { label: "People", icon: <PeopleIcon /> },
          { label: "Inbox", icon: <InboxIcon />, href: "/inbox" },
          { label: "Calendar", icon: <CalendarIcon />, href: "/timeline" },
        ]}
      />
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "linear-gradient(180deg,#FBFAFF 0%,#F7F5FF 52%,#FBFAFF 100%)", position: "relative" },
  bgGlow1: { position: "absolute", top: -120, left: -160, width: 420, height: 420, background: "radial-gradient(circle, rgba(91,61,245,0.10), transparent)", filter: "blur(24px)", pointerEvents: "none" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0" },
  main: { padding: "12px 16px 120px", maxWidth: 600, margin: "0 auto" },

  titleRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  pageTitle: { fontSize: 28, fontWeight: 800, color: "#1E1B4B", margin: 0, letterSpacing: -0.8 },
  badge: { fontSize: 13, fontWeight: 700, background: "rgba(91,61,245,0.12)", color: "#5B3DF5", borderRadius: 999, padding: "3px 10px", minWidth: 22, textAlign: "center" },
  pageSubtitle: { fontSize: 14, color: "#6B7280", margin: "0 0 20px" },

  notice: { fontSize: 14, color: "#374151", background: "rgba(91,61,245,0.08)", border: "1px solid rgba(91,61,245,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 },

  center: { display: "flex", justifyContent: "center", paddingTop: 60 },
  spinner: { width: 36, height: 36, border: "3px solid rgba(91,61,245,0.15)", borderTopColor: "#5B3DF5", borderRadius: "50%" },

  empty: { textAlign: "center", padding: "60px 20px" },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#1E1B4B", margin: "0 0 6px" },
  emptyBody: { fontSize: 14, color: "#6B7280", margin: 0 },

  list: { display: "flex", flexDirection: "column", gap: 14 },

  card: { background: "#fff", borderRadius: 18, border: "1px solid rgba(91,61,245,0.1)", padding: "16px", boxShadow: "0 2px 12px rgba(91,61,245,0.06)" },
  cardHeader: { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, background: "linear-gradient(135deg,#5B3DF5,#9333EA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 },
  bookerName: { fontSize: 15, fontWeight: 700, color: "#1E1B4B", margin: "0 0 2px" },
  bookerEmail: { fontSize: 12, color: "#9CA3AF", margin: 0 },
  timeAgo: { fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap", paddingTop: 2 },

  slotPill: { display: "flex", gap: 8, alignItems: "center", background: "rgba(91,61,245,0.07)", borderRadius: 10, padding: "8px 12px", marginBottom: 10, border: "1px solid rgba(91,61,245,0.13)" },
  slotText: { fontSize: 13, fontWeight: 600, color: "#5B3DF5" },

  message: { fontSize: 13, color: "#4B5563", fontStyle: "italic", margin: "0 0 10px", padding: "10px 12px", background: "#F9FAFB", borderRadius: 10, lineHeight: 1.5 },
  phoneRow: { fontSize: 13, color: "#6B7280", margin: "0 0 10px" },

  actionRow: { display: "flex", gap: 10 },
  acceptBtn: { flex: 1, padding: "10px", background: "linear-gradient(135deg,#059669,#10B981)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  denyBtn: { flex: 1, padding: "10px", background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 12, color: "#DC2626", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
};
