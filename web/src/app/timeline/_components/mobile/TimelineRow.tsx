"use client";

import { useRef } from "react";
import { DirectionsIcon, PhoneIcon, SteeringWheelIcon, VideoIcon } from "@/components/mobile-ui";
import { getToatVisual } from "@/components/toat-visual";
import {
  type TimelineToat,
  toatTime,
  formatRailTime,
  getToatDescription,
  getPrimaryAction,
} from "../../_utils/timeline-helpers";
import { styles } from "./mobile.styles";

interface TimelineRowProps {
  toat: TimelineToat;
  onOpen: () => void;
  onDone: (anchorEl?: HTMLElement | null) => void;
  doneDisabled?: boolean;
  compact?: boolean;
  removing?: boolean;
}

export function TimelineRow({
  toat,
  onOpen,
  onDone,
  doneDisabled = false,
  compact = false,
  removing = false,
}: TimelineRowProps) {
  const visual = getToatVisual(toat.title, toat.enrichments ?? undefined);
  const Icon = visual.Icon;
  const action = getPrimaryAction(toat);
  const description = getToatDescription(toat, new Date());
  const railTime = toatTime(toat)
    ? formatRailTime(new Date(toatTime(toat)!))
    : { time: "Any", period: "time" };
  const doneRowRef = useRef<HTMLButtonElement>(null);
  const isDone = toat.state === "done";

  const status = isDone
    ? {
      label: "Done",
      color: "#2E9D45",
      background: "#E8F6E8",
      border: "1px solid #D2ECD4",
    }
    : action
      ? {
        label: action.label,
        color: visual.accent,
        background: visual.soft,
        border: "1px solid rgba(255,255,255,0.45)",
      }
      : {
        label: "Done",
        color: "#677286",
        background: "#F0F3F7",
        border: "1px solid #E3E8F0",
      };

  const statusIcon = isDone
    ? "check"
    : status.label === "Directions"
      ? "directions"
      : status.label === "Join"
        ? "join"
        : status.label === "Call"
          ? "call"
          : null;

  const runAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!action) return;
    if (action.external) {
      window.open(action.href, "_blank", "noopener,noreferrer");
      return;
    }
    onOpen();
  };

  const runDone = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDone(doneRowRef.current);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      style={{
        ...styles.timelineRow,
        ...(compact ? styles.timelineRowCompact : {}),
        transition: "opacity 0.4s ease, transform 0.4s ease",
        ...(removing
          ? { opacity: 0, transform: "scale(0.93) translateY(-8px)", pointerEvents: "none" }
          : {}),
      }}
    >
      <div
        style={{ ...styles.timeRailColumn, ...(compact ? styles.timeRailColumnCompact : {}) }}
      >
        <p style={{ ...styles.timeRailTime, ...(compact ? styles.timeRailTimeCompact : {}) }}>
          {railTime.time}
        </p>
        <p
          style={{ ...styles.timeRailPeriod, ...(compact ? styles.timeRailPeriodCompact : {}) }}
        >
          {railTime.period}
        </p>
      </div>

      <div style={styles.railTrackWrap}>
        <span style={{ ...styles.railLine, ...(compact ? styles.railLineCompact : {}) }} />
        <span
          style={{
            ...styles.railDot,
            ...(compact ? styles.railDotCompact : {}),
            background: visual.tint,
          }}
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={onKeyDown}
        style={{ ...styles.toatCard, ...(compact ? styles.toatCardCompact : {}) }}
      >
        <div
          style={{
            ...(compact ? styles.timelineIconPanelCompact : styles.timelineIconPanel),
            background: visual.gradient,
            boxShadow: `0 18px 32px ${visual.soft}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={compact ? 24 : 30} />
        </div>

        <div style={{ ...styles.cardBody, ...(compact ? styles.cardBodyCompact : {}) }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ ...styles.cardTitle, ...(compact ? styles.cardTitleCompact : {}) }}>
              {toat.title}
            </p>
            <p style={{ ...styles.cardMeta, ...(compact ? styles.cardMetaCompact : {}) }}>
              {description}
            </p>
          </div>

          <div style={{ ...styles.cardActions, ...(compact ? styles.cardActionsCompact : {}) }}>
            <button
              ref={doneRowRef}
              type="button"
              onClick={action ? runAction : runDone}
              disabled={isDone || (doneDisabled && !action)}
              style={{
                ...styles.statusPill,
                ...(compact ? styles.statusPillCompact : {}),
                color: status.color,
                background: status.background,
                border: status.border,
              }}
              aria-label={isDone ? "Toat done" : action ? `Open ${action.label}` : "Mark done"}
            >
              {statusIcon === "directions" ? (
                <>
                  <DirectionsIcon size={compact ? 13 : 15} /> {status.label}
                </>
              ) : statusIcon === "join" ? (
                <>
                  <VideoIcon size={compact ? 13 : 15} /> {status.label}
                </>
              ) : statusIcon === "call" ? (
                <>
                  <PhoneIcon size={compact ? 13 : 15} /> {status.label}
                </>
              ) : statusIcon === "check" ? (
                <>✓ {status.label}</>
              ) : (
                status.label
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
