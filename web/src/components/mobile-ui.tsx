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

export function AppBrand({ dark = false }: { dark?: boolean } = {}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.png" alt="Toatre" style={{ width: "clamp(34px, 9vw, 42px)", height: "clamp(34px, 9vw, 42px)", borderRadius: "clamp(12px, 3.2vw, 14px)", objectFit: "cover" }} />
      <ToatreMark width={124} dark={dark} />
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
    <div style={{ position: "relative", width: "clamp(44px, 11vw, 50px)", height: "clamp(44px, 11vw, 50px)", flexShrink: 0 }}>
      {user?.photoURL ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={user.photoURL}
          alt={user.displayName ?? user.email ?? "Profile"}
          referrerPolicy="no-referrer"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover",
            boxShadow: "0 8px 18px rgba(53,39,25,0.12)",
            border: "1px solid rgba(255,250,243,0.9)",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 700,
            boxShadow: "0 12px 26px rgba(124,58,237,0.18)",
          }}
        >
          {initials}
        </div>
      )}
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: -1,
          bottom: 0,
          width: 10,
          height: 10,
          borderRadius: "50%",
          border: "2px solid rgba(255,250,243,0.95)",
          background: "#C78325",
          boxShadow: "0 6px 14px rgba(199,131,37,0.28)",
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


export * from "./mobile-icons";
export * from "./mobile-glyphs";