"use client";

import { styles } from "../mobile/mobile.styles";

interface ClearCardProps {
  isAllDayClear?: boolean;
  clearAfterText?: string | null;
  compact?: boolean;
}

export function ClearCard({ isAllDayClear = true, clearAfterText = null, compact = false }: ClearCardProps) {
  return (
    <section style={{ ...styles.clearHeroCard, ...(compact ? styles.clearHeroCardCompact : {}) }}>
      <div style={styles.clearHeroCheckWrap}>
        <div style={{ ...styles.clearHeroCheck, ...(compact ? styles.clearHeroCheckCompact : {}) }}>✓</div>
      </div>
      <div style={styles.clearHeroCopy}>
        {isAllDayClear ? (
          <>
            <h2 style={{ ...styles.clearHeroTitle, ...(compact ? styles.clearHeroTitleCompact : {}) }}>
              You&apos;re all clear <span style={styles.clearHeroTime}>today</span>
            </h2>
            <p style={styles.clearHeroSubtitle}>Your day looks open. Enjoy the quiet.</p>
          </>
        ) : (
          <>
            <h2 style={{ ...styles.clearHeroTitle, ...(compact ? styles.clearHeroTitleCompact : {}) }}>
              You&apos;re all clear <br />after <span style={styles.clearHeroTime}>{clearAfterText}</span>
            </h2>
            <p style={styles.clearHeroSubtitle}>Your evening looks light. Enjoy!</p>
          </>
        )}
      </div>
      <div style={styles.clearHeroSky} aria-hidden />
    </section>
  );
}
