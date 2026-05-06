import { useState } from "react";
import { LocationIcon, SteeringWheelIcon } from "@/components/mobile-ui";

export function LocationBlock({
  location,
  mapsUrl,
  gradient,
  accent,
  onChangeLocation,
  onRemoveLocation,
}: {
  location: string;
  mapsUrl: string;
  gradient: string;
  accent: string;
  onChangeLocation: () => void;
  onRemoveLocation: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    void navigator.clipboard.writeText(location).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 14,
          background: "rgba(123,92,246,0.05)",
          border: "1.5px solid rgba(123,92,246,0.15)",
        }}
      >
        <span style={{ color: accent, flexShrink: 0, paddingTop: 2, lineHeight: 1 }}>
          <LocationIcon size={16} />
        </span>
        <span style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{location}</span>
        <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
          <button
            type="button"
            onClick={copyAddress}
            title="Copy address"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: 6,
              color: copied ? "#16A34A" : "#9CA3AF",
              display: "flex",
              alignItems: "center",
            }}
          >
            {copied ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={onChangeLocation}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "#7C3AED",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 6,
            }}
          >
            Change
          </button>
          <button
            type="button"
            onClick={onRemoveLocation}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "#9CA3AF",
              fontWeight: 400,
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: 180,
          borderRadius: 20,
          overflow: "hidden",
          background: "#F3F4F6",
          border: "1px solid rgba(229,231,235,0.8)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/places/staticmap?q=${encodeURIComponent(location)}`}
          alt={location}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="lazy"
        />
        <button
          type="button"
          onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            background: "rgba(255,255,255,0.92)",
            border: "none",
            borderRadius: 10,
            padding: "5px 10px",
            fontSize: 12,
            fontWeight: 600,
            color: "#374151",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6D28D9"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          Open in Maps
        </button>
      </div>

      <button
        type="button"
        onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
        style={{
          minHeight: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          border: "none",
          borderRadius: 16,
          background: gradient,
          color: "#FFFFFF",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          width: "100%",
        }}
      >
        <SteeringWheelIcon size={18} /> Directions
      </button>
    </div>
  );
}
