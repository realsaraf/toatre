import { s } from "./_styles";

interface ShareHeroProps {
  visualGradient: string;
  visualLabel: string;
  visualEmoji: string;
  tier: string;
  title: string;
  ownerName: string;
}

export function ShareHero({
  visualGradient,
  visualLabel,
  visualEmoji,
  tier,
  title,
  ownerName,
}: ShareHeroProps) {
  return (
    <header style={{ ...s.hero, background: visualGradient }}>
      {/* subtle noise overlay */}
      <div aria-hidden style={s.heroNoise} />
      <div style={s.heroInner}>
        <div style={s.heroBadgeRow}>
          <span style={s.heroBadge}>{visualLabel}</span>
          {tier === "urgent" && (
            <span
              style={{
                ...s.heroBadge,
                background: "rgba(254,202,202,0.28)",
                color: "#FEE2E2",
              }}
            >
              🔥 Urgent
            </span>
          )}
          {tier === "important" && (
            <span
              style={{
                ...s.heroBadge,
                background: "rgba(253,230,138,0.28)",
                color: "#FEF3C7",
              }}
            >
              ⚡ Important
            </span>
          )}
        </div>
        <div style={s.heroEmojiWrap} role="img" aria-label={visualLabel}>
          {visualEmoji}
        </div>
        <h1 style={s.heroTitle}>{title}</h1>
        <p style={s.heroSub}>
          <span style={s.heroAvatarDot}>{ownerName.charAt(0).toUpperCase()}</span>
          {ownerName} shared this with you
        </p>
      </div>
      {/* wave separator — fill must match s.root background */}
      <svg style={s.heroWave} viewBox="0 0 1440 56" preserveAspectRatio="none" aria-hidden>
        <path d="M0,32 C360,56 1080,0 1440,32 L1440,56 L0,56 Z" fill="#F8FAFC" />
      </svg>
    </header>
  );
}
