"use client";

import type { SerializedToat } from "@/types";
import { getToatVisual } from "@/components/toat-visual";

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5.5" width="16" height="15" rx="4" stroke="currentColor" strokeWidth="1.9" />
      <path d="M8 3.5v4M16 3.5v4M4.5 10h15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M12 7.2v5.1l3.2 1.9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" fill="currentColor" opacity="0.14" />
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="11" r="2.2" fill="currentColor" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8.5" r="3.3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.7 19c.8-3.4 3-5.1 6.3-5.1s5.5 1.7 6.3 5.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 16.5V19h2.5L18 8.5 15.5 6 5 16.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14.5 7 17 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.6l4.1 4.1L19 6.8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDateTime(toat: SerializedToat) {
  const time = toat.enrichments?.time;
  const iso = time?.at ?? time?.startAt ?? time?.dueAt ?? null;
  if (!iso) return { date: null, time: null };
  const date = new Date(iso);
  return {
    date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export function ReviewToatCard({
  toat,
  checked,
  onToggle,
  onEdit,
}: {
  toat: SerializedToat;
  checked: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const meta = getToatVisual(toat.title, toat.enrichments ?? undefined);
  const dateTime = formatDateTime(toat);
  const loc =
    toat.enrichments?.place?.address ??
    toat.enrichments?.place?.placeName ??
    toat.enrichments?.event?.venueName ??
    null;
  const person =
    toat.enrichments?.communication?.contact ??
    toat.enrichments?.people?.[0] ??
    toat.enrichments?.event?.guests?.[0] ??
    null;
  const hasTime = Boolean(dateTime.date || dateTime.time);
  const hasPlace = Boolean(loc);
  const hasPerson = Boolean(person);

  return (
    <article className={`post-capture-toat-card${checked ? "" : " is-dimmed"}`}>
      <button className={`post-capture-toat-select${checked ? " checked" : ""}`} onClick={onToggle} aria-label={checked ? "Deselect toat" : "Select toat"}>
        {checked ? <CheckIcon /> : null}
      </button>

      <div className="post-capture-toat-visual" style={{ background: meta.chipBg }}>
        <span>{meta.emoji}</span>
      </div>

      <div className="post-capture-toat-body">
        <div className="post-capture-toat-mainline">
          <h2>{toat.title}</h2>
          <button type="button" className="post-capture-edit-button" onClick={onEdit}>
            <PencilIcon /> Edit details
          </button>
        </div>

        <div className="post-capture-toat-details">
          {hasTime ? (
            <div className="post-capture-detail-row split">
              {dateTime.date ? <span><CalendarIcon /> {dateTime.date}</span> : null}
              {dateTime.time ? <span><ClockIcon /> {dateTime.time}</span> : null}
            </div>
          ) : null}
          {loc ? <div className="post-capture-detail-row place"><PinIcon /> {loc}</div> : null}
          {person ? <div className="post-capture-detail-row person"><PersonIcon /> {person}</div> : null}
        </div>

        <div className="post-capture-confidence-row">
          {hasTime ? <span className="time">Time <CheckIcon /></span> : null}
          {hasPlace ? <span className="place">Place <CheckIcon /></span> : null}
          {hasPerson ? <span className="person">Person <CheckIcon /></span> : null}
        </div>

        <p className="post-capture-confidence-note">Toatre is 95% confident about these details.</p>
      </div>
    </article>
  );
}
