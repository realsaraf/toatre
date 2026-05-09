import type { ReactNode } from "react";

export function SidebarNavButton({
  label,
  icon,
  onClick,
  active = false,
  badge,
  compact = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  badge?: number;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={`desktop-sidebar-nav${active ? " active" : ""}${compact ? " compact" : ""}`}
      onClick={onClick}
    >
      <span className="desktop-sidebar-nav-icon">{icon}</span>
      <span>{label}</span>
      {typeof badge === "number" ? (
        <span className="desktop-sidebar-badge">{badge}</span>
      ) : null}
    </button>
  );
}
