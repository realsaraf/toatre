import type { ToatLink, ToatAttachment } from "@/types/documents";
import { s } from "./_styles";

interface ShareContentProps {
  visualEmoji: string;
  visualLabel: string;
  tier: string;
  title: string;
  subtitle: string | null;
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
  visualEmoji,
  visualLabel,
  tier,
  title,
  subtitle,
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
  return (
    <section className="share-card" style={s.card}>
      {/* ── Card header: badges, emoji, title, subtitle ── */}
      <div style={s.cardHeader}>
        <div style={s.cardBadgeRow}>
          <span style={s.cardBadge}>{visualLabel}</span>
          {tier === "urgent" && (
            <span style={{ ...s.cardBadge, ...s.cardBadgeUrgent }}>🔥 Urgent</span>
          )}
          {tier === "important" && (
            <span style={{ ...s.cardBadge, ...s.cardBadgeImportant }}>⭐ Important</span>
          )}
        </div>
        <div style={s.cardEmoji} role="img" aria-label={visualLabel}>{visualEmoji}</div>
        <h1 style={s.cardTitle}>{title}</h1>
        {subtitle && <p style={s.cardSubtitle}>{subtitle}</p>}
      </div>
      <div className="share-card-divider" style={s.cardDivider} aria-hidden />

      {/* ── When ── */}
      {startDate && <DetailRow icon="📅" text={formatDateRange(startDate, endDate)} />}

      {/* ── Where — address + static map ── */}
      {location && (
        <>
          <DetailRow icon="📍" text={location} />
          <div style={{ padding: "0 0 4px" }}>
            <div className="share-map-wrap" style={s.mapWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/places/staticmap?q=${encodeURIComponent(location)}`}
                alt={`Map of ${location}`}
                style={s.mapImg}
                loading="lazy"
              />
              <a
                href={mapsUrl ?? `https://maps.google.com/?q=${encodeURIComponent(location)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={s.mapOpenLink}
              >
                Open in Maps ↗
              </a>
            </div>
          </div>
        </>
      )}

      {/* ── Note ── */}
      {notes && (
        <div className="share-section" style={s.section}>
          <div className="share-notes" style={s.notes}>
            <p style={{ margin: 0, fontSize: 14.5, color: "#374151", lineHeight: 1.75 }}>{notes}</p>
          </div>
        </div>
      )}

      {/* ── Links ── */}
      {links.length > 0 && (
        <div className="share-section" style={s.section}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {links.map((link) => {
              const hasOg = link.ogTitle ?? link.ogDescription ?? link.ogImage;
              if (hasOg) {
                const hostname = safeHostname(link.url);
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="share-link-card" style={s.ogCard}>
                    {link.ogImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={link.ogImage} alt="" style={s.ogThumb} />
                    ) : (
                      <div style={{ ...s.ogThumb, background: "rgba(190,119,22,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🔗</div>
                    )}
                    <div style={s.ogBody}>
                      {link.ogTitle ? <span style={s.ogTitle}>{link.ogTitle}</span> : null}
                      {hostname ? <span style={s.ogHost}>{hostname}</span> : null}
                    </div>
                    <span style={s.ogArrow}>›</span>
                  </a>
                );
              }
              return (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="share-link-card" style={s.linkRow}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>🔗</span>
                  <span style={s.linkLabel}>{link.label}</span>
                  <span style={s.linkArrow}>›</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Attachments ── */}
      {attachments.length > 0 && (
        <div className="share-section" style={s.section}>
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
                <div key={att.id} className="share-attachment-card" style={s.attCard}>
                  {isImage && (
                    <a href={viewUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${att.label} full size`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={viewUrl} alt={att.label} style={s.attThumb} />
                    </a>
                  )}
                  <div style={s.attRow}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{isImage ? "🖼️" : "📄"}</span>
                    <span style={s.attLabel}>{att.label}</span>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {isImage && (
                        <a href={viewUrl} target="_blank" rel="noopener noreferrer" style={s.attBtn}>View</a>
                      )}
                      <a href={dlUrl} download style={{ ...s.attBtn, ...s.attBtnSave }}>↓ Save</a>
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

function DetailRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="share-detail-row" style={s.detailRow}>
      <span style={s.detailIcon} aria-hidden>{icon}</span>
      <span style={s.detailText}>{text}</span>
    </div>
  );
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function formatDateRange(start: Date, end: Date | null): string {
  const datePart = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timePart = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  if (!end) return `${datePart}  ·  ${timePart}`;
  const endTimePart = end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${datePart}  ·  ${timePart} — ${endTimePart}`;
}
