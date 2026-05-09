"use client";

import type { SerializedToat } from "@/types";
import { getToatVisual } from "@/components/toat-visual";

export function ReviewToatCard({
  toat,
  checked,
  onToggle,
  onEdit,
}: {
  toat: SerializedToat;
  checked: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const meta = getToatVisual(toat.title, toat.enrichments ?? undefined);
  const timeStr = (() => {
    const t = toat.enrichments?.time;
    const iso = t?.at ?? t?.startAt ?? null;
    if (!iso) return null;
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
      ", " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  })();
  const loc =
    toat.enrichments?.place?.address ??
    toat.enrichments?.place?.placeName ??
    toat.enrichments?.event?.venueName ??
    null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "14px 16px", opacity: checked ? 1 : 0.55, transition: "opacity 0.2s" }}>
      <button onClick={onToggle} style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${checked ? "#6366F1" : "#D1D5DB"}`, background: checked ? "#6366F1" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} aria-label={checked ? "Deselect" : "Select"}>
        {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
      </button>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.chipBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 20 }}>{meta.emoji}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", marginBottom: 4, margin: 0 }}>{toat.title}</p>
        {timeStr && <p style={{ fontSize: 12, color: meta.chipColor, margin: "4px 0 0" }}>📅 {timeStr}</p>}
        {loc && <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>📍 {loc}</p>}
      </div>
      <button onClick={onEdit} style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 10, padding: "5px 14px", fontSize: 13, color: "#374151", cursor: "pointer", flexShrink: 0 }}>Edit</button>
      <span style={{ fontSize: 16, color: "#D1D5DB", cursor: "grab" }} aria-hidden>⠿</span>
    </div>
  );
}
