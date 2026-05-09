"use client";

const FEATURES = [
  { icon: "⏰", title: "Smart Reminders", desc: "Toatre calculates travel time and Pings you early enough to leave." },
  { icon: "🗺️", title: "Live Traffic", desc: "Before you head out, Toatre checks real-time traffic to your location." },
  { icon: "📍", title: "Auto Location", desc: "Drop a name like 'dentist' — Toatre looks up the address for you." },
  { icon: "👥", title: "People Memory", desc: "Toatre remembers people you mention so future captures are faster." },
  { icon: "🔁", title: "Smart Follow-ups", desc: "After a call or meeting, Toatre can surface follow-up toats automatically." },
  { icon: "📅", title: "Calendar Sync", desc: "Toatre keeps your timeline in sync with Google Calendar or Apple Calendar." },
];

export function LearnMoreModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 480, background: "var(--color-card)", borderRadius: 24, padding: "28px 24px", boxShadow: "0 16px 64px rgba(0,0,0,0.22)", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>What Toatre can do for you</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "4px 0 0" }}>Your personal timeline assistant, always working.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-muted)", padding: 4 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{f.title}</p>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "3px 0 0", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop: 24, width: "100%", padding: 14, borderRadius: 14, background: "linear-gradient(135deg, #8B5CF6, #6366F1)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Got it</button>
      </div>
    </div>
  );
}
