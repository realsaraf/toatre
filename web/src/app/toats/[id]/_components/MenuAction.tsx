import type { ReactNode } from "react";
import { menuStyles } from "../_styles";

export function MenuAction({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={{ ...menuStyles.menuAction, color: tone }}>
      {icon}
      {label}
    </button>
  );
}
