import { SparkleIcon } from "@/components/mobile-ui";
import { heroStyles } from "../_styles";

export function DetailBadge({
  text,
  style,
  accent,
}: {
  text: string;
  style: "solid" | "soft" | "outline";
  accent: string;
}) {
  const badgeStyle =
    style === "solid"
      ? { background: accent, color: "#FFFFFF", border: "none" }
      : style === "outline"
        ? { background: "rgba(255,255,255,0.84)", color: accent, border: `1px solid ${accent}33` }
        : { background: `${accent}14`, color: accent, border: "none" };

  return (
    <span style={{ ...heroStyles.heroChip, ...badgeStyle }}>
      <SparkleIcon size={13} /> {text}
    </span>
  );
}
