"use client";

import { getToatVisual } from "@/components/toat-visual";
import {
  type TimelineToat,
  toatTime,
  toatEndTime,
  toatLocation,
  toatPeople,
  formatRailTime,
  formatMinutesLabel,
  getPrimaryAction,
} from "../../_utils/timeline-helpers";
import { FilterIcon, KeyboardIcon, ListIcon, MicIcon, SparkleIcon } from "./desktop-icons";

interface DesktopTimelineBoardProps {
  selectedDateToats: TimelineToat[];
  selectedToatId: string | null;
  removingToatId: string | null;
  captureModalOpen: boolean;
  onSelectToat: (id: string) => void;
  onOpenCapture: () => void;
  onOpenTextCapture: () => void;
}

export function DesktopTimelineBoard({
  selectedDateToats,
  selectedToatId,
  removingToatId,
  captureModalOpen,
  onSelectToat,
  onOpenCapture,
  onOpenTextCapture,
}: DesktopTimelineBoardProps) {
  return (
    <section className="desktop-timeline-board">
      <div className="desktop-board-head">
        <div>
          <h1>Your timeline</h1>
          <p>Everything in chronological order</p>
        </div>
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

      {selectedDateToats.length === 0 ? (
        <div className="desktop-empty-state">
          <h2>No toats on this day</h2>
          <p>Try another day or create a new Toat.</p>
        </div>
      ) : (
        <div className="desktop-timeline-list">
          {selectedDateToats.map((toat) => {
            const visual = getToatVisual(toat.title, toat.enrichments);
            const when = toatTime(toat);
            const timeDate = when ? new Date(when) : null;
            const rail = timeDate ? formatRailTime(timeDate) : { time: "--", period: "" };
            const duration =
              toat.enrichments?.time?.duration ??
              (toatEndTime(toat) && when
                ? Math.round(
                    (new Date(toatEndTime(toat)!).getTime() - new Date(when).getTime()) / 60000,
                  )
                : null);
            const meta = toatLocation(toat) ?? toat.notes ?? "No extra details";
            const guest = toatPeople(toat)[0] ?? toat.enrichments?.communication?.contact ?? null;
            const isSelected = selectedToatId === toat.id;
            const action = getPrimaryAction(toat);

            return (
              <div
                key={toat.id}
                className={`desktop-timeline-row${removingToatId === toat.id ? " removing" : ""}`}
              >
                <div className="desktop-rail-column">
                  <div className="desktop-rail-time">{rail.time}</div>
                  <div className="desktop-rail-duration">
                    {duration ? formatMinutesLabel(duration) : ""}
                  </div>
                  <span
                    className={`desktop-rail-dot${isSelected ? " active" : ""}`}
                    style={{ background: visual.tint }}
                  />
                </div>

                <button
                  type="button"
                  className={`desktop-toat-card${isSelected ? " active" : ""}`}
                  onClick={() => onSelectToat(toat.id)}
                >
                  <div className="desktop-toat-icon" style={{ background: visual.gradient }}>
                    <visual.Icon size={18} color="#FFFFFF" />
                  </div>
                  <div className="desktop-toat-copy">
                    <strong>{toat.title}</strong>
                    <span>{meta}</span>
                  </div>
                  <div className="desktop-toat-tags">
                    {guest ? (
                      <span className="desktop-toat-chip accent">Booked by {guest}</span>
                    ) : null}
                    {action ? (
                      <span className="desktop-toat-chip action">{action.label === "Join" ? "Join meeting" : action.label}</span>
                    ) : null}
                    <span className="desktop-toat-chip plain">{visual.label}</span>
                  </div>
                </button>
              </div>
            );
          })}

          <div className="desktop-end-card">
            <div className="desktop-end-icon"><SparkleIcon size={22} /></div>
            <div>
              <h2>You’re all clear after 6:00 PM</h2>
              <p>Nothing else scheduled for today.</p>
            </div>
            <div className="desktop-end-art" aria-hidden>
              <span />
            </div>
          </div>
        </div>
      )}

      {!captureModalOpen ? (
        <div className="desktop-floating-capture" aria-label="Capture controls">
          <button type="button" className="desktop-keyboard-capture" onClick={onOpenTextCapture} aria-label="Type a toat">
            <KeyboardIcon size={20} />
          </button>
          <button type="button" className="desktop-mic-capture" onClick={onOpenCapture} aria-label="Speak a toat">
            <MicIcon size={30} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
