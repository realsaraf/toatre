import type { CSSProperties } from "react";

// ─── Page layout ─────────────────────────────────────────────────────────────

export const pageStyles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #FBFAFF 0%, #F7F5FF 48%, #FBFAFF 100%)",
    position: "relative",
    overflowX: "clip",
  } as CSSProperties,
  backgroundHaloOne: {
    position: "absolute",
    top: -120,
    left: -150,
    width: 360,
    height: 360,
    background: "radial-gradient(circle, rgba(249,168,212,0.16), rgba(249,168,212,0))",
  } as CSSProperties,
  backgroundHaloTwo: {
    position: "absolute",
    top: 120,
    right: -120,
    width: 360,
    height: 360,
    background: "radial-gradient(circle, rgba(191,219,254,0.18), rgba(191,219,254,0))",
  } as CSSProperties,
  backgroundHaloThree: {
    position: "absolute",
    bottom: 120,
    left: "22%",
    width: 300,
    height: 300,
    background: "radial-gradient(circle, rgba(253,224,71,0.1), rgba(253,224,71,0))",
  } as CSSProperties,
  main: {
    width: "min(calc(100vw - 24px), 860px)",
    margin: "0 auto",
    padding: "24px 0 40px",
    position: "relative",
    zIndex: 1,
  } as CSSProperties,
  mainCompact: {
    width: "min(calc(100vw - 18px), 860px)",
    padding: "10px 0 22px",
  } as CSSProperties,
  flash: {
    marginBottom: 16,
    padding: "14px 18px",
    borderRadius: 20,
    background: "rgba(91,61,245,0.08)",
    color: "#5B3DF5",
    fontSize: 16,
    fontWeight: 700,
  } as CSSProperties,
};

// ─── Top bar ──────────────────────────────────────────────────────────────────

export const topBarStyles = {
  topBar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 34,
  } as CSSProperties,
  topBarCompact: {
    gap: 10,
    marginBottom: 14,
  } as CSSProperties,
  topBarRight: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  } as CSSProperties,
  topBarRightCompact: {
    gap: 8,
  } as CSSProperties,
};

// ─── Hero section ─────────────────────────────────────────────────────────────

export const heroStyles = {
  heroCard: {
    borderRadius: 28,
    border: "1px solid transparent",
    padding: "22px 22px 20px",
    marginBottom: 14,
  } as CSSProperties,
  heroCardCompact: {
    borderRadius: 22,
    padding: "14px 14px 12px",
    marginBottom: 10,
  } as CSSProperties,
  heroSection: {
    display: "flex",
    alignItems: "flex-start",
    gap: 26,
    marginBottom: 0,
  } as CSSProperties,
  heroSectionCompact: {
    gap: 11,
    marginBottom: 0,
  } as CSSProperties,
  heroIconWrap: {
    width: 138,
    height: 138,
    borderRadius: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 28px 60px rgba(91,61,245,0.18)",
    flexShrink: 0,
  } as CSSProperties,
  heroIconWrapCompact: {
    width: 64,
    height: 64,
    borderRadius: 20,
  } as CSSProperties,
  heroKickerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 8,
  } as CSSProperties,
  heroKicker: {
    fontSize: 16,
    letterSpacing: "0.04em",
    fontWeight: 700,
    textTransform: "uppercase",
  } as CSSProperties,
  heroTitle: {
    fontSize: "clamp(40px, 10vw, 60px)",
    lineHeight: 0.96,
    letterSpacing: "-0.05em",
    color: "#0F1B4C",
    fontWeight: 800,
    marginBottom: 14,
  } as CSSProperties,
  heroTitleCompact: {
    fontSize: 25,
    marginBottom: 7,
  } as CSSProperties,
  heroLocation: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 18,
    color: "#4B5563",
    marginBottom: 8,
  } as CSSProperties,
  heroLocationCompact: {
    gap: 6,
    fontSize: 12,
    marginBottom: 4,
  } as CSSProperties,
  heroSecondary: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
    color: "#6B7280",
  } as CSSProperties,
  heroSecondaryCompact: {
    gap: 6,
    fontSize: 11.5,
  } as CSSProperties,
  heroMeetingMeta: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  } as CSSProperties,
  heroMetaChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 34,
    padding: "0 14px",
    borderRadius: 999,
    background: "rgba(37,99,235,0.1)",
    color: "#2563EB",
    fontSize: 15,
    fontWeight: 700,
  } as CSSProperties,
  heroMetaChipCompact: {
    minHeight: 28,
    padding: "0 10px",
    fontSize: 12,
    gap: 6,
  } as CSSProperties,
  peopleRow: {
    display: "flex",
    alignItems: "center",
  } as CSSProperties,
  personBadge: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    marginLeft: -8,
    background: "linear-gradient(135deg, #E5E7EB, #F8FAFC)",
    border: "3px solid rgba(255,255,255,0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
  } as CSSProperties,
  personOverflow: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    marginLeft: -8,
    background: "rgba(229,231,235,0.8)",
    border: "3px solid rgba(255,255,255,0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#4B5563",
  } as CSSProperties,
  personBadgeCompact: {
    width: 32,
    height: 32,
    fontSize: 10,
    borderWidth: 2,
  } as CSSProperties,
  heroChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 36,
    padding: "0 13px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
  } as CSSProperties,
};

// ─── Action strip ─────────────────────────────────────────────────────────────

export const actionStripStyles = {
  actionStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 6,
    borderRadius: 22,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 26px 80px rgba(31,41,55,0.08)",
    padding: "12px 8px",
    marginBottom: 14,
  } as CSSProperties,
  actionStripButton: {
    border: "none",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    fontSize: 10.5,
    fontWeight: 600,
    padding: "4px 0",
  } as CSSProperties,
  actionStripIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as CSSProperties,
  fullWidthPrimary: {
    width: "100%",
    minHeight: 64,
    border: "none",
    borderRadius: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 28px 60px rgba(37,99,235,0.24)",
    marginBottom: 18,
  } as CSSProperties,
  fullWidthPrimaryCompact: {
    minHeight: 44,
    borderRadius: 15,
    fontSize: 13,
    gap: 8,
    marginBottom: 10,
  } as CSSProperties,
};

// ─── Section card ─────────────────────────────────────────────────────────────

export const sectionCardStyles = {
  sectionCard: {
    borderRadius: 20,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
    border: "1px solid rgba(255,255,255,0.94)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    padding: "14px 14px 13px",
    marginBottom: 10,
  } as CSSProperties,
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  } as CSSProperties,
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.02em",
  } as CSSProperties,
  inlineGhost: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 11,
    border: "1px solid rgba(123,92,246,0.18)",
    background: "rgba(123,92,246,0.08)",
    color: "#6D28D9",
    fontSize: 11.5,
    fontWeight: 700,
  } as CSSProperties,
};

// ─── Info row ─────────────────────────────────────────────────────────────────

export const infoRowStyles = {
  infoRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 0",
    borderTop: "1px solid rgba(229,231,235,0.6)",
  } as CSSProperties,
  infoRowButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
  } as CSSProperties,
  infoRowIcon: {
    width: 24,
    display: "flex",
    justifyContent: "center",
    color: "#6B7280",
    flexShrink: 0,
  } as CSSProperties,
  infoRowLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 3,
  } as CSSProperties,
  infoRowTitle: {
    fontSize: 15,
    lineHeight: 1.12,
    color: "#0F172A",
    fontWeight: 700,
    marginBottom: 3,
  } as CSSProperties,
  infoRowSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 1.35,
  } as CSSProperties,
};

// ─── Shared buttons ───────────────────────────────────────────────────────────

export const buttonStyles = {
  buttonRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    marginTop: 10,
  } as CSSProperties,
  primaryButton: {
    minHeight: 42,
    border: "none",
    borderRadius: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 22px 46px rgba(91,61,245,0.22)",
  } as CSSProperties,
  secondaryButton: {
    minHeight: 42,
    border: "1px solid rgba(123,92,246,0.18)",
    borderRadius: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "rgba(255,255,255,0.9)",
    color: "#6D28D9",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  } as CSSProperties,
};

// ─── Toggle row / switch ──────────────────────────────────────────────────────

export const toggleStyles = {
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 0",
    borderTop: "1px solid rgba(229,231,235,0.6)",
  } as CSSProperties,
  toggleRowText: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  } as CSSProperties,
  toggleIcon: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as CSSProperties,
  toggleTitle: {
    fontSize: 13.5,
    color: "#111827",
    fontWeight: 700,
    marginBottom: 3,
  } as CSSProperties,
  toggleSubtitle: {
    fontSize: 11.5,
    color: "#6B7280",
  } as CSSProperties,
  switchBase: {
    width: 42,
    height: 23,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    padding: 2,
    flexShrink: 0,
  } as CSSProperties,
  switchThumb: {
    width: 19,
    height: 19,
    borderRadius: "50%",
    background: "#FFFFFF",
    boxShadow: "0 6px 16px rgba(31,41,55,0.16)",
    transition: "transform 0.18s ease",
  } as CSSProperties,
};

// ─── Notes / capture ──────────────────────────────────────────────────────────

export const notesStyles = {
  notesTextarea: {
    width: "100%",
    background: "transparent",
    border: "1px solid rgba(209,213,219,0.6)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 15,
    color: "#111827",
    fontFamily: "inherit",
    lineHeight: 1.6,
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
  } as CSSProperties,
  captureLine: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginTop: 12,
    color: "#6B7280",
    fontSize: 11.5,
  } as CSSProperties,
  captureAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #E5E7EB, #F8FAFC)",
    color: "#111827",
    fontWeight: 700,
  } as CSSProperties,
  bodyText: {
    fontSize: 13,
    lineHeight: 1.45,
    color: "#111827",
  } as CSSProperties,
};

// ─── Checklist ────────────────────────────────────────────────────────────────

export const checklistStyles = {
  checklist: {
    display: "grid",
    gap: 2,
  } as CSSProperties,
  checklistRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid rgba(229,231,235,0.5)",
  } as CSSProperties,
  grabHandle: {
    color: "#D1D5DB",
    cursor: "grab",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
  } as CSSProperties,
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "2px solid rgba(34,197,94,0.55)",
    flexShrink: 0,
    cursor: "pointer",
    background: "transparent",
    padding: 0,
  } as CSSProperties,
  checkLabel: {
    fontSize: 15,
    color: "#111827",
    fontWeight: 500,
    lineHeight: 1.4,
  } as CSSProperties,
  checkDeleteButton: {
    background: "transparent",
    border: "none",
    color: "#9CA3AF",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: 1,
    padding: "0 4px",
    flexShrink: 0,
  } as CSSProperties,
};

// ─── Attachment / ping ────────────────────────────────────────────────────────

export const attachmentStyles = {
  attachmentRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  } as CSSProperties,
  attachmentRowButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    padding: 0,
  } as CSSProperties,
  attachmentIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as CSSProperties,
  attachmentTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
  } as CSSProperties,
  attachmentSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    wordBreak: "break-all",
  } as CSSProperties,
  pingRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  } as CSSProperties,
  list: {
    paddingLeft: 22,
    display: "grid",
    gap: 12,
    fontSize: 16,
    lineHeight: 1.4,
    color: "#111827",
  } as CSSProperties,
};

// ─── Sharing grid ─────────────────────────────────────────────────────────────

export const shareGridStyles = {
  shareGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: 16,
  } as CSSProperties,
  sharePerson: {
    textAlign: "center",
  } as CSSProperties,
  shareAvatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    margin: "0 auto 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #E5E7EB, #F8FAFC)",
    fontSize: 18,
    fontWeight: 700,
    color: "#374151",
  } as CSSProperties,
  shareName: {
    fontSize: 17,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
  } as CSSProperties,
  shareRole: {
    fontSize: 13,
    color: "#6B7280",
  } as CSSProperties,
};

// ─── Tip card ─────────────────────────────────────────────────────────────────

export const tipCardStyles = {
  tipCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 14px",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(255,247,237,0.9), rgba(255,255,255,0.78))",
    border: "1px solid rgba(253,186,116,0.28)",
    boxShadow: "0 22px 60px rgba(249,115,22,0.08)",
    marginBottom: 14,
  } as CSSProperties,
  tipSpark: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "rgba(251,146,60,0.14)",
    color: "#F97316",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as CSSProperties,
  tipText: {
    fontSize: 15,
    lineHeight: 1.5,
    color: "#111827",
  } as CSSProperties,
};

// ─── Menu ─────────────────────────────────────────────────────────────────────

export const menuStyles = {
  menuCard: {
    position: "absolute",
    top: 74,
    right: 0,
    width: 220,
    padding: 10,
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.88))",
    border: "1px solid rgba(255,255,255,0.94)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.14)",
    backdropFilter: "blur(18px)",
    zIndex: 10,
  } as CSSProperties,
  menuAction: {
    width: "100%",
    minHeight: 48,
    border: "none",
    borderRadius: 16,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
    fontSize: 18,
    fontWeight: 600,
    cursor: "pointer",
  } as CSSProperties,
};

// ─── Share modal ──────────────────────────────────────────────────────────────

export const shareModalStyles = {
  shareOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 40,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    background: "rgba(17,24,39,0.34)",
    padding: 12,
  } as CSSProperties,
  shareSheet: {
    width: "min(100%, 560px)",
    maxHeight: "92vh",
    overflowY: "auto",
    borderRadius: 30,
    background: "#FFFFFF",
    border: "1px solid rgba(229,231,235,0.92)",
    boxShadow: "0 28px 90px rgba(17,24,39,0.22)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  } as CSSProperties,
  shareSheetHandle: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 99,
    background: "#D1D5DB",
    marginBottom: 4,
  } as CSSProperties,
  shareHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  } as CSSProperties,
  shareEyebrow: {
    margin: 0,
    fontSize: 12,
    fontWeight: 850,
    letterSpacing: 0,
    color: "#5B3DF5",
    textTransform: "uppercase",
  } as CSSProperties,
  shareTitle: {
    margin: "4px 0 0",
    fontSize: 26,
    lineHeight: 1.08,
    color: "#111827",
  } as CSSProperties,
  shareCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    border: "1px solid rgba(107,114,128,0.16)",
    background: "rgba(249,250,251,0.92)",
    color: "#374151",
    fontSize: 26,
    lineHeight: 1,
    cursor: "pointer",
  } as CSSProperties,
  sharePreviewCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    background: "#F8F7FF",
    border: "1px solid #ECE9FF",
  } as CSSProperties,
  sharePreviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #7C3AED, #5B3DF5)",
    color: "#FFFFFF",
  } as CSSProperties,
  sharePreviewTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 15,
    fontWeight: 850,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } as CSSProperties,
  sharePreviewMeta: {
    margin: "4px 0 0",
    color: "#6B7280",
    fontSize: 12,
  } as CSSProperties,
  sharePeopleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
    gap: 10,
  } as CSSProperties,
  sharePersonButton: {
    display: "flex",
    minHeight: 112,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 18,
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    color: "#111827",
    cursor: "pointer",
  } as CSSProperties,
  sharePersonButtonSelected: {
    borderColor: "#5B3DF5",
    background: "#F4F0FF",
  } as CSSProperties,
  sharePersonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #EC4899, #F59E0B)",
    color: "#FFFFFF",
    fontWeight: 900,
    fontSize: 13,
  } as CSSProperties,
  sharePersonName: {
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 13,
    fontWeight: 850,
  } as CSSProperties,
  sharePersonRelationship: {
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 11,
    color: "#6B7280",
  } as CSSProperties,
  shareEmptyButton: {
    gridColumn: "1 / -1",
    minHeight: 80,
    borderRadius: 18,
    border: "1px dashed rgba(91,61,245,0.35)",
    background: "#F8F7FF",
    color: "#5B3DF5",
    fontWeight: 850,
    cursor: "pointer",
  } as CSSProperties,
  shareHelper: {
    gridColumn: "1 / -1",
    margin: 0,
    color: "#6B7280",
    fontSize: 14,
  } as CSSProperties,
  sharePermissionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: 6,
    borderRadius: 18,
    background: "#F3F4F6",
  } as CSSProperties,
  sharePermissionButton: {
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: "transparent",
    color: "#6B7280",
    fontWeight: 850,
    cursor: "pointer",
  } as CSSProperties,
  sharePermissionButtonActive: {
    background: "#FFFFFF",
    color: "#5B3DF5",
    boxShadow: "0 8px 22px rgba(17,24,39,0.08)",
  } as CSSProperties,
};

// ─── Summary tile ─────────────────────────────────────────────────────────────

export const summaryStyles = {
  summaryTile: {
    borderRadius: 22,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
    border: "1px solid rgba(255,255,255,0.94)",
    boxShadow: "0 24px 70px rgba(31,41,55,0.08)",
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  } as CSSProperties,
  summaryRing: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "4px solid rgba(34,197,94,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 10,
  } as CSSProperties,
  summaryValue: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    marginBottom: 6,
  } as CSSProperties,
  summarySubtitle: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 1.4,
  } as CSSProperties,
};

// ─── Loading / error states ───────────────────────────────────────────────────

export const stateStyles = {
  loadingCard: {
    minHeight: 320,
    borderRadius: 34,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  } as CSSProperties,
  loadingSpinner: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "3px solid rgba(91,61,245,0.12)",
    borderTopColor: "#5B3DF5",
  } as CSSProperties,
  loadingText: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: 600,
  } as CSSProperties,
  errorCard: {
    minHeight: 320,
    borderRadius: 34,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    textAlign: "center",
    padding: 32,
  } as CSSProperties,
  errorTitle: {
    fontSize: 28,
    lineHeight: 1.1,
    fontWeight: 800,
    color: "#0F172A",
  } as CSSProperties,
  errorBody: {
    fontSize: 19,
    lineHeight: 1.5,
    color: "#6B7280",
    maxWidth: 500,
  } as CSSProperties,
};
