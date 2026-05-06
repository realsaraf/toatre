import type { ReactNode } from "react";
import { actionStripStyles } from "../_styles";

export function ActionStripButton({
  icon,
  label,
  onClick,
  tint,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...actionStripStyles.actionStripButton,
        color: tint,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        style={{
          ...actionStripStyles.actionStripIcon,
          background: `${tint}14`,
        }}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
