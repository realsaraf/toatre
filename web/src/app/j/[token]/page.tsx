/**
 * /j/[token] — Public shared toat card.
 *
 * Server-rendered. No auth required.
 * Security gate: the share token must resolve to a valid ACL entry.
 */
import type { CSSProperties } from "react";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongo/collections";
import { migrateTemplateData, type Enrichments } from "@/types";
import { TOAT_VISUAL, resolveVisualKey } from "@/components/toat-visual";
import { ToatreMark } from "@/components/ToatreMark";
import { OpenInAppHandoff } from "./OpenInAppHandoff";
import type { ToatAttachment, ToatLink } from "@/types/documents";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedToatPage({ params }: PageProps) {
  const { token } = await params;
  const { acl, toats, users } = await getCollections();

  const share = await acl.findOne({ token });
  const toatId = share?.toatId instanceof ObjectId ? share.toatId : null;
  const toat = toatId ? await toats.findOne({ _id: toatId }) : null;

  if (!share || !toat) {
    return <NotFoundCard />;
  }

  // Owner name — best-effort, shown in hero subtitle
  const ownerId =
    share.ownerId instanceof ObjectId
      ? share.ownerId
      : ObjectId.isValid(String(share.ownerId))
        ? new ObjectId(String(share.ownerId))
        : null;
  const owner = ownerId ? await users.findOne({ _id: ownerId }) : null;
  const ownerName =
    (typeof owner?.displayName === "string" && owner.displayName) ||
    (typeof owner?.email === "string" && owner.email.split("@")[0]) ||
    "Someone";

  const enrichments: Enrichments = toat.enrichments ?? migrateTemplateData(toat);
  const title = typeof toat.title === "string" ? toat.title : "Untitled toat";
  const tier = typeof toat.tier === "string" ? toat.tier : "regular";
  const notes = typeof toat.notes === "string" && toat.notes ? toat.notes : null;
  const links: ToatLink[] = Array.isArray(toat.links) ? toat.links : [];
  const attachments: ToatAttachment[] = Array.isArray(toat.attachments)
    ? toat.attachments
    : [];

  // Visual
  const visualKey = resolveVisualKey(title, enrichments);
  const visual = TOAT_VISUAL[visualKey] ?? TOAT_VISUAL.task;

  // Time
  const startDate = parseDate(
    enrichments.time?.at ?? enrichments.time?.startAt ?? enrichments.time?.dueAt,
  );
  const endDate = parseDate(enrichments.time?.endAt);

  // Location
  const location =
    (typeof enrichments.place?.address === "string" && enrichments.place.address) ||
    (typeof enrichments.place?.placeName === "string" && enrichments.place.placeName) ||
    (typeof enrichments.event?.address === "string" && enrichments.event.address) ||
    (typeof enrichments.event?.venueName === "string" && enrichments.event.venueName) ||
    null;
  const mapsUrl = location
    ? `https://maps.google.com/?q=${encodeURIComponent(location)}`
    : null;

  const people: string[] = Array.isArray(enrichments.people) ? enrichments.people : [];
  const proxyBase = `/api/share/${encodeURIComponent(token)}/attachments`;

  return (
    <main style={s.page}>
      {/* Coloured background halos */}
      <div
        aria-hidden
        style={{
          ...s.halo,
          background: visual.tint,
          top: -160,
          left: -140,
          width: 480,
          height: 480,
        }}
      />
      <div
        aria-hidden
        style={{
          ...s.halo,
          background: visual.tint,
          bottom: -180,
          right: -120,
          width: 380,
          height: 380,
        }}
      />

      <article style={s.card} aria-label={`Shared toat: ${title}`}>
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <header style={{ ...s.hero, background: visual.gradient }}>
          <span style={s.heroEmoji} role="img" aria-label={visual.label}>
            {visual.emoji}
          </span>

          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            <span style={s.heroChip}>{visual.label}</span>
            {tier === "urgent" && (
              <span style={{ ...s.heroChip, background: "rgba(254,202,202,0.28)", color: "#FEE2E2" }}>
                Urgent
              </span>
            )}
            {tier === "important" && (
              <span style={{ ...s.heroChip, background: "rgba(253,230,138,0.28)", color: "#FEF3C7" }}>
                Important
              </span>
            )}
          </div>

          <h1 style={s.heroTitle}>{title}</h1>
          <p style={s.heroSub}>Shared by {ownerName}</p>
        </header>

        {/* ── Details body ──────────────────────────────────────────────────── */}
        <div style={s.body}>
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
          {people.length > 0 && (
            <DetailRow icon="👥" text={people.join("  ·  ")} />
          )}
          {notes && (
            <div style={s.notes}>
              <p style={{ margin: 0, fontSize: 14.5, color: "#374151", lineHeight: 1.7 }}>
                {notes}
              </p>
            </div>
          )}

          {/* ── Links ──────────────────────────────────────────────────────── */}
          {links.length > 0 && (
            <section aria-label="Links" style={s.section}>
              <SectionLabel>Links</SectionLabel>
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
            </section>
          )}

          {/* ── Attachments ────────────────────────────────────────────────── */}
          {attachments.length > 0 && (
            <section aria-label="Attachments" style={s.section}>
              <SectionLabel>
                Attachments{" "}
                <span style={{ fontWeight: 400, opacity: 0.6 }}>
                  ({attachments.length})
                </span>
              </SectionLabel>
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
                            style={{ ...s.attBtn, ...s.attBtnAccent }}
                          >
                            ↓ Save
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── CTA ────────────────────────────────────────────────────────── */}
          <div style={s.ctaWrap}>
            <OpenInAppHandoff token={token} gradient={visual.gradient} />
          </div>
        </div>

        {/* ── Footer wordmark ────────────────────────────────────────────── */}
        <footer style={s.footer}>
          <a
            href="https://toatre.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="toatre.com"
            style={{ display: "inline-flex", textDecoration: "none" }}
          >
            <ToatreMark width={60} />
          </a>
        </footer>
      </article>
    </main>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

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
            style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.18)" }}
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
          aria-label={hrefLabel ?? "Open link"}
        >
          ↗
        </a>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={s.sectionLabel}>{children}</p>;
}

function NotFoundCard() {
  return (
    <main style={s.page}>
      <article style={s.card}>
        <div style={s.body}>
          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 800, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Shared toat
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.01em" }}>
            Link not available.
          </h1>
          <p style={{ margin: 0, color: "#6B7280", fontSize: 15 }}>
            Ask the sender to share the toat again.
          </p>
        </div>
        <footer style={s.footer}>
          <ToatreMark width={60} />
        </footer>
      </article>
    </main>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateRange(start: Date, end: Date | null): string {
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

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px 56px",
    background: "#F8FAFC",
    position: "relative",
    overflow: "hidden",
  },
  halo: {
    position: "absolute",
    borderRadius: "50%",
    opacity: 0.07,
    filter: "blur(88px)",
    pointerEvents: "none",
    zIndex: 0,
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "min(100%, 500px)",
    borderRadius: 26,
    background: "#FFFFFF",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.02), 0 12px 40px rgba(0,0,0,0.07), 0 48px 100px rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  hero: {
    padding: "30px 24px 26px",
  },
  heroEmoji: {
    display: "block",
    fontSize: 54,
    lineHeight: 1,
    marginBottom: 18,
  },
  heroChip: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    background: "rgba(255,255,255,0.22)",
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.03em",
  },
  heroTitle: {
    margin: "0 0 10px",
    fontSize: 26,
    fontWeight: 800,
    color: "#FFFFFF",
    lineHeight: 1.2,
    letterSpacing: "-0.01em",
  },
  heroSub: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.68)",
    fontWeight: 500,
  },
  body: {
    padding: "20px 22px 24px",
  },
  detailRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "9px 0",
    borderBottom: "1px solid rgba(0,0,0,0.045)",
  },
  detailIcon: {
    fontSize: 16,
    lineHeight: "22px",
    flexShrink: 0,
  },
  detailText: {
    flex: 1,
    fontSize: 14.5,
    color: "#374151",
    lineHeight: 1.5,
    minWidth: 0,
  },
  detailAction: {
    flexShrink: 0,
    fontSize: 13,
    color: "#9CA3AF",
    textDecoration: "none",
    lineHeight: "22px",
    padding: "0 2px",
  },
  notes: {
    marginTop: 14,
    padding: "14px 16px",
    borderRadius: 14,
    background: "#F9FAFB",
    border: "1px solid rgba(0,0,0,0.06)",
  },
  section: {
    marginTop: 22,
  },
  sectionLabel: {
    margin: "0 0 10px",
    fontSize: 11,
    fontWeight: 700,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  linkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.07)",
    background: "#FAFAFA",
    textDecoration: "none",
    color: "#111827",
  },
  linkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  linkArrow: {
    fontSize: 13,
    color: "#9CA3AF",
    flexShrink: 0,
  },
  attCard: {
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.07)",
    overflow: "hidden",
    background: "#FAFAFA",
  },
  attThumb: {
    width: "100%",
    maxHeight: 220,
    objectFit: "cover" as const,
    display: "block",
  },
  attRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
  },
  attLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: 600,
    color: "#111827",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  attBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.09)",
    background: "#FFFFFF",
    color: "#374151",
    fontSize: 12.5,
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  attBtnAccent: {
    border: "none",
    background: "rgba(99,102,241,0.10)",
    color: "#4338CA",
  },
  ctaWrap: {
    marginTop: 26,
    paddingTop: 22,
    borderTop: "1px solid rgba(0,0,0,0.06)",
  },
  footer: {
    padding: "16px 0 20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderTop: "1px solid rgba(0,0,0,0.05)",
  },
};