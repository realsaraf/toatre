import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/mobile-ui";
import { infoRowStyles } from "../_styles";

export function InfoRow({
  icon,
  label,
  title,
  subtitle,
  trailing,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  subtitle?: string | null;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span style={infoRowStyles.infoRowIcon}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={infoRowStyles.infoRowLabel}>{label}</p>
        <p style={infoRowStyles.infoRowTitle}>{title}</p>
        {subtitle ? <p style={infoRowStyles.infoRowSubtitle}>{subtitle}</p> : null}
      </div>
      {trailing}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ ...infoRowStyles.infoRow, ...infoRowStyles.infoRowButton }}
      >
        {content}
      </button>
    );
  }

  return <div style={infoRowStyles.infoRow}>{content}</div>;
}
