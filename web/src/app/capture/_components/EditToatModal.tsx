"use client";

import { useEffect, useRef, useState } from "react";
import type { SerializedToat, Enrichments } from "@/types";
import { getToatVisual } from "@/components/toat-visual";

type PlaceSuggestion = { placeId: string; description: string };

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
  const [locationSuggestions, setLocationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [locationSearchState, setLocationSearchState] = useState<"idle" | "loading" | "error">("idle");
  const [notes, setNotes] = useState(toat.notes ?? "");
  const locationSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initIso = toat.enrichments?.time?.at ?? toat.enrichments?.time?.startAt ?? null;
  const [datetime, setDatetime] = useState(() => {
    if (!initIso) return "";
    const d = new Date(initIso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  useEffect(
    () => () => {
      if (locationSearchTimerRef.current) clearTimeout(locationSearchTimerRef.current);
    },
    [],
  );

  const searchLocations = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setLocationSuggestions([]);
      setLocationSearchState("idle");
      return;
    }

    setLocationSearchState("loading");
    try {
      const response = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) throw new Error(`${response.status}`);
      const data = (await response.json()) as { predictions?: Array<{ place_id: string; description: string }> };
      setLocationSuggestions((data.predictions ?? []).map((place) => ({ placeId: place.place_id, description: place.description })));
      setLocationSearchState("idle");
    } catch {
      setLocationSuggestions([]);
      setLocationSearchState("error");
    }
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (locationSearchTimerRef.current) clearTimeout(locationSearchTimerRef.current);
    locationSearchTimerRef.current = setTimeout(() => {
      void searchLocations(value);
    }, 250);
  };

  const handleSave = () => {
    const timeIso = datetime ? new Date(datetime).toISOString() : null;
    const loc = location.trim() || null;
    const updatedEnrichments: Enrichments = {
      ...toat.enrichments,
      ...(timeIso ? { time: { ...toat.enrichments?.time, at: timeIso } } : {}),
    };
    if (loc) updatedEnrichments.place = { ...toat.enrichments?.place, address: loc };
    else delete updatedEnrichments.place;
    onSave({ title: title.trim() || toat.title, notes: notes.trim() || null, enrichments: updatedEnrichments });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(17, 24, 39, 0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 430, background: "var(--color-card)", borderRadius: 22, padding: 20, boxShadow: "0 28px 80px rgba(17, 24, 39, 0.24)", maxHeight: "min(86vh, 680px)", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: meta.chipBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16 }}>{meta.emoji}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 740, color: "var(--color-text)" }}>{toat.title}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-muted)", lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>TITLE</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--color-border)", fontSize: 13, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>DATE &amp; TIME <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--color-border)", fontSize: 13, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>LOCATION <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input value={location} onChange={(e) => handleLocationChange(e.target.value)} placeholder="Search for a place or address" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--color-border)", fontSize: 13, background: "var(--color-bg)", color: "var(--color-text)", outline: "none" }} />
            {locationSuggestions.length > 0 ? (
              <div style={{ marginTop: 6, border: "1px solid var(--color-border)", borderRadius: 10, background: "#fff", overflow: "hidden", boxShadow: "0 12px 28px rgba(17, 24, 39, 0.08)" }}>
                {locationSuggestions.map((suggestion) => (
                  <button key={suggestion.placeId} type="button" onClick={() => { setLocation(suggestion.description); setLocationSuggestions([]); setLocationSearchState("idle"); }} style={{ width: "100%", border: 0, background: "transparent", padding: "9px 11px", textAlign: "left", color: "var(--color-text)", fontSize: 12, lineHeight: 1.35, cursor: "pointer" }}>
                    {suggestion.description}
                  </button>
                ))}
              </div>
            ) : locationSearchState === "loading" ? (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>Searching places...</p>
            ) : locationSearchState === "error" ? (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#B91C1C" }}>Place search is unavailable right now.</p>
            ) : null}
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>NOTES <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--color-border)", fontSize: 13, background: "var(--color-bg)", color: "var(--color-text)", outline: "none", resize: "vertical" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid var(--color-border)", background: "none", fontSize: 13, fontWeight: 650, color: "var(--color-text-muted)", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 2, padding: "11px", borderRadius: 12, background: "linear-gradient(135deg, #8B5CF6, #6366F1)", border: "none", color: "#fff", fontSize: 13, fontWeight: 740, cursor: "pointer" }}>Save changes</button>
        </div>
      </div>
    </div>
  );
}
