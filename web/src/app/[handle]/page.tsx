"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface HostInfo {
  displayName: string | null;
  handle: string | null;
  photoUrl: string | null;
}

interface Slot {
  start: string;
  end: string;
  blocked: boolean;
}

type HelpSection = "what" | "how" | "privacy" | null;

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  bookerHandle: string;
  message: string;
}

const EMPTY_FORM: BookingForm = { name: "", email: "", phone: "", bookerHandle: "", message: "" };

function groupSlotsByDay(slots: Slot[]): Map<string, Slot[]> {
  const map = new Map<string, Slot[]>();
  for (const slot of slots) {
    const day = new Date(slot.start).toLocaleDateString("en-CA");
    const existing = map.get(day) ?? [];
    existing.push(slot);
    map.set(day, existing);
  }
  return map;
}

function formatDay(isoDay: string): string {
  const d = new Date(isoDay + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatSlotRange(start: string, end: string): string {
  return formatTime(start) + " - " + formatTime(end);
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function CloseIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 13 13" fill="none">
      <path d="M1 1l11 11M12 1L1 12" stroke="#6B7280" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes bk-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #EDE9FE", borderTopColor: "#4F46E5", animation: "bk-spin 0.8s linear infinite" }} />
    </>
  );
}

function ToatreLogo({ size = 30 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/icon.png" alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), objectFit: "cover", display: "block" }} aria-hidden />;
}

function Avatar({ host, size = 72 }: { host: HostInfo; size?: number }) {
  const radius = size / 2;
  if (host.photoUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", flexShrink: 0, border: "3px solid #fff", boxShadow: "0 0 0 3px rgba(79,70,229,0.2)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={host.photoUrl} alt={host.displayName ?? "Host"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "3px solid #fff", boxShadow: "0 0 0 3px rgba(79,70,229,0.2)" }}>
      <span style={{ fontSize: size * 0.36, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>{initials(host.displayName)}</span>
    </div>
  );
}

function PageNav() {
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
      <a href="https://toatre.com" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <ToatreLogo size={28} />
        <span style={{ fontSize: 20, fontWeight: 800, color: "#0C183E", letterSpacing: -0.4 }}>toatre</span>
      </a>
      <a href="https://toatre.com/signup" style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #4F46E5, #4338CA)", padding: "9px 18px", borderRadius: 12, textDecoration: "none", boxShadow: "0 4px 12px rgba(79,70,229,0.25)", whiteSpace: "nowrap" as const }}>
        Get your Toat Link
      </a>
    </header>
  );
}

function HelpModal({ section, onClose }: { section: HelpSection; onClose: () => void }) {
  if (!section) return null;
  type Entry = { title: string; steps: { icon: string; title: string; desc: string }[] };
  const content: Record<NonNullable<HelpSection>, Entry> = {
    what: { title: "What is Toat Link?", steps: [
      { icon: "📅", title: "A personal booking page", desc: "Every Toatre user gets a public link at toatre.com/handle. Anyone can visit and request a slot." },
      { icon: "⚡", title: "Slots, not full calendar access", desc: "The host controls when slots are available. You see what is free, not what is in their calendar." },
      { icon: "🔔", title: "They confirm, you hear back", desc: "When you pick a slot, the host gets a Ping and decides to accept or decline. You get an email either way." },
    ]},
    how: { title: "How does it work?", steps: [
      { icon: "🎯", title: "Pick a time", desc: "Browse available slots. Green = free, greyed = taken." },
      { icon: "✍️", title: "Fill in your details", desc: "Name, email, and a quick note about what you'd like to meet about." },
      { icon: "📬", title: "Request is sent", desc: "The host gets a Ping in their Toatre app plus an email." },
      { icon: "✅", title: "Get your answer", desc: "Accept or decline. You get an email confirmation either way." },
    ]},
    privacy: { title: "Your privacy", steps: [
      { icon: "🔒", title: "No calendar details exposed", desc: "Blocked slots show as unavailable. Reasons and details are never visible to you." },
      { icon: "📧", title: "Your info goes only to the host", desc: "Your name, email, and message are shared only with the person you are booking with." },
      { icon: "🗑️", title: "You can always withdraw", desc: "If declined, your request is removed. No data is kept beyond what is needed for the booking." },
    ]},
  };
  const c = content[section];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }} onClick={onClose} role="dialog" aria-modal={true} aria-label={c.title}>
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 480, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(17,24,39,0.18), 0 0 0 1px rgba(79,70,229,0.08)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "16px auto 0", flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px 12px", borderBottom: "1px solid #F3F4F6" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>{c.title}</h2>
          <button type="button" onClick={onClose} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Close"><CloseIcon /></button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {c.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#EDE9FE,#E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>{step.icon}</div>
              <div>
                <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: "#111827" }}>{step.title}</p>
                <p style={{ margin: 0, fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>Built with <strong style={{ color: "#4F46E5" }}>toatre</strong></span>
          <a href="https://toatre.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4F46E5", textDecoration: "none", fontWeight: 600 }}>Get your Toat Link</a>
        </div>
      </div>
    </div>
  );
}

function FormField({ id, label, required, optional, children }: { id: string; label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 2 }}>
        {label}
        {required === true && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
        {optional === true && <span style={{ color: "#9CA3AF", fontWeight: 400, marginLeft: 4, fontSize: 11 }}>optional</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, color: "#111827", fontSize: 14, padding: "10px 12px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

function BookingModal({ slot, host, handle, onClose, onSuccess }: { slot: Slot; host: HostInfo; handle: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/booking/${encodeURIComponent(handle)}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotStart: slot.start, slotEnd: slot.end, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null, bookerHandle: form.bookerHandle.trim() || null, message: form.message.trim() || null }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Something went wrong. Please try another slot.");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit. Please try again.");
    } finally { setSubmitting(false); }
  };

  const hostName = host.displayName ?? handle;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.5)", backdropFilter: "blur(10px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }} onClick={onClose} role="dialog" aria-modal={true} aria-label="Book a slot">
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 32px 80px rgba(17,24,39,0.2), 0 0 0 1px rgba(79,70,229,0.1)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Booking with</p>
            <p style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#111827", letterSpacing: -0.4 }}>{hostName}</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} aria-label="Close"><CloseIcon /></button>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "16px 24px 0", padding: "12px 16px", background: "linear-gradient(135deg,#EDE9FE,#E0E7FF)", borderRadius: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={18} height={18} viewBox="0 0 18 18" fill="none"><rect x={1.5} y={3} width={15} height={13.5} rx={3} stroke="#4338CA" strokeWidth={1.5}/><path d="M6 1.5v3M12 1.5v3M1.5 7.5h15" stroke="#4338CA" strokeWidth={1.5} strokeLinecap="round"/></svg>
          </div>
          <div>
            <p style={{ margin: "0 0 1px", fontSize: 15, fontWeight: 700, color: "#4338CA" }}>{formatSlotRange(slot.start, slot.end)}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#6D28D9", fontWeight: 500 }}>{new Date(slot.start).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField id="bk-name" label="Name" required={true}><input id="bk-name" type="text" placeholder="Your full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} autoComplete="name" /></FormField>
            <FormField id="bk-email" label="Email" required={true}><input id="bk-email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} autoComplete="email" /></FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField id="bk-phone" label="Phone" optional={true}><input id="bk-phone" type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={inputStyle} autoComplete="tel" /></FormField>
            <FormField id="bk-handle" label="Toatre handle" optional={true}><input id="bk-handle" type="text" placeholder="yourhandle" value={form.bookerHandle} onChange={(e) => setForm((f) => ({ ...f, bookerHandle: e.target.value }))} style={inputStyle} /></FormField>
          </div>
          <FormField id="bk-msg" label="What is this about?" optional={true}>
            <textarea id="bk-msg" placeholder={"Brief reason for meeting with " + hostName + "..."} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} style={{ ...inputStyle, minHeight: 76, resize: "vertical" }} rows={3} />
          </FormField>
          {error !== null && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px" }}>
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none"><circle cx={7} cy={7} r={6} stroke="#DC2626" strokeWidth={1.5}/><path d="M7 4v3M7 9.5h.01" stroke="#DC2626" strokeWidth={1.5} strokeLinecap="round"/></svg>
              {error}
            </div>
          )}
          <button type="button" onClick={() => { void submit(); }} disabled={submitting} style={{ background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)", border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, padding: "14px", fontFamily: "inherit", boxShadow: "0 8px 20px rgba(79,70,229,0.28)", marginTop: 4, opacity: submitting ? 0.72 : 1, cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting ? "Sending..." : "Send booking request"}
          </button>
          <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF", textAlign: "center" as const, lineHeight: 1.6 }}>Your name, email, and message will be shared with {hostName} to process your booking.</p>
        </div>
      </div>
    </div>
  );
}

function SuccessView({ host, handle, slot, onReset }: { host: HostInfo; handle: string; slot: Slot | null; onReset: () => void }) {
  const hostName = host.displayName ?? handle;
  return (
    <div style={{ textAlign: "center" as const, padding: "40px 24px", background: "#fff", borderRadius: 24, border: "1px solid #E5E7EB", boxShadow: "0 4px 24px rgba(17,24,39,0.07)" }}>
      <div style={{ width: 64, height: 64, borderRadius: 32, background: "linear-gradient(135deg,#059669,#10B981)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <svg width={28} height={28} viewBox="0 0 28 28" fill="none"><path d="M6 14l6 6 10-10" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#111827" }}>Request sent!</h2>
      <p style={{ margin: "0 0 16px", fontSize: 15, color: "#6B7280", lineHeight: 1.6 }}><strong style={{ color: "#111827" }}>{hostName}</strong> will review and you will hear back by email.</p>
      {slot !== null && (
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13, color: "#4338CA", background: "#EDE9FE", borderRadius: 999, padding: "8px 18px", marginBottom: 24 }}>
          <span>📅</span>
          <span>{formatSlotRange(slot.start, slot.end)} · {new Date(slot.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
        </div>
      )}
      <div style={{ marginBottom: 20 }} />
      <button type="button" onClick={onReset} style={{ background: "transparent", border: "1.5px solid #E5E7EB", borderRadius: 12, color: "#374151", fontSize: 14, fontWeight: 600, padding: "10px 24px", cursor: "pointer", fontFamily: "inherit" }}>
        Book another slot
      </button>
      <p style={{ marginTop: 24, fontSize: 12, color: "#9CA3AF" }}>
        Want your own Toat Link? <a href="https://toatre.com/signup" style={{ color: "#4F46E5", fontWeight: 700, textDecoration: "none" }}>Try Toatre free</a>
      </p>
    </div>
  );
}

export default function HandleBookingPage() {
  const params = useParams();
  const handle = typeof params.handle === "string" ? params.handle : "";
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [host, setHost] = useState<HostInfo | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successSlot, setSuccessSlot] = useState<Slot | null>(null);
  const [helpSection, setHelpSection] = useState<HelpSection>(null);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/booking/${encodeURIComponent(handle)}/slots`);
      if (res.status === 404) { setNotFound(true); return; }
      const data = (await res.json()) as { slots: Slot[]; host: HostInfo };
      setHost(data.host); setSlots(data.slots);
    } catch { setNotFound(true); } finally { setLoading(false); }
  }, [handle]);

  useEffect(() => { void loadSlots(); }, [loadSlots]);

  const openBookingModal = (slot: Slot) => { if (slot.blocked) return; setSelectedSlot(slot); setShowBookingModal(true); };
  const handleSuccess = () => { setSuccessSlot(selectedSlot); setShowBookingModal(false); setShowSuccess(true); };
  const reset = () => { setShowSuccess(false); setSelectedSlot(null); void loadSlots(); };

  const slotsByDay = groupSlotsByDay(slots);
  const availableCount = slots.filter((s) => !s.blocked).length;

  const rootStyle: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(180deg, #FFFFFF 0%, #FFF9FF 55%, #F5F3FF 100%)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", color: "#111827" };

  const slotBtnBase: React.CSSProperties = { padding: "10px 4px", background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 10, color: "#166534", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "center" as const, display: "flex", alignItems: "center", justifyContent: "center" };
  const slotBtnBlocked: React.CSSProperties = { ...slotBtnBase, background: "#F9FAFB", border: "1.5px solid #F3F4F6", cursor: "not-allowed", color: "#D1D5DB" };
  const slotBtnSelected: React.CSSProperties = { ...slotBtnBase, background: "linear-gradient(135deg, #4F46E5, #4338CA)", border: "1.5px solid #4F46E5", color: "#fff", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" };

  if (loading) return <div style={rootStyle}><PageNav /><div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}><Spinner /></div></div>;

  if (notFound) return (
    <div style={rootStyle}>
      <PageNav />
      <div style={{ maxWidth: 400, margin: "60px auto 0", padding: "0 24px", textAlign: "center" as const }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#111827" }}>Page not found</h1>
        <p style={{ margin: "0 0 28px", fontSize: 15, color: "#6B7280" }}>This Toat Link does not exist or has not been turned on yet.</p>
        <a href="https://toatre.com" style={{ display: "inline-block", background: "linear-gradient(135deg, #4F46E5, #4338CA)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", padding: "12px 24px", borderRadius: 14, boxShadow: "0 6px 16px rgba(79,70,229,0.22)" }}>What is Toatre?</a>
      </div>
    </div>
  );

  return (
    <div style={rootStyle}>
      <PageNav />
      <HelpModal section={helpSection} onClose={() => setHelpSection(null)} />
      {showBookingModal && selectedSlot !== null && host !== null && (
        <BookingModal slot={selectedSlot} host={host} handle={handle} onClose={() => setShowBookingModal(false)} onSuccess={handleSuccess} />
      )}
      <main style={{ maxWidth: 580, margin: "0 auto", padding: "0 16px 80px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E5E7EB", padding: "20px", boxShadow: "0 2px 12px rgba(17,24,39,0.06)" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
            {host !== null && <Avatar host={host} size={72} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: -0.4 }}>{host?.displayName ?? handle}</h1>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#4F46E5", fontWeight: 600 }}>@{host?.handle ?? handle}</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#4F46E5", background: "#EDE9FE", padding: "4px 10px", borderRadius: 999 }}>
                <svg width={11} height={11} viewBox="0 0 12 12" fill="none"><rect x={1} y={2} width={10} height={9} rx={2} stroke="#4F46E5" strokeWidth={1.4}/><path d="M4 1v2M8 1v2M1 5h10" stroke="#4F46E5" strokeWidth={1.4} strokeLinecap="round"/></svg>
                {availableCount} slot{availableCount !== 1 ? "s" : ""} available
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            {(["what", "how", "privacy"] as NonNullable<HelpSection>[]).map((sec) => (
              <button key={sec} type="button" onClick={() => setHelpSection(sec)} style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 999, padding: "5px 13px", cursor: "pointer", fontFamily: "inherit" }}>
                {sec === "what" ? "What is this?" : sec === "how" ? "How it works" : "Privacy"}
              </button>
            ))}
          </div>
        </div>

        {showSuccess && host !== null ? (
          <SuccessView host={host} handle={handle} slot={successSlot} onReset={reset} />
        ) : (
          <div>
            <h2 style={{ margin: "4px 0 12px", fontSize: 17, fontWeight: 700, color: "#111827" }}>Choose a time</h2>
            {slots.length === 0 ? (
              <div style={{ textAlign: "center" as const, padding: "40px 20px", background: "#fff", borderRadius: 18, border: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: 36 }}>😔</span>
                <p style={{ color: "#6B7280", margin: "12px 0 0", fontSize: 15 }}>No slots available right now. Check back soon.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
                {Array.from(slotsByDay.entries()).map(([day, daySlots]) => (
                  <div key={day} style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: "14px 14px 12px", boxShadow: "0 1px 4px rgba(17,24,39,0.04)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>{formatDay(day)}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(94px, 1fr))", gap: 8 }}>
                      {daySlots.map((slot) => {
                        const isSelected = selectedSlot?.start === slot.start && showBookingModal;
                        const btnStyle = slot.blocked ? slotBtnBlocked : isSelected ? slotBtnSelected : slotBtnBase;
                        return (
                          <button key={slot.start} type="button" disabled={slot.blocked} onClick={() => openBookingModal(slot)} style={btnStyle}>
                            {slot.blocked ? <span style={{ display: "block", width: 28, height: 2, background: "#E5E7EB", borderRadius: 2 }} /> : formatTime(slot.start)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ToatreLogo size={24} />
            <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>toatre - mic-first personal timeline</span>
          </div>
          <a href="https://toatre.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4F46E5", fontWeight: 700, textDecoration: "none" }}>Get your Toat Link</a>
        </div>
      </main>
    </div>
  );
}
