import type { CSSProperties } from "react";

export const s: Record<string, CSSProperties> = {
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
    height: 60,
    background: "#FFFFFF",
    backgroundClip: "padding-box",
    boxShadow: "0 1px 0 0 rgba(91,61,245,0.12), 0 2px 12px rgba(0,0,0,0.05)",
  },
  navBrand: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
  },
  navCta: {
    padding: "7px 16px",
    borderRadius: 99,
    background: "linear-gradient(135deg, #5B3DF5, #E01E85, #F58020)",
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
    background: "rgba(91,61,245,0.10)",
    color: "#5B3DF5",
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
    gap: 8,
    padding: "32px 24px 40px",
    marginTop: 8,
    borderTop: "1px solid rgba(99,102,241,0.1)",
  },
  footerBrand: {
    display: "inline-flex",
    textDecoration: "none",
    marginBottom: 4,
  },
  footerTagline: {
    margin: 0,
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: 500,
    textAlign: "center" as const,
  },
  footerLink: {
    display: "inline-flex",
    alignItems: "center",
    padding: "9px 20px",
    borderRadius: 99,
    background: "linear-gradient(135deg, #5B3DF5, #E01E85, #F58020)",
    border: "none",
    fontSize: 13,
    fontWeight: 700,
    color: "#FFFFFF",
    textDecoration: "none",
  },
};
