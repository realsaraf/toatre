"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  AppBrand,
  CalendarIcon,
  InboxIcon,
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
  titleAccessory?: ReactNode;
  controls?: ReactNode;
}

interface MobileSegmentedControlItem<T extends string> {
  value: T;
  label: string;
}

interface MobileEmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

const shellStyles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #F7F1E8 0%, #F4ECDF 46%, #F8F3EB 100%)",
    position: "relative",
    overflowX: "clip",
  },
  main: {
    width: "min(calc(100vw - 24px), 860px)",
    margin: "0 auto",
    padding: "14px 0 calc(env(safe-area-inset-bottom, 0px) + 120px)",
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
    gap: 10,
    marginBottom: 16,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1,
    fontWeight: 850,
    letterSpacing: 0,
    color: "#0f1b4c",
  },
  countBubble: {
    minWidth: 30,
    height: 30,
    borderRadius: 999,
    padding: "0 9px",
    background: "rgba(124,58,237,0.1)",
    color: "#6d28d9",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.35,
    color: "#6b7280",
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  segment: {
    display: "grid",
    gap: 4,
    padding: 4,
    borderRadius: 18,
    border: "1px solid rgba(192,179,255,0.34)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.84))",
    boxShadow: "0 14px 34px rgba(31,41,55,0.05)",
    width: "100%",
  },
  segmentButton: {
    minHeight: 36,
    borderRadius: 14,
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 780,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  emptyState: {
    minHeight: 236,
    borderRadius: 24,
    padding: 24,
    border: "1px solid rgba(192,179,255,0.26)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.90), rgba(255,255,255,0.72))",
    color: "#6b7280",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    textAlign: "center",
    gap: 12,
    boxShadow: "0 22px 60px rgba(31,41,55,0.06)",
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    background: "rgba(124,58,237,0.10)",
    color: "#5b3df5",
  },
  emptyTitle: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.2,
    fontWeight: 850,
    color: "#0f1b4c",
  },
  emptyBody: {
    margin: 0,
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 1.45,
    color: "#6b7280",
  },
  emptyActions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    width: "100%",
    marginTop: 4,
  },
  emptyAction: {
    minHeight: 42,
    borderRadius: 15,
    fontSize: 13,
    fontWeight: 850,
    cursor: "pointer",
  },
  dockWrap: {
    position: "fixed",
    left: "50%",
    bottom: "max(10px, env(safe-area-inset-bottom, 0px))",
    transform: "translateX(-50%)",
    width: "min(calc(100vw - 20px), 860px)",
    zIndex: 45,
  },
  dock: {
    position: "relative",
    padding: "10px 8px calc(env(safe-area-inset-bottom, 0px) + 10px)",
    borderRadius: 30,
    background: "rgba(252,249,244,0.98)",
    border: "1px solid rgba(231,222,208,0.98)",
    boxShadow: "0 12px 26px rgba(53,39,25,0.12)",
    backdropFilter: "blur(18px)",
  },
  dockGrid: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 0,
    alignItems: "end",
  },
  dockSpacer: {
    minHeight: 58,
  },
  navItem: {
    border: "none",
    background: "transparent",
    padding: "0 4px",
    minHeight: 56,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer",
  },
  navIconWrap: {
    position: "relative",
    width: 26,
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: 0,
  },
  navBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    padding: "0 4px",
    background: "linear-gradient(135deg, #D57A7A, #E68E6E)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700,
    boxShadow: "0 10px 20px rgba(214,136,110,0.24)",
  },
  micButton: {
    position: "absolute",
    left: "50%",
    top: -24,
    transform: "translateX(-50%)",
    width: 80,
    height: 80,
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "none",
    padding: 0,
  },
  micOrb: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #6B34FF 0%, #8D3CFF 42%, #FF5A9A 72%, #FF9A4A 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), 0 10px 22px rgba(190,119,22,0.16)",
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
      <main
        style={{
          ...shellStyles.main,
          width: resolvedCompact ? "min(calc(100vw - 22px), 374px)" : shellStyles.main.width,
          padding: resolvedCompact
            ? "12px 0 calc(env(safe-area-inset-bottom, 0px) + 126px)"
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
          width: resolvedCompact ? "min(calc(100vw - 26px), 378px)" : shellStyles.dockWrap.width,
        }}
      >
        <div style={shellStyles.dock}>
          <button
            type="button"
            aria-label="Open capture"
            onClick={onOpenCapture}
            style={{
              ...shellStyles.micButton,
              width: resolvedCompact ? 76 : shellStyles.micButton.width,
              height: resolvedCompact ? 76 : shellStyles.micButton.height,
              top: resolvedCompact ? -24 : shellStyles.micButton.top,
            }}
          >
            <span aria-hidden style={shellStyles.micOrb}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/micicon.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </span>
          </button>

          <div style={shellStyles.dockGrid}>
            <DockItem
              label="Timeline"
              icon={<TimelineIcon size={23} />}
              active={active === "timeline"}
              onClick={onOpenTimeline}
            />
            <DockItem
              label="Inbox"
              icon={<InboxIcon size={23} />}
              badge={inboxCount || undefined}
              active={active === "inbox"}
              onClick={onOpenInbox}
            />
            <div aria-hidden style={shellStyles.dockSpacer} />
            <DockItem
              label="Bookings"
              icon={<CalendarIcon size={23} />}
              active={active === "bookings"}
              onClick={onOpenBookings}
            />
            <DockItem
              label="Settings"
              icon={<SettingsIcon size={23} />}
              active={active === "menu"}
              onClick={onOpenMenu}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobilePageIntro({ title, subtitle, count, titleAccessory, controls }: MobilePageIntroProps) {
  return (
    <section style={shellStyles.intro}>
      <div>
        <div style={shellStyles.titleRow}>
          <h2 style={shellStyles.title}>{title}</h2>
          {titleAccessory}
          {typeof count === "number" ? <span style={shellStyles.countBubble}>{count}</span> : null}
        </div>
        <p style={shellStyles.subtitle}>{subtitle}</p>
      </div>
      {controls ? <div style={shellStyles.controls}>{controls}</div> : null}
    </section>
  );
}

export function MobileSegmentedControl<T extends string>({
  value,
  items,
  onChange,
}: {
  value: T;
  items: Array<MobileSegmentedControlItem<T>>;
  onChange: (value: T) => void;
}) {
  return (
    <div style={{ ...shellStyles.segment, gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            style={{
              ...shellStyles.segmentButton,
              background: active ? "#fff" : "transparent",
              boxShadow: active ? "0 10px 24px rgba(31,41,55,0.06)" : "none",
              color: active ? "#5b3df5" : "#6b7280",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function MobileEmptyState({
  icon,
  title,
  body,
  actions = [],
}: {
  icon: ReactNode;
  title: string;
  body: string;
  actions?: MobileEmptyStateAction[];
}) {
  return (
    <div style={shellStyles.emptyState}>
      <div style={shellStyles.emptyIcon}>{icon}</div>
      <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
        <h2 style={shellStyles.emptyTitle}>{title}</h2>
        <p style={shellStyles.emptyBody}>{body}</p>
      </div>
      {actions.length ? (
        <div style={{ ...shellStyles.emptyActions, gridTemplateColumns: actions.length === 1 ? "1fr" : shellStyles.emptyActions.gridTemplateColumns }}>
          {actions.map((action) => {
            const primary = action.variant !== "secondary";
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                style={{
                  ...shellStyles.emptyAction,
                  border: primary ? "none" : "1px solid rgba(91,61,245,0.18)",
                  background: primary ? "linear-gradient(135deg, #5b3df5, #7c3aed)" : "rgba(255,255,255,0.9)",
                  color: primary ? "#fff" : "#5b3df5",
                }}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
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
          color: active ? "#BE7716" : "#7F746A",
        }}
      >
        {icon}
        {badge ? <span style={shellStyles.navBadge}>{badge}</span> : null}
      </span>
      <span
        style={{
          ...shellStyles.navLabel,
          color: active ? "#BE7716" : "#6E645C",
          fontWeight: active ? 700 : shellStyles.navLabel.fontWeight,
        }}
      >
        {label}
      </span>
    </button>
  );
}