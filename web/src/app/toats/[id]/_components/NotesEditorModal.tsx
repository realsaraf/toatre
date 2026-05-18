"use client";

import { MarkdownNoteEditor } from "@/components/MarkdownNoteEditor";

interface NotesEditorModalProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  busy?: boolean;
}

export function NotesEditorModal({
  value,
  onChange,
  onSave,
  onClose,
  busy = false,
}: NotesEditorModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(17,24,39,0.34)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(100%, 720px)",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: 28,
          background: "#FFFFFF",
          boxShadow: "0 28px 80px rgba(31,41,55,0.18)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#111827" }}>
              Edit notes
            </h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#6B7280" }}>
              Keep it plain if you want. Use the formatting buttons only when you want Markdown.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#6B7280",
            }}
          >
            ✕
          </button>
        </div>

        <MarkdownNoteEditor
          value={value}
          onChange={onChange}
          onBlur={() => undefined}
          placeholder="Add a note..."
          rows={8}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              minHeight: 42,
              border: "1.5px solid rgba(123,92,246,0.2)",
              borderRadius: 14,
              background: "transparent",
              color: "#6D28D9",
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? "default" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            style={{
              minHeight: 42,
              border: "none",
              borderRadius: 14,
              background: busy ? "#C4B5FD" : "linear-gradient(135deg, #7C3AED, #5B3DF5)",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Saving..." : "Save notes"}
          </button>
        </div>
      </div>
    </div>
  );
}