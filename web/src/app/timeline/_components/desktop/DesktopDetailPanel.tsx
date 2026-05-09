"use client";

import { TimelineIcon } from "@/components/mobile-ui";
import { getToatVisual } from "@/components/toat-visual";
import {
  type TimelineToat,
  formatMinutesLabel,
} from "../../_utils/timeline-helpers";
import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  MoreIcon,
  RescheduleIcon,
} from "./desktop-icons";

type ToatVisual = ReturnType<typeof getToatVisual>;

interface DesktopDetailPanelProps {
  selectedToat: TimelineToat | null;
  selectedVisual: ToatVisual | null;
  selectedStart: string | null;
  durationMinutes: number | null;
  guestLabel: string | null;
  selectedLocation: string | null;
  selectedAction: { label: string; href: string } | null;
  selectedActionHref: string | undefined;
  finishingToatId: string | null;
  archivingToatId: string | null;
  onClearSelection: () => void;
  onOpenToat: (toat: TimelineToat) => void;
  onMarkDone: (toat: TimelineToat, anchor?: HTMLElement | null) => void;
  onArchiveToat: (toat: TimelineToat) => void;
}

export function DesktopDetailPanel({
  selectedToat,
  selectedVisual,
  selectedStart,
  durationMinutes,
  guestLabel,
  selectedLocation,
  selectedAction,
  selectedActionHref,
  finishingToatId,
  archivingToatId,
  onClearSelection,
  onOpenToat,
  onMarkDone,
  onArchiveToat,
}: DesktopDetailPanelProps) {
  const dateLabel = selectedStart
    ? new Date(selectedStart).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "No date";
  const shortDateLabel = selectedStart
    ? new Date(selectedStart).toLocaleDateString("en-US", { weekday: "short" })
    : "Any time";
  const timeLabel = selectedStart
    ? new Date(selectedStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "No time";
  const platformLabel =
    selectedToat?.enrichments?.communication?.joinUrl
      ? selectedToat.enrichments.communication.joinUrl.includes("zoom")
        ? "Zoom Meeting"
        : selectedToat.enrichments.communication.joinUrl.includes("meet")
          ? "Google Meet"
          : "Microsoft Teams meeting"
      : selectedLocation ?? selectedVisual?.label ?? "Toatre";
  const people = selectedToat?.enrichments?.people ?? [];
  const visiblePeople = people.length > 0 ? people : guestLabel ? [guestLabel] : [];
  const checklist = selectedToat?.enrichments?.action?.checklist ?? [];
  const completedItems = checklist.filter((item) => item.done).length;
  const reminderOffset = selectedToat?.enrichments?.time?.reminderOffset ?? 10;

  return (
    <aside className="desktop-detail-panel">
      {selectedToat ? (
        <>
          <section
            className="desktop-detail-hero"
            style={{ background: selectedVisual?.soft ?? "rgba(124,58,237,0.10)" }}
          >
            <button
              type="button"
              className="desktop-detail-more"
              onClick={onClearSelection}
              aria-label="Clear selection"
            >
              <MoreIcon size={18} />
            </button>
            <div
              className="desktop-detail-icon"
              style={{
                background: selectedVisual?.gradient ?? "linear-gradient(135deg,#5B3DF5,#7C3AED)",
              }}
            >
              {selectedVisual ? (
                <selectedVisual.Icon size={22} color="#FFFFFF" />
              ) : (
                <TimelineIcon size={22} />
              )}
            </div>
            <div className="desktop-detail-hero-copy">
              <h2>{selectedToat.title}</h2>
              <span className="desktop-detail-time-pill">
                <ClockIcon size={14} /> {shortDateLabel} · {timeLabel}
              </span>
              <p>{platformLabel}</p>
            </div>
            {selectedActionHref ? (
              <a className="desktop-detail-primary" href={selectedActionHref} target="_blank" rel="noreferrer">
                {selectedAction?.label === "Join" ? "Join meeting" : selectedAction?.label ?? "Open"}
              </a>
            ) : null}
          </section>

          <section className="desktop-action-row" aria-label="Quick actions">
            <button
              type="button"
              className="desktop-quick-action done"
              disabled={finishingToatId === selectedToat.id}
              onClick={(event) => onMarkDone(selectedToat, event.currentTarget)}
            >
              <span><CheckCircleIcon size={19} /></span>
              {finishingToatId === selectedToat.id ? "Saving" : "Mark done"}
            </button>
            <button type="button" className="desktop-quick-action delay" onClick={() => onOpenToat(selectedToat)}>
              <span><ClockIcon size={19} /></span>
              +1 Day
            </button>
            <button type="button" className="desktop-quick-action schedule" onClick={() => onOpenToat(selectedToat)}>
              <span><RescheduleIcon size={19} /></span>
              Reschedule
            </button>
            <button type="button" className="desktop-quick-action copy" onClick={() => onOpenToat(selectedToat)}>
              <span><CopyIcon size={19} /></span>
              Duplicate
            </button>
          </section>

          <section className="desktop-detail-card">
            <h3>When & where</h3>
            <div className="desktop-field-row">
              <span>When</span>
              <strong>{selectedStart ? `${dateLabel} at ${timeLabel}` : dateLabel}</strong>
            </div>
            <div className="desktop-field-row">
              <span>Duration</span>
              <strong>{durationMinutes ? formatMinutesLabel(durationMinutes) : "Not set"}</strong>
              <button type="button" onClick={() => onOpenToat(selectedToat)}>Edit</button>
            </div>
            <div className="desktop-field-row">
              <span>Where</span>
              <strong>{platformLabel}</strong>
              {selectedActionHref ? (
                <a href={selectedActionHref} target="_blank" rel="noreferrer">
                  {selectedAction?.label === "Join" ? "Join" : "Open"} <ExternalLinkIcon size={13} />
                </a>
              ) : null}
            </div>
            <div className="desktop-field-row">
              <span>Calendar</span>
              <strong><i /> Work</strong>
              <button type="button" onClick={() => onOpenToat(selectedToat)}>Change</button>
            </div>
          </section>

          {checklist.length > 0 ? (
            <section className="desktop-detail-card desktop-checklist-summary">
              <div className="desktop-stat-grid">
                <div><strong>{completedItems} of {checklist.length} left</strong><span>Items to get</span></div>
                <div><strong>{checklist.length} items</strong><span>In your list</span></div>
                <div><strong>{Math.min(4, Math.max(1, Math.ceil(checklist.length / 3)))} categories</strong><span>Grouped gently</span></div>
              </div>
              <div className="desktop-list-preview">
                <h3>Shopping list preview</h3>
                {checklist.slice(0, 5).map((item) => (
                  <p key={item.id}>{item.text}</p>
                ))}
              </div>
            </section>
          ) : null}

          <section className="desktop-detail-card desktop-people-card">
            <h3>People</h3>
            <div className="desktop-people-row">
              <div className="desktop-avatar-stack">
                {visiblePeople.slice(0, 3).map((person) => (
                  <span key={person}>{person.slice(0, 1).toUpperCase()}</span>
                ))}
                {visiblePeople.length > 3 ? <span>+{visiblePeople.length - 3}</span> : null}
                {visiblePeople.length === 0 ? <span>T</span> : null}
              </div>
              <strong>{visiblePeople.length > 0 ? `${Math.max(visiblePeople.length, 1)} going` : "For me"}</strong>
            </div>
          </section>

          <section className="desktop-detail-card">
            <h3>Agenda</h3>
            <p>{selectedToat.notes ?? selectedToat.enrichments?.thought?.content ?? "Discuss project updates and plan for this week."}</p>
          </section>

          <section className="desktop-file-card">
            <div className="desktop-file-icon"><FileIcon size={20} /></div>
            <div>
              <strong>{selectedVisual?.label === "Checklist" ? "Shopping list" : "Project Update Q2.docx"}</strong>
              <span>Uploaded by {guestLabel ?? "you"} · Today</span>
            </div>
            <button type="button" aria-label="Download attachment"><DownloadIcon size={17} /></button>
            <button type="button" aria-label="More attachment actions"><MoreIcon size={17} /></button>
          </section>

          <section className="desktop-detail-card desktop-ping-card">
            <div>
              <BellIcon />
              <div>
                <h3>Ping me</h3>
                <p>{reminderOffset} minutes before</p>
              </div>
            </div>
            <button type="button" onClick={() => onOpenToat(selectedToat)}>Edit</button>
          </section>

          <button
            type="button"
            className="desktop-detail-archive"
            disabled={archivingToatId === selectedToat.id || finishingToatId === selectedToat.id}
            onClick={() => onArchiveToat(selectedToat)}
          >
            {archivingToatId === selectedToat.id ? "Archiving..." : "Archive toat"}
          </button>
        </>
      ) : (
        <div className="desktop-empty-detail">
          <h2>Select a toat</h2>
          <p>Pick one from the timeline to see details and quick actions.</p>
        </div>
      )}
    </aside>
  );
}
