"use client";

import { useState } from "react";

export function AddLinkModal({
  onSave,
  onClose,
  busy,
}: {
  onSave: (url: string, label: string) => void;
  onClose: () => void;
  busy?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  const trimmedUrl = url.trim();
  const isValid = trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.32)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 24,
          padding: 24,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#111827" }}>
          Add link
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6B7280" }}>
          Attach any URL — tickets, docs, maps, articles, anything useful.
        </p>

        <input
          type="url"
          autoFocus
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1.5px solid rgba(123,92,246,0.25)",
            fontSize: 14,
            color: "#111827",
            outline: "none",
            marginBottom: 10,
          }}
        />

        <input
          type="text"
          placeholder="Label (optional — e.g. Tickets, Docs)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={80}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1.5px solid rgba(0,0,0,0.1)",
            fontSize: 14,
            color: "#111827",
            outline: "none",
            marginBottom: 16,
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 14,
              border: "1.5px solid rgba(0,0,0,0.1)",
              background: "transparent",
              fontSize: 14,
              fontWeight: 700,
              color: "#6B7280",
              cursor: busy ? "default" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isValid || busy}
            onClick={() => {
              if (isValid && !busy) onSave(trimmedUrl, label.trim());
            }}
            style={{
              flex: 2,
              padding: "12px 0",
              borderRadius: 14,
              border: "none",
              background:
                isValid && !busy
                  ? "linear-gradient(135deg, #7C3AED, #5B3DF5)"
                  : "rgba(0,0,0,0.08)",
              fontSize: 14,
              fontWeight: 700,
              color: isValid && !busy ? "#FFFFFF" : "#9CA3AF",
              cursor: isValid && !busy ? "pointer" : "default",
            }}
          >
            Save link
          </button>
        </div>
      </div>
    </div>
  );
}
