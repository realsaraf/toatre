"use client";

import type { SerializedLink } from "@/types/documents";
import { sectionCardStyles } from "../_styles";
import { SectionCard } from "./SectionCard";

const LinkIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export function LinksSection({
  links,
  onRemove,
  accent,
}: {
  links: SerializedLink[];
  onRemove: (linkId: string) => void;
  accent?: string;
}) {
  if (!links.length) return null;

  const tint = accent ?? "#7C3AED";

  return (
    <SectionCard title="Links">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map((link) => (
          <div
            key={link.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 14,
              background: "rgba(124,58,237,0.06)",
              border: "1px solid rgba(124,58,237,0.12)",
            }}
          >
            {/* Link icon */}
            <span style={{ color: tint, flexShrink: 0, display: "flex" }}>
              <LinkIcon size={16} />
            </span>

            {/* Clickable label */}
            <button
              type="button"
              onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
              style={{
                flex: 1,
                textAlign: "left",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#111827",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={link.url}
            >
              {link.label}
            </button>

            {/* Remove */}
            <button
              type="button"
              onClick={() => onRemove(link.id)}
              style={{
                ...sectionCardStyles.inlineGhost,
                padding: "0 8px",
                minHeight: 24,
                fontSize: 12,
                color: "#DC2626",
                background: "rgba(220,38,38,0.08)",
                border: "1px solid rgba(220,38,38,0.15)",
                flexShrink: 0,
                cursor: "pointer",
              }}
              aria-label={`Remove link ${link.label}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
