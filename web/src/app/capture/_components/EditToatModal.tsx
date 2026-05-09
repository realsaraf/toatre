"use client";

import { useState } from "react";
import type { SerializedToat, Enrichments } from "@/types";
import { getToatVisual } from "@/components/toat-visual";

export function EditToatModal({
  toat,
  onSave,
  onClose,
}: {
  toat: SerializedToat;
  onSave: (updated: Partial<SerializedToat>) => void;
  onClose: () => void;
}) {
  const meta = getToatVisual(toat.title, toat.enrichments ?? undefined);
  const [title, setTitle] = useState(toat.title);
  const initLoc =
    toat.enrichments?.place?.address ??
    toat.enrichments?.place?.placeName ??
    toat.enrichments?.event?.venueName ??
    "";
  const [location, setLocation] = useState(initLoc);
  const [notes, setNotes] = useState(toat.notes ?? "");
  const initIso = toat.enrichments?.time?.at ?? toat.enrichments?.time?.startAt ?? null;
  const [datetime, setDatetime] = useState(() => {
    if (!initIso) return "";
    const d = new Date(initIso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const handleSave = () => {
    const timeIso = datetime ? new Date(datetime).toISOString() : null;
    const loc = location.trim() || null;
    const updatedEnrichments: Enrichments = {
      ...toat.enrichments,
      ...(timeIso ? { time: { ...toat.enrichments?.time, at: timeIso } } : {}),
      ...(loc ? { place: { ...toat.enrichments?.place, address: loc } } : {}),
    };
    onSave({ title: title.trim() || toat.title, notes: notes.trim() || null, enrichments: updatedEnrichments });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 560, background: "var(--color-card)", borderRadius: "24px 24px 0 0", padding: "24px 24px 40px", boxShadow: "0 -8px 48px rgba(0,0,0,0.18)", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.chipBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18 }}>{meta.emoji}</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{toat.title}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-muted)", lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>TITLE</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 15, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>DATE &amp; TIME <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>LOCATION <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Citi Field, New York" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>NOTES <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text)", outline: "none", resize: "vertical" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1.5px solid var(--color-border)", background: "none", fontSize: 15, fontWeight: 600, color: "var(--color-text-muted)", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 2, padding: "14px", borderRadius: 14, background: "linear-gradient(135deg, #8B5CF6, #6366F1)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Save changes</button>
        </div>
      </div>
    </div>
  );
}
