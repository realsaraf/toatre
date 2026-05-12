"use client";

import { useRef } from "react";
import { DoneIcon, SteeringWheelIcon } from "@/components/mobile-ui";
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
        <span
          style={{
            ...styles.railConnector,
            ...(compact ? styles.railConnectorCompact : {}),
            background: visual.tint,
          }}
        />
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
            {action ? (
              <button
                type="button"
                onClick={runAction}
                style={{
                  ...styles.cardActionButton,
                  ...(compact ? styles.cardActionButtonCompact : {}),
                  color: visual.accent,
                  background: visual.soft,
                }}
              >
                {action.label === "Directions" ? (
                  <>
                    <SteeringWheelIcon size={compact ? 13 : 15} /> Directions
                  </>
                ) : (
                  action.label
                )}
              </button>
            ) : null}
            <button
              ref={doneRowRef}
              type="button"
              onClick={runDone}
              disabled={doneDisabled}
              style={{ ...styles.doneButton, ...(compact ? styles.doneButtonCompact : {}) }}
              aria-label="Mark done"
            >
              <DoneIcon size={compact ? 15 : 18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
