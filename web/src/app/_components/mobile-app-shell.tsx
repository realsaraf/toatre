"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  AppBrand,
  CalendarIcon,
  InboxIcon,
  MicIcon,
  SettingsIcon,
  TimelineIcon,
  UserAvatar,
} from "@/components/mobile-ui";
import { isPhoneViewport } from "@/lib/viewport";

type MobileNavKey = "timeline" | "inbox" | "bookings" | "menu";

interface MobileAppShellProps {
  user: {
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null | undefined;
  active: MobileNavKey;
  compact?: boolean;
  inboxCount?: number;
  header: ReactNode;
  children: ReactNode;
  onOpenTimeline: () => void;
  onOpenInbox: () => void;
  onOpenBookings: () => void;
  onOpenMenu: () => void;
  onOpenCapture: () => void;
  onOpenProfile?: () => void;
  topRight?: ReactNode | null;
}

interface MobilePageIntroProps {
  title: string;
  subtitle: string;
  count?: number;
  controls?: ReactNode;
}

const shellStyles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #fbfaff 0%, #f7f5ff 52%, #fbfaff 100%)",
    position: "relative",
    overflowX: "clip",
  },
  haloOne: {
    position: "absolute",
    top: -120,
    left: -160,
    width: 420,
    height: 420,
    background: "radial-gradient(circle, rgba(249,168,212,0.18), rgba(249,168,212,0))",
    filter: "blur(20px)",
  },
  haloTwo: {
    position: "absolute",
    top: 140,
    right: -140,
    width: 420,
    height: 420,
    background: "radial-gradient(circle, rgba(191,219,254,0.24), rgba(191,219,254,0))",
    filter: "blur(24px)",
  },
  haloThree: {
    position: "absolute",
    bottom: 120,
    left: "18%",
    width: 340,
    height: 340,
    background: "radial-gradient(circle, rgba(253,224,71,0.12), rgba(253,224,71,0))",
    filter: "blur(24px)",
  },
  main: {
    width: "min(calc(100vw - 24px), 860px)",
    margin: "0 auto",
    padding: "18px 0 calc(env(safe-area-inset-bottom, 0px) + 126px)",
    position: "relative",
    zIndex: 1,
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  profileButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
  },
  intro: {
    display: "grid",
    gap: 16,
    marginBottom: 22,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "clamp(42px, 12vw, 68px)",
    lineHeight: 0.95,
    fontWeight: 850,
    letterSpacing: "-0.06em",
    color: "#0f1b4c",
  },
  countBubble: {
    minWidth: 42,
    height: 42,
    borderRadius: 999,
    padding: "0 12px",
    background: "rgba(124,58,237,0.1)",
    color: "#6d28d9",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    fontSize: "clamp(16px, 4.8vw, 22px)",
    lineHeight: 1.45,
    color: "#6b7280",
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  dockWrap: {
    position: "fixed",
    left: "50%",
    bottom: "max(6px, env(safe-area-inset-bottom, 0px))",
    transform: "translateX(-50%)",
    width: "min(calc(100vw - 16px), 860px)",
    zIndex: 45,
  },
  dock: {
    position: "relative",
    padding: "10px 8px calc(env(safe-area-inset-bottom, 0px) + 8px)",
    borderRadius: 22,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.9))",
    border: "1px solid rgba(255,255,255,0.88)",
    boxShadow: "0 24px 70px rgba(31,41,55,0.12)",
    backdropFilter: "blur(18px)",
  },
  dockGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 2,
    alignItems: "end",
  },
  dockSpacer: {
    minHeight: 52,
  },
  navItem: {
    border: "none",
    background: "transparent",
    padding: 0,
    minHeight: 52,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    cursor: "pointer",
  },
  navIconWrap: {
    position: "relative",
    width: 32,
    height: 32,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 9,
    fontWeight: 600,
  },
  navBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    padding: "0 4px",
    background: "linear-gradient(135deg, #ec4899, #fb7185)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700,
    boxShadow: "0 10px 20px rgba(236,72,153,0.26)",
  },
  micButton: {
    position: "absolute",
    left: "50%",
    top: -16,
    transform: "translateX(-50%)",
    width: 76,
    height: 76,
    borderRadius: "50%",
    border: "4px solid rgba(255,255,255,0.95)",
    background:
      "radial-gradient(circle at 30% 20%, #fde68a 0%, rgba(253,230,138,0.56) 20%, rgba(253,230,138,0) 42%), linear-gradient(135deg, #5b3df5 0%, #7c3aed 38%, #ec4899 72%, #fb923c 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 22px 52px rgba(124,58,237,0.22)",
  },
};

export function MobileAppShell({
  user,
  active,
  compact = false,
  inboxCount = 0,
  header,
  children,
  onOpenTimeline,
  onOpenInbox,
  onOpenBookings,
  onOpenMenu,
  onOpenCapture,
  onOpenProfile,
  topRight,
}: MobileAppShellProps) {
  const resolvedTopRight =
    topRight === undefined && user ? (
      <button
        type="button"
        aria-label="Open profile settings"
        onClick={onOpenProfile ?? onOpenMenu}
        style={shellStyles.profileButton}
      >
        <UserAvatar user={user} />
      </button>
    ) : topRight;

  const [autoCompact, setAutoCompact] = useState(false);

  useEffect(() => {
    if (compact) return;

    const updateCompact = () => setAutoCompact(isPhoneViewport(window.innerWidth));
    updateCompact();
    window.addEventListener("resize", updateCompact);
    return () => window.removeEventListener("resize", updateCompact);
  }, [compact]);

  const resolvedCompact = compact || autoCompact;

  return (
    <div style={shellStyles.page}>
      <div style={shellStyles.haloOne} />
      <div style={shellStyles.haloTwo} />
      <div style={shellStyles.haloThree} />

      <main
        style={{
          ...shellStyles.main,
          width: resolvedCompact ? "min(calc(100vw - 18px), 372px)" : shellStyles.main.width,
          padding: resolvedCompact
            ? "16px 0 calc(env(safe-area-inset-bottom, 0px) + 122px)"
            : shellStyles.main.padding,
        }}
      >
        <div
          style={{
            ...shellStyles.topRow,
            justifyContent: resolvedTopRight ? "space-between" : "flex-start",
          }}
        >
          <AppBrand />
          {resolvedTopRight}
        </div>
        {header}
        {children}
      </main>

      <div
        style={{
          ...shellStyles.dockWrap,
          width: resolvedCompact ? "min(calc(100vw - 14px), 376px)" : shellStyles.dockWrap.width,
        }}
      >
        <div style={shellStyles.dock}>
          <button
            type="button"
            aria-label="Open capture"
            onClick={onOpenCapture}
            style={{
              ...shellStyles.micButton,
              width: resolvedCompact ? 72 : shellStyles.micButton.width,
              height: resolvedCompact ? 72 : shellStyles.micButton.height,
              top: resolvedCompact ? -14 : shellStyles.micButton.top,
            }}
          >
            <MicIcon size={resolvedCompact ? 30 : 34} color="#fff" />
          </button>

          <div style={shellStyles.dockGrid}>
            <DockItem
              label="Timeline"
              icon={<TimelineIcon size={22} />}
              active={active === "timeline"}
              onClick={onOpenTimeline}
            />
            <DockItem
              label="Inbox"
              icon={<InboxIcon size={22} />}
              badge={inboxCount || undefined}
              active={active === "inbox"}
              onClick={onOpenInbox}
            />
            <div aria-hidden style={shellStyles.dockSpacer} />
            <DockItem
              label="Bookings"
              icon={<CalendarIcon size={22} />}
              active={active === "bookings"}
              onClick={onOpenBookings}
            />
            <DockItem
              label="Menu"
              icon={<SettingsIcon size={22} />}
              active={active === "menu"}
              onClick={onOpenMenu}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobilePageIntro({ title, subtitle, count, controls }: MobilePageIntroProps) {
  return (
    <section style={shellStyles.intro}>
      <div>
        <div style={shellStyles.titleRow}>
          <h1 style={shellStyles.title}>{title}</h1>
          {typeof count === "number" ? <span style={shellStyles.countBubble}>{count}</span> : null}
        </div>
        <p style={shellStyles.subtitle}>{subtitle}</p>
      </div>
      {controls ? <div style={shellStyles.controls}>{controls}</div> : null}
    </section>
  );
}

function DockItem({
  label,
  icon,
  active,
  badge,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={shellStyles.navItem} aria-current={active ? "page" : undefined}>
      <span
        style={{
          ...shellStyles.navIconWrap,
          background: active ? "rgba(91,61,245,0.12)" : "transparent",
          color: active ? "#5b3df5" : "#6b7280",
        }}
      >
        {icon}
        {badge ? <span style={shellStyles.navBadge}>{badge}</span> : null}
      </span>
      <span style={{ ...shellStyles.navLabel, color: active ? "#5b3df5" : "#6b7280" }}>{label}</span>
    </button>
  );
}