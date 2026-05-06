import type { ReactNode } from "react";
import { sectionCardStyles } from "../_styles";

export function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section style={sectionCardStyles.sectionCard}>
      <div style={sectionCardStyles.sectionHeader}>
        <h2 style={sectionCardStyles.sectionHeading}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
