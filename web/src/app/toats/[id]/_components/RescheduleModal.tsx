export function RescheduleModal({
  value,
  onChange,
  busy,
  onConfirm,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
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
          maxWidth: 480,
          borderRadius: 28,
          background: "#FFFFFF",
          boxShadow: "0 28px 80px rgba(31,41,55,0.18)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Reschedule</span>
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
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: 42,
              border: "1.5px solid rgba(123,92,246,0.2)",
              borderRadius: 14,
              background: "transparent",
              color: "#6D28D9",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !value}
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
            {busy ? "Saving\u2026" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
