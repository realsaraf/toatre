"use client";

import { useState, useRef } from "react";
import type { SerializedToat } from "@/types";
import { LegendDot, WaveIcon } from "./CaptureIcons";
import { HighlightedTranscript } from "./HighlightedTranscript";
import { ReviewToatCard } from "./ReviewToatCard";
import { EditToatModal } from "./EditToatModal";
import { LearnMoreModal } from "./LearnMoreModal";

interface ReviewScreenProps {
  transcript: string;
  toats: SerializedToat[];
  selected: boolean[];
  onToggle: (i: number) => void;
  onToggleAll: () => void;
  onUpdateToat: (i: number, updated: Partial<SerializedToat>) => void;
  onReorder: (from: number, to: number) => void;
  onAddToTimeline: () => void;
  onCancel: () => void;
  selectedCount: number;
  isCommitting: boolean;
}

export function ReviewScreen({
  transcript, toats, selected, onToggle, onToggleAll,
  onUpdateToat, onReorder, onAddToTimeline, onCancel,
  selectedCount, isCommitting,
}: ReviewScreenProps) {
  const allSelected = selected.every(Boolean);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const dragIndexRef = useRef<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>Captured</p>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </p>
      </div>

      <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, padding: "18px 20px", marginBottom: 18, boxShadow: "0 2px 12px rgba(99,102,241,0.06)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 22, color: "#6366F1" }}>✦</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>Got these from what you said</p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Review and make any changes before adding.</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
          <WaveIcon />
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text)", flex: 1 }}>
            <HighlightedTranscript text={transcript} />
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
          <LegendDot color="#8B5CF6" label="Time" />
          <LegendDot color="#2563EB" label="People" />
          <LegendDot color="#16A34A" label="Places" />
          <LegendDot color="#D97706" label="Others" />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>{toats.length} toat{toats.length !== 1 ? "s" : ""} found</span>
        <button onClick={onToggleAll} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--color-primary)", padding: 0 }}>
          {allSelected ? "All selected" : "Select all"}
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: allSelected ? "#6366F1" : "#E0E0E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {allSelected && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
          </span>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {toats.map((toat, i) => (
          <div
            key={toat.id || i}
            draggable
            onDragStart={() => { dragIndexRef.current = i; }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => {
              const from = dragIndexRef.current;
              if (from !== null && from !== i) onReorder(from, i);
              dragIndexRef.current = null;
            }}
          >
            <ReviewToatCard
              toat={toat}
              checked={selected[i]!}
              onToggle={() => onToggle(i)}
              onEdit={() => setEditIndex(i)}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 14, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 24 }}>
        <span style={{ fontSize: 16 }}>✦</span>
        <p style={{ lineHeight: 1.5, flex: 1, margin: 0 }}>Toatre can set reminders, check traffic, and add location details for you.</p>
        <button onClick={() => setShowLearnMore(true)} style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>Learn more →</button>
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "var(--color-bg)", paddingBottom: 24, paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button onClick={onCancel} style={{ background: "none", border: "1px solid var(--color-border)", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", cursor: "pointer" }}>
          Cancel
        </button>
        <button
          onClick={onAddToTimeline}
          disabled={selectedCount === 0 || isCommitting}
          style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2, padding: "12px 28px", background: "linear-gradient(135deg, #8B5CF6, #6366F1)", borderRadius: 16, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.35)", opacity: selectedCount === 0 || isCommitting ? 0.5 : 1, transition: "opacity 0.2s" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isCommitting ? <span>Saving…</span> : <><span>✓</span> Add to timeline</>}
          </div>
          {!isCommitting && <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>{selectedCount} toat{selectedCount !== 1 ? "s" : ""} will be added</span>}
        </button>
      </div>

      {editIndex !== null && (
        <EditToatModal
          toat={toats[editIndex]!}
          onSave={(updated) => { onUpdateToat(editIndex, updated); setEditIndex(null); }}
          onClose={() => setEditIndex(null)}
        />
      )}

      {showLearnMore && <LearnMoreModal onClose={() => setShowLearnMore(false)} />}
    </div>
  );
}
