"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon, DoneIcon, LocationIcon, SparkleIcon, SteeringWheelIcon } from "@/components/mobile-ui";
import { getToatVisual } from "@/components/toat-visual";
import {
  type TimelineToat,
  toatTime,
  toatLocation,
  formatTime,
  getCountdownLabel,
  getPrimaryAction,
} from "../../_utils/timeline-helpers";
import { styles } from "./mobile.styles";

interface UpNextCardProps {
  toat: TimelineToat;
  onDone: (anchorEl?: HTMLElement | null) => void;
  doneDisabled?: boolean;
  compact?: boolean;
  removing?: boolean;
}

export function UpNextCard({
  toat,
  onDone,
  doneDisabled = false,
  compact = false,
  removing = false,
}: UpNextCardProps) {
  const router = useRouter();
  const visual = getToatVisual(toat.title, toat.enrichments ?? undefined);
  const Icon = visual.Icon;
  const time = toatTime(toat) ? formatTime(new Date(toatTime(toat)!)) : "Any time";
  const action = getPrimaryAction(toat);
  const doneButtonRef = useRef<HTMLButtonElement>(null);

  const runAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!action) return;
    if (action.external) {
      window.open(action.href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(action.href);
  };

  const runDone = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDone(doneButtonRef.current);
  };

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/toats/${toat.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/toats/${toat.id}`);
        }
      }}
      style={{
        ...styles.upNextCard,
        ...(compact ? styles.upNextCardCompact : {}),
        transition: "opacity 0.4s ease, transform 0.4s ease",
        ...(removing
          ? { opacity: 0, transform: "scale(0.93) translateY(-8px)", pointerEvents: "none" }
          : {}),
      }}
      className="animate-fade-up"
    >
      <div
        style={{ ...styles.upNextMetaRow, ...(compact ? styles.upNextMetaRowCompact : {}) }}
      >
        <span style={{ ...styles.upNextBadge, ...(compact ? styles.upNextBadgeCompact : {}) }}>
          <SparkleIcon size={compact ? 12 : 16} /> UP NEXT
        </span>
        <span
          style={{ ...styles.upNextTimePill, ...(compact ? styles.upNextTimePillCompact : {}) }}
        >
          <ClockIcon size={compact ? 14 : 18} /> {time}
        </span>
      </div>

      <div style={{ ...styles.upNextBody, ...(compact ? styles.upNextBodyCompact : {}) }}>
        <div
          style={{
            ...styles.iconPanel,
            ...(compact ? styles.iconPanelCompact : {}),
            background: visual.gradient,
          }}
        >
          <Icon size={compact ? 24 : 30} />
        </div>

        <div style={styles.upNextContent}>
          <h3 style={{ ...styles.upNextTitle, ...(compact ? styles.upNextTitleCompact : {}) }}>
            {toat.title}
          </h3>
          {toatLocation(toat) ? (
            <p
              style={{
                ...styles.upNextLocation,
                ...(compact ? styles.upNextLocationCompact : {}),
              }}
            >
              <LocationIcon size={compact ? 14 : 18} /> {toatLocation(toat)}
            </p>
          ) : null}
          <p
            style={{
              ...styles.upNextCountdown,
              ...(compact ? styles.upNextCountdownCompact : {}),
              color: visual.accent,
            }}
          >
            {getCountdownLabel(toat, new Date())}
          </p>

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
              ref={doneButtonRef}
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
    </section>
  );
}
