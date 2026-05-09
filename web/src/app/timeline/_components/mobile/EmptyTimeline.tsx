"use client";

import { KeyboardIcon, SparkleIcon } from "@/components/mobile-ui";
import { styles } from "./mobile.styles";

interface EmptyTimelineProps {
  compact?: boolean;
  onOpenCapture: () => void;
  onOpenTextCapture: () => void;
}

export function EmptyTimeline({
  compact = false,
  onOpenCapture,
  onOpenTextCapture,
}: EmptyTimelineProps) {
  return (
    <section style={{ ...styles.emptyCard, ...(compact ? styles.emptyCardCompact : {}) }}>
      <div style={{ ...styles.emptySun, ...(compact ? styles.emptySunCompact : {}) }} />
      <div style={{ ...styles.emptyGlow, ...(compact ? styles.emptyGlowCompact : {}) }} />

      <div style={{ ...styles.emptyBadgeWrap, ...(compact ? styles.emptyBadgeWrapCompact : {}) }}>
        <span style={{ ...styles.emptyBadge, ...(compact ? styles.emptyBadgeCompact : {}) }}>
          <SparkleIcon size={compact ? 18 : 22} />
        </span>
      </div>

      <h2 style={{ ...styles.emptyTitle, ...(compact ? styles.emptyTitleCompact : {}) }}>
        Your timeline is clear
      </h2>
      <p style={{ ...styles.emptyBody, ...(compact ? styles.emptyBodyCompact : {}) }}>
        Capture something new to start building today&apos;s flow, or add a text Toat manually.
      </p>

      <div style={{ ...styles.emptyActions, ...(compact ? styles.emptyActionsCompact : {}) }}>
        <button
          type="button"
          onClick={onOpenCapture}
          style={{
            ...styles.emptyCaptureButton,
            ...(compact ? styles.emptyCaptureButtonCompact : {}),
          }}
        >
          Capture a Toat
        </button>
        <button
          type="button"
          onClick={onOpenTextCapture}
          style={{
            ...styles.emptyTextButton,
            ...(compact ? styles.emptyTextButtonCompact : {}),
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: compact ? 6 : 8 }}>
            <KeyboardIcon size={compact ? 16 : 18} />
            Type instead
          </span>
        </button>
      </div>

      <div style={{ ...styles.landscape, ...(compact ? styles.landscapeCompact : {}) }}>
        <div style={{ ...styles.sunDisc, ...(compact ? styles.sunDiscCompact : {}) }} />
        <div style={{ ...styles.hillOne, ...(compact ? styles.hillOneCompact : {}) }} />
        <div style={{ ...styles.hillTwo, ...(compact ? styles.hillTwoCompact : {}) }} />
      </div>
    </section>
  );
}
