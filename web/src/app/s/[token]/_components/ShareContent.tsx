import type { ToatLink, ToatAttachment } from "@/types/documents";
import { s } from "./_styles";

interface ShareContentProps {
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  mapsUrl: string | null;
  people: string[];
  notes: string | null;
  links: ToatLink[];
  attachments: ToatAttachment[];
  proxyBase: string;
}

export function ShareContent({
  startDate,
  endDate,
  location,
  mapsUrl,
  people,
  notes,
  links,
  attachments,
  proxyBase,
}: ShareContentProps) {
  const hasDetails = startDate || location || people.length > 0 || notes;
  const hasContent = hasDetails || links.length > 0 || attachments.length > 0;

  if (!hasContent) return null;

  return (
    <section style={s.card}>
      {/* Details */}
      {startDate && (
        <DetailRow icon="📅" text={formatDateRange(startDate, endDate)} />
      )}
      {location && (
        <DetailRow
          icon="📍"
          text={location}
          href={mapsUrl ?? undefined}
          hrefLabel="Open in Maps"
        />
      )}
      {people.length > 0 && <DetailRow icon="👥" text={people.join("  ·  ")} />}
      {notes && (
        <div style={s.notes}>
          <p style={{ margin: 0, fontSize: 14.5, color: "#374151", lineHeight: 1.75 }}>
            {notes}
          </p>
        </div>
      )}

      {/* Links */}
      {links.length > 0 && (
        <div style={s.section}>
          <p style={s.sectionLabel}>Links</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={s.linkRow}
              >
                <span style={{ fontSize: 15, flexShrink: 0 }}>🔗</span>
                <span style={s.linkLabel}>{link.label}</span>
                <span style={s.linkArrow}>↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div style={s.section}>
          <p style={s.sectionLabel}>
            Attachments
            <span style={{ fontWeight: 400, opacity: 0.55 }}> ({attachments.length})</span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {attachments.map((att) => {
              const isImage = att.mimeType.startsWith("image/");
              const viewUrl = `${proxyBase}/${att.id}`;
              const dlUrl = `${proxyBase}/${att.id}?download=1`;
              return (
                <div key={att.id} style={s.attCard}>
                  {isImage && (
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${att.label} full size`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={viewUrl} alt={att.label} style={s.attThumb} />
                    </a>
                  )}
                  <div style={s.attRow}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>
                      {isImage ? "🖼️" : "📄"}
                    </span>
                    <span style={s.attLabel}>{att.label}</span>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {isImage && (
                        <a
                          href={viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={s.attBtn}
                        >
                          View
                        </a>
                      )}
                      <a
                        href={dlUrl}
                        download
                        style={{ ...s.attBtn, ...s.attBtnSave }}
                      >
                        ↓ Save
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function DetailRow({
  icon,
  text,
  href,
  hrefLabel,
}: {
  icon: string;
  text: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div style={s.detailRow}>
      <span style={s.detailIcon} aria-hidden>
        {icon}
      </span>
      <span style={s.detailText}>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "inherit",
              textDecoration: "underline",
              textDecorationColor: "rgba(0,0,0,0.18)",
            }}
          >
            {text}
          </a>
        ) : (
          text
        )}
      </span>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={s.detailAction}
          aria-label={hrefLabel ?? "Open"}
        >
          ↗
        </a>
      )}
    </div>
  );
}

export function formatDateRange(start: Date, end: Date | null): string {
  const datePart = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timePart = start.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  if (!end) return `${datePart}  ·  ${timePart}`;
  const endTimePart = end.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}  ·  ${timePart} — ${endTimePart}`;
}
