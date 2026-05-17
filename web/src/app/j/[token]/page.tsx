/**
 * /j/[token] — Public shared toat page.
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

  if (!share || !toat) return <NotFoundPage />;

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
  const attachments: ToatAttachment[] = Array.isArray(toat.attachments) ? toat.attachments : [];

  const visualKey = resolveVisualKey(title, enrichments);
  const visual = TOAT_VISUAL[visualKey] ?? TOAT_VISUAL.task;

  const startDate = parseDate(
    enrichments.time?.at ?? enrichments.time?.startAt ?? enrichments.time?.dueAt,
  );
  const endDate = parseDate(enrichments.time?.endAt);

  const location =
    (typeof enrichments.place?.address === "string" && enrichments.place.address) ||
    (typeof enrichments.place?.placeName === "string" && enrichments.place.placeName) ||
    (typeof enrichments.event?.address === "string" && enrichments.event.address) ||
    (typeof enrichments.event?.venueName === "string" && enrichments.event.venueName) ||
    null;
  const mapsUrl = location ? `https://maps.google.com/?q=${encodeURIComponent(location)}` : null;
  const people: string[] = Array.isArray(enrichments.people) ? enrichments.people : [];
  const proxyBase = `/api/share/${encodeURIComponent(token)}/attachments`;

  const hasDetails = startDate || location || people.length > 0 || notes;
  const hasContent = hasDetails || links.length > 0 || attachments.length > 0;

  return (
    <div style={s.root}>
      {/* ── Nav bar ─────────────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <a href="https://toatre.com" style={s.navBrand} aria-label="Toatre home">
          <ToatreMark width={72} />
        </a>
        <a href="https://toatre.com" target="_blank" rel="noopener noreferrer" style={s.navCta}>
          Get the app
        </a>
      </nav>

      {/* ── Hero — full-width gradient ───────────────────────────────────── */}
      <header style={{ ...s.hero, background: visual.gradient }}>
        {/* subtle noise overlay */}
        <div aria-hidden style={s.heroNoise} />
        <div style={s.heroInner}>
          <div style={s.heroBadgeRow}>
            <span style={s.heroBadge}>{visual.label}</span>
            {tier === "urgent" && (
              <span style={{ ...s.heroBadge, background: "rgba(254,202,202,0.28)", color: "#FEE2E2" }}>
                🔥 Urgent
              </span>
            )}
            {tier === "important" && (
              <span style={{ ...s.heroBadge, background: "rgba(253,230,138,0.28)", color: "#FEF3C7" }}>
                ⚡ Important
              </span>
            )}
          </div>
          <div style={s.heroEmojiWrap} role="img" aria-label={visual.label}>
            {visual.emoji}
          </div>
          <h1 style={s.heroTitle}>{title}</h1>
          <p style={s.heroSub}>
            <span style={s.heroAvatarDot}>{ownerName.charAt(0).toUpperCase()}</span>
            {ownerName} shared this with you
          </p>
        </div>
        {/* wave separator */}
        <svg style={s.heroWave} viewBox="0 0 1440 56" preserveAspectRatio="none" aria-hidden>
          <path d="M0,32 C360,56 1080,0 1440,32 L1440,56 L0,56 Z" fill="#F8FAFC" />
        </svg>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main style={s.main}>
        {hasContent && (
          <section style={s.card}>
            {/* Details */}
            {startDate && (
              <DetailRow icon="📅" text={formatDateRange(startDate, endDate)} />
            )}
            {location && (
              <DetailRow icon="📍" text={location} href={mapsUrl ?? undefined} hrefLabel="Open in Maps" />
            )}
            {people.length > 0 && (
              <DetailRow icon="👥" text={people.join("  ·  ")} />
            )}
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
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={s.linkRow}>
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
        )}

        {/* CTA */}
        <div style={s.ctaBlock}>
          <OpenInAppHandoff token={token} gradient={visual.gradient} />
        </div>

        {/* Promo footer */}
        <footer style={s.footer}>
          <a href="https://toatre.com" target="_blank" rel="noopener noreferrer" style={s.footerBrand}>
            <ToatreMark width={64} />
          </a>
          <p style={s.footerTagline}>Your mic-first personal timeline.</p>
          <a href="https://toatre.com" target="_blank" rel="noopener noreferrer" style={s.footerLink}>
            Create your own toats →
          </a>
        </footer>
      </main>
    </div>
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
      <span style={s.detailIcon} aria-hidden>{icon}</span>
      <span style={s.detailText}>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.18)" }}>
            {text}
          </a>
        ) : text}
      </span>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" style={s.detailAction} aria-label={hrefLabel ?? "Open"}>↗</a>
      )}
    </div>
  );
}

function NotFoundPage() {
  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <a href="https://toatre.com" style={s.navBrand} aria-label="Toatre home">
          <ToatreMark width={72} />
        </a>
      </nav>
      <main style={{ ...s.main, paddingTop: 60 }}>
        <section style={{ ...s.card, textAlign: "center", padding: "48px 32px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, color: "#8B5CF6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Shared toat
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 800, color: "#111827" }}>
            Link not available.
          </h1>
          <p style={{ margin: 0, color: "#6B7280", fontSize: 15 }}>
            Ask the sender to share the toat again.
          </p>
        </section>
      </main>
    </div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateRange(start: Date, end: Date | null): string {
  const datePart = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timePart = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  if (!end) return `${datePart}  ·  ${timePart}`;
  const endTimePart = end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${datePart}  ·  ${timePart} — ${endTimePart}`;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  // ── Shell
  root: {
    minHeight: "100dvh",
    background: "#F8FAFC",
    display: "flex",
    flexDirection: "column",
  },

  // ── Nav
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: 56,
    background: "rgba(248,250,252,0.88)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
  },
  navBrand: {
    display: "inline-flex",
    textDecoration: "none",
  },
  navCta: {
    padding: "7px 16px",
    borderRadius: 99,
    background: "#111827",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
  },

  // ── Hero
  hero: {
    position: "relative",
    paddingTop: 52,
    paddingBottom: 0,
    overflow: "hidden",
  },
  heroNoise: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
    opacity: 0.35,
    pointerEvents: "none",
  },
  heroInner: {
    position: "relative",
    zIndex: 1,
    maxWidth: 600,
    margin: "0 auto",
    padding: "0 24px 48px",
    textAlign: "center",
  },
  heroBadgeRow: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  heroBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 99,
    background: "rgba(255,255,255,0.22)",
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.03em",
    backdropFilter: "blur(8px)",
  },
  heroEmojiWrap: {
    fontSize: 64,
    lineHeight: 1,
    marginBottom: 20,
    filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.18))",
  },
  heroTitle: {
    margin: "0 0 14px",
    fontSize: 30,
    fontWeight: 900,
    color: "#FFFFFF",
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    textShadow: "0 2px 12px rgba(0,0,0,0.15)",
  },
  heroSub: {
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.78)",
    fontWeight: 500,
  },
  heroAvatarDot: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.28)",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  },
  heroWave: {
    display: "block",
    width: "100%",
    height: 56,
    position: "relative",
    zIndex: 1,
  },

  // ── Main content
  main: {
    flex: 1,
    maxWidth: 600,
    width: "100%",
    margin: "0 auto",
    padding: "0 16px 64px",
  },

  // ── Content card
  card: {
    background: "#FFFFFF",
    borderRadius: 24,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)",
    padding: "6px 0",
    marginBottom: 16,
    overflow: "hidden",
  },

  // ── Detail rows
  detailRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "12px 20px",
    borderBottom: "1px solid rgba(0,0,0,0.04)",
  },
  detailIcon: { fontSize: 17, lineHeight: "22px", flexShrink: 0 },
  detailText: { flex: 1, fontSize: 14.5, color: "#374151", lineHeight: 1.5, minWidth: 0 },
  detailAction: {
    flexShrink: 0,
    fontSize: 13,
    color: "#9CA3AF",
    textDecoration: "none",
    lineHeight: "22px",
  },

  // ── Notes
  notes: {
    margin: "4px 16px 4px",
    padding: "14px 16px",
    borderRadius: 14,
    background: "#F9FAFB",
    border: "1px solid rgba(0,0,0,0.05)",
  },

  // ── Sections (links / attachments)
  section: {
    padding: "16px 20px 4px",
    borderTop: "1px solid rgba(0,0,0,0.04)",
  },
  sectionLabel: {
    margin: "0 0 10px",
    fontSize: 11,
    fontWeight: 800,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
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
    marginBottom: 4,
  },
  linkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  linkArrow: { fontSize: 13, color: "#9CA3AF", flexShrink: 0 },

  // ── Attachments
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
  attBtnSave: {
    border: "none",
    background: "rgba(99,102,241,0.10)",
    color: "#4338CA",
  },

  // ── CTA block
  ctaBlock: {
    marginBottom: 32,
  },

  // ── Footer
  footer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    paddingBottom: 20,
  },
  footerBrand: {
    display: "inline-flex",
    textDecoration: "none",
    marginBottom: 2,
  },
  footerTagline: {
    margin: 0,
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: 500,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: 700,
    color: "#6D28D9",
    textDecoration: "none",
  },
};
