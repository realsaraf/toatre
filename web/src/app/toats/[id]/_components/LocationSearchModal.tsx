import { useEffect, useRef, useState } from "react";

export function LocationSearchModal({
  query,
  suggestions,
  onQueryChange,
  onSelect,
  onClose,
}: {
  query: string;
  suggestions: Array<{ placeId: string; description: string }>;
  onQueryChange: (q: string) => Promise<void>;
  onSelect: (description: string) => void;
  onClose: () => void;
}) {
  const [inputValue, setInputValue] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const handleChange = (val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void onQueryChange(val);
    }, 300);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(17,24,39,0.34)",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 28,
          background: "#FFFFFF",
          boxShadow: "0 28px 80px rgba(31,41,55,0.18)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxHeight: "70vh",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Add location</span>
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
        <input
          type="text"
          autoFocus
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search for a place or address\u2026"
          style={{
            width: "100%",
            border: "1.5px solid rgba(123,92,246,0.3)",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 15,
            color: "#111827",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {suggestions.length > 0 ? (
          <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                onClick={() => onSelect(s.description)}
                style={{
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 14,
                  color: "#111827",
                  cursor: "pointer",
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(123,92,246,0.07)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                📍 {s.description}
              </button>
            ))}
          </div>
        ) : inputValue.trim() ? (
          <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center" }}>
            No results. Try a different search.
          </p>
        ) : null}
      </div>
    </div>
  );
}
