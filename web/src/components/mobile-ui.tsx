import Link from "next/link";
import { ReactNode } from "react";
import { ToatreMark } from "@/components/ToatreMark";

interface AvatarUser {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

interface CircleIconButtonProps {
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: ReactNode;
}

interface BottomTabItem {
  label: string;
  icon: ReactNode;
  href?: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

export function AppBrand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.png" alt="Toatre" style={{ width: "clamp(32px, 9vw, 40px)", height: "clamp(32px, 9vw, 40px)", borderRadius: "clamp(12px, 3.4vw, 14px)", objectFit: "cover" }} />
      <ToatreMark width={100} />
    </div>
  );
}

export function CircleIconButton({ label, onClick, active = false, children }: CircleIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: "clamp(46px, 12vw, 54px)",
        height: "clamp(46px, 12vw, 54px)",
        borderRadius: "clamp(16px, 4.4vw, 20px)",
        border: active ? "1px solid rgba(99,102,241,0.22)" : "1px solid rgba(255,255,255,0.82)",
        background: active
          ? "linear-gradient(180deg, rgba(237,233,254,0.98), rgba(255,255,255,0.9))"
          : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.82))",
        boxShadow: active
          ? "0 18px 40px rgba(99,102,241,0.16)"
          : "0 18px 40px rgba(31,41,55,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "#5B3DF5" : "#6B7280",
        cursor: onClick ? "pointer" : "default",
        backdropFilter: "blur(14px)",
      }}
    >
      {children}
    </button>
  );
}

export function UserAvatar({ user }: { user: AvatarUser | null | undefined }) {
  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "T";

  return (
    <div style={{ position: "relative", width: "clamp(46px, 12vw, 58px)", height: "clamp(46px, 12vw, 58px)", flexShrink: 0 }}>
      {user?.photoURL ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={user.photoURL}
          alt={user.displayName ?? user.email ?? "Profile"}
          referrerPolicy="no-referrer"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "clamp(18px, 5vw, 22px)",
            objectFit: "cover",
            boxShadow: "0 18px 40px rgba(31,41,55,0.12)",
            border: "1px solid rgba(255,255,255,0.85)",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "clamp(18px, 5vw, 22px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: 700,
            boxShadow: "0 18px 40px rgba(124,58,237,0.2)",
          }}
        >
          {initials}
        </div>
      )}
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: -2,
          bottom: -2,
          width: 12,
          height: 12,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.95)",
          background: "linear-gradient(135deg, #7C3AED, #5B3DF5)",
          boxShadow: "0 8px 20px rgba(124,58,237,0.28)",
        }}
      />
    </div>
  );
}

export function FloatingMicButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Open capture"
      onClick={onClick}
      style={{
        position: "fixed",
        right: "max(16px, calc((100vw - min(100vw - 16px, 860px)) / 2 + 16px))",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 78px)",
        width: "clamp(72px, 19vw, 84px)",
        height: "clamp(72px, 19vw, 84px)",
        borderRadius: "50%",
        border: "none",
        background: "radial-gradient(circle at 30% 20%, #FDE68A 0%, rgba(253,230,138,0.56) 20%, rgba(253,230,138,0) 42%), linear-gradient(135deg, #5B3DF5 0%, #7C3AED 38%, #EC4899 72%, #FB923C 100%)",
        boxShadow: "0 32px 80px rgba(124,58,237,0.28)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 45,
      }}
    >
      <span
        aria-hidden
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          backgroundImage: "url('/micicon.png')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />
    </button>
  );
}

export function BottomTabBar({ items }: { items: BottomTabItem[] }) {
  return (
    <nav
      aria-label="Primary"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        transform: "translateX(-50%)",
        width: "min(calc(100vw - 16px), 860px)",
        padding: "7px 8px calc(env(safe-area-inset-bottom, 0px) + 6px)",
        borderRadius: 22,
        background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))",
        border: "1px solid rgba(255,255,255,0.88)",
        boxShadow: "0 24px 70px rgba(31,41,55,0.12)",
        backdropFilter: "blur(18px)",
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        gap: 4,
        zIndex: 40,
      }}
    >
      {items.map((item) => {
        const content = (
          <>
            <span
              style={{
                position: "relative",
                width: 34,
                height: 34,
                borderRadius: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: item.active ? "#5B3DF5" : "#6B7280",
                background: item.active ? "rgba(91,61,245,0.12)" : "transparent",
              }}
            >
              {item.icon}
              {item.badge ? (
                <span
                  style={{
                    position: "absolute",
                    right: -2,
                    top: -2,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #EC4899, #FB7185)",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    boxShadow: "0 10px 20px rgba(236,72,153,0.26)",
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: item.active ? 700 : 500,
                color: item.active ? "#5B3DF5" : "#6B7280",
              }}
            >
              {item.label}
            </span>
            <span
              aria-hidden
              style={{
                width: item.active ? 28 : 0,
                height: 3,
                borderRadius: 999,
                background: "linear-gradient(90deg, #5B3DF5, #7C3AED)",
                transition: "width 0.18s ease",
              }}
            />
          </>
        );

        const sharedStyle = {
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          minHeight: 58,
          textDecoration: "none",
          borderRadius: 16,
          border: "none",
          background: "transparent",
          cursor: item.href || item.onClick ? "pointer" : "default",
          padding: 0,
        };

        if (item.href) {
          return (
            <Link key={item.label} href={item.href} style={sharedStyle} aria-current={item.active ? "page" : undefined}>
              {content}
            </Link>
          );
        }

        if (item.onClick) {
          return (
            <button key={item.label} type="button" onClick={item.onClick} style={sharedStyle}>
              {content}
            </button>
          );
        }

        return (
          <div key={item.label} style={sharedStyle}>
            {content}
          </div>
        );
      })}
    </nav>
  );
}

export function BackIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14.5 6 8.5 12l6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="14" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5V8M16 3.5V8M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function FilterIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 7h14M8 12h8M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15" cy="7" r="1.7" fill="currentColor" />
      <circle cx="9" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="17" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M4.5 7 9 11.5 13.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClockIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SparkleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 2.2 10.6 6 14.4 7.6 10.6 9.2 9 13 7.4 9.2 3.6 7.6 7.4 6 9 2.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function LocationIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 20s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function DirectionsIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m4 11 14.5-6.1c.7-.3 1.4.4 1.1 1.1L13.5 20.5c-.3.8-1.4.7-1.6-.2l-1.4-5.4L5 13.5c-.9-.2-1-.3-1-.6 0-.4 0-.5 0-.9Z" fill="currentColor" />
    </svg>
  );
}

export function PhoneIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7.2 4.6c.5-.5 1.2-.6 1.8-.3l2 1c.7.3 1 .9.8 1.6l-.7 2.4c-.1.5 0 1 .4 1.4l2 2c.4.4 1 .5 1.4.4l2.4-.7c.7-.2 1.3.1 1.6.8l1 2c.3.6.2 1.3-.3 1.8l-1 1c-1 1-2.5 1.3-3.9.9-2.9-.8-5.6-3-7.7-6s-3.2-6.1-3-8.8c.1-1 .5-2 1.2-2.7l1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function MessageIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 18.5 4.5 20v-4.3A7.5 7.5 0 1 1 12 19.5H7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function ShareIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 16V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m8.5 8.5 3.5-3.5 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 14.5V18a1.5 1.5 0 0 0 1.5 1.5h10A1.5 1.5 0 0 0 18.5 18v-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MoreIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6.5" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="17.5" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function EditIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 16.5V19h2.5L18 8.5 15.5 6 5 16.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m14.5 7 2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6.5 16.5h11l-1.2-1.4a3.2 3.2 0 0 1-.8-2.1V10a4.5 4.5 0 0 0-9 0v3a3.2 3.2 0 0 1-.8 2.1L4.5 16.5h2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DuplicateIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="8" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 8V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M8 10v7M12 10v7M16 10v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.5 7 7.4 18a2 2 0 0 0 2 1.8h5.2a2 2 0 0 0 2-1.8L17.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function DoneIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.5 12.4 2.3 2.3 4.8-4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SnoozeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 4.5 6 2.8M16 4.5 18 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function RescheduleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="14" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5V8M16 3.5V8M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m9 14 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DocumentIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 4.5h6l4 4v11a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 19.5v-13A2 2 0 0 1 7 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 4.5v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TicketIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6h12a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 4V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-4V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 8.5v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="1.8 2.2" />
    </svg>
  );
}

export function VideoIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="7" width="10" height="10" rx="2.5" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.8" />
      <path d="m14 10 5-2v8l-5-2v-4Z" fill="currentColor" />
    </svg>
  );
}

export function SearchIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PeopleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 18a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 14.5c1.6.5 2.7 1.8 3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function InboxIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5.5 6.5h13l2 8v2a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 16.5v-2l2-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4.5 14.5h4l1.5 2h4l1.5-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function SettingsIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M18 18l1.5 1.5M4.5 4.5 6 6M18 6l1.5-1.5M4.5 19.5 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TimelineIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="3" rx="1.5" fill="currentColor" />
      <rect x="4" y="10.5" width="11" height="3" rx="1.5" fill="currentColor" />
      <rect x="4" y="16" width="14" height="3" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export function MicIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="8.5" y="2.5" width="7" height="11" rx="3.5" fill={color} />
      <path d="M5 11a7 7 0 0 0 14 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 21h7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ToothGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M10.1 5.7c2.2 0 3.6 1.1 5.9 1.1 2.1 0 3.7-1.1 5.8-1.1 3.6 0 6.2 2.8 6.2 6.8 0 3.5-1.4 6.1-2.7 8.1-1.3 2-2.6 3.5-4 3.5-1.1 0-1.8-.7-2.1-1.9l-1-3.7c-.3-1.1-.9-1.7-2-1.7s-1.8.6-2.1 1.7l-1 3.7c-.3 1.2-1 1.9-2.1 1.9-1.4 0-2.7-1.5-4-3.5-1.3-2-2.7-4.6-2.7-8.1 0-4 2.6-6.8 5.8-6.8Z" fill={color} />
    </svg>
  );
}

export function PhoneGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return <span style={{ color, display: "inline-flex" }}><PhoneIcon size={size} /></span>;
}

export function MessageGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return <span style={{ color, display: "inline-flex" }}><MessageIcon size={size} /></span>;
}

export function CartGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 4h2l2 10h9.5l2.2-7H7" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="19" r="1.6" fill={color} />
      <circle cx="17" cy="19" r="1.6" fill={color} />
    </svg>
  );
}

export function BulbGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 14c-1.4-1.1-2.3-2.9-2.3-4.8A6.3 6.3 0 0 1 12 3a6.3 6.3 0 0 1 6.3 6.2c0 2-.9 3.7-2.3 4.8-.9.7-1.4 1.7-1.4 2.8H9.4c0-1.1-.5-2.1-1.4-2.8Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 19h5M10.4 22h3.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function EnvelopeGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="3" stroke={color} strokeWidth="1.8" />
      <path d="m6 8 6 5 6-5" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function TicketGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return <span style={{ color, display: "inline-flex" }}><TicketIcon size={size} /></span>;
}

export function VideoGlyph({ size = 28, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return <span style={{ color, display: "inline-flex" }}><VideoIcon size={size} /></span>;
}

export function KeyboardIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="6" width="17" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 10h.01M10.5 10h.01M14 10h.01M17 10h.01M7 13.5h.01M10.5 13.5h7M7 16h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}