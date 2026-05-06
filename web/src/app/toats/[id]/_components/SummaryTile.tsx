import { summaryStyles } from "../_styles";

export function SummaryTile({
  accent,
  title,
  subtitle,
  value,
}: {
  accent: string;
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div style={summaryStyles.summaryTile}>
      <span style={{ ...summaryStyles.summaryRing, borderColor: `${accent}55`, color: accent }}>
        {title}
      </span>
      <p style={summaryStyles.summaryValue}>{value}</p>
      <p style={summaryStyles.summarySubtitle}>{subtitle}</p>
    </div>
  );
}
