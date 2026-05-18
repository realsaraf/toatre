"use client";

import Image from "next/image";
import { type TimelineToat, type MomentGroup } from "../../_utils/timeline-helpers";
import { TimelineRow } from "../mobile/TimelineRow";
import { ClearCard } from "../shared/ClearCard";
import { FilterIcon, KeyboardIcon, ListIcon } from "./desktop-icons";

interface DesktopTimelineBoardProps {
  momentGroups: MomentGroup[];
  removingToatId: string | null;
  finishingToatId: string | null;
  captureModalOpen: boolean;
  isAllDayClear: boolean;
  clearAfterText: string | null;
  onOpenToat: (toat: TimelineToat) => void;
  onMarkDone: (toat: TimelineToat, anchor?: HTMLElement | null) => void;
  onOpenCapture: () => void;
  onOpenTextCapture: () => void;
}

export function DesktopTimelineBoard({
  momentGroups,
  removingToatId,
  finishingToatId,
  captureModalOpen,
  isAllDayClear,
  clearAfterText,
  onOpenToat,
  onMarkDone,
  onOpenCapture,
  onOpenTextCapture,
}: DesktopTimelineBoardProps) {
  const isEmpty = momentGroups.length === 0 || momentGroups.every((g) => g.toats.length === 0);

  return (
    <section className="desktop-timeline-board">
      <div className="desktop-board-head">
        <div className="desktop-board-actions" aria-label="Timeline filters">
          <button type="button" className="desktop-filter-chip active">
            <ListIcon /> All
          </button>
          <button type="button" className="desktop-filter-chip">Meetings</button>
          <button type="button" className="desktop-filter-chip">Booked by others</button>
          <button type="button" className="desktop-filter-button">
            <FilterIcon /> Filter
          </button>
          <button type="button" className="desktop-square-button icon-only" aria-label="List view">
            <ListIcon />
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="desktop-empty-state">
          <h2>No toats in this range</h2>
          <p>Try a different range or capture a new toat.</p>
        </div>
      ) : (
        <div className="desktop-timeline-list">
          <ClearCard isAllDayClear={isAllDayClear} clearAfterText={clearAfterText} />

          {momentGroups.map((group) => (
            <div className="desktop-section-block" key={group.key}>
              <div className="desktop-section-head" style={{ color: group.color }}>
                {group.icon ? <span aria-hidden>{group.icon}</span> : null}
                {group.title}
              </div>
              <div className="desktop-section-rows">
                {group.toats.map((toat) => (
                  <TimelineRow
                    key={toat.id}
                    toat={toat}
                    removing={removingToatId === toat.id}
                    doneDisabled={finishingToatId === toat.id}
                    onOpen={() => onOpenToat(toat)}
                    onDone={(anchor) => onMarkDone(toat, anchor)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!captureModalOpen ? (
        <div className="desktop-floating-capture" aria-label="Capture controls">
          <button
            type="button"
            className="desktop-keyboard-capture"
            onClick={onOpenTextCapture}
            aria-label="Type a toat"
          >
            <KeyboardIcon size={26} />
          </button>
          <button
            type="button"
            className="desktop-mic-capture"
            onClick={onOpenCapture}
            aria-label="Speak a toat"
          >
            <Image src="/micicon.png" alt="" width={30} height={30} aria-hidden />
          </button>
        </div>
      ) : null}
    </section>
  );
}
