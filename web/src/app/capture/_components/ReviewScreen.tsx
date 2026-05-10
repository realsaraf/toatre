"use client";

import { useMemo, useRef, useState } from "react";
import type { SerializedToat } from "@/types";
import { ReviewToatCard } from "./ReviewToatCard";
import { EditToatModal } from "./EditToatModal";

interface ReviewScreenProps {
  transcript: string;
  toats: SerializedToat[];
  selected: boolean[];
  onToggle: (i: number) => void;
  onToggleAll: () => void;
  onAddToat: () => number;
  onUpdateToat: (i: number, updated: Partial<SerializedToat>) => void;
  onReorder: (from: number, to: number) => void;
  onAddToTimeline: () => void;
  onCancel: () => void;
  selectedCount: number;
  isCommitting: boolean;
}

export function ReviewScreen({
  transcript, toats, selected, onToggle, onToggleAll,
  onAddToat, onUpdateToat, onReorder, onAddToTimeline, onCancel,
  selectedCount, isCommitting,
}: ReviewScreenProps) {
  const allSelected = selected.every(Boolean);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const capturedAt = useMemo(() => {
    const now = new Date();
    return `${now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }, []);

  const toatCountLabel = `${toats.length} toat${toats.length === 1 ? "" : "s"}`;

  return (
    <div className="post-capture-review">
      <style>{postCaptureReviewCss}</style>

      <header className="post-capture-header">
        <div className="post-capture-title-row">
          <span className="post-capture-sparkle" aria-hidden>
            <SparklesIcon />
          </span>
          <div>
            <h1>Captured</h1>
            <p>{capturedAt}</p>
          </div>
        </div>
      </header>

      <section className="post-capture-found-row" aria-label="Capture summary">
        <span className="post-capture-check" aria-hidden><CheckIcon /></span>
        <div>
          <p>Toatre found <strong>{toatCountLabel}</strong> from your voice.</p>
          <span>Review and edit if needed before adding.</span>
        </div>
        <button type="button" className="post-capture-select-all" onClick={onToggleAll}>
          {allSelected ? "All selected" : "Select all"}
        </button>
      </section>

      <div className="post-capture-card-list">
        {toats.map((toat, i) => (
          <div
            key={toat.id || i}
            draggable
            onDragStart={() => { dragIndexRef.current = i; }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => {
              const from = dragIndexRef.current;
              if (from !== null && from !== i) onReorder(from, i);
              dragIndexRef.current = null;
            }}
          >
            <ReviewToatCard
              toat={toat}
              checked={selected[i]!}
              onToggle={() => onToggle(i)}
              onEdit={() => setEditIndex(i)}
            />
          </div>
        ))}
      </div>

      <section className="post-capture-transcript">
        <button type="button" onClick={() => setTranscriptOpen((current) => !current)} aria-expanded={transcriptOpen}>
          <span className="post-capture-wave" aria-hidden><WaveformIcon /></span>
          <span>
            <strong>Original transcript</strong>
            <small>{transcript || "No transcript available."}</small>
          </span>
          <ChevronDownIcon open={transcriptOpen} />
        </button>
        {transcriptOpen ? <p>{transcript}</p> : null}
      </section>

      <p className="post-capture-help"><SparklesIcon /> Toatre can set reminders, check traffic, and add location details for you.</p>

      <footer className="post-capture-actions">
        <button type="button" className="post-capture-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="post-capture-secondary-action" onClick={() => setEditIndex(onAddToat())}>
          <PlusIcon /> Add another toat
        </button>
        <button
          type="button"
          className="post-capture-primary-action"
          onClick={onAddToTimeline}
          disabled={selectedCount === 0 || isCommitting}
        >
          <span>{isCommitting ? "Saving..." : <><CheckIcon /> Add to timeline</>}</span>
          {!isCommitting ? <small>{selectedCount} toat{selectedCount === 1 ? "" : "s"} will be added</small> : null}
        </button>
      </footer>

      {editIndex !== null && (
        <EditToatModal
          toat={toats[editIndex]!}
          onSave={(updated) => { onUpdateToat(editIndex, updated); setEditIndex(null); }}
          onClose={() => setEditIndex(null)}
        />
      )}
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" fill="currentColor" />
      <path d="M5.5 14l.9 2.6L9 17.5l-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6ZM18.5 2l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" fill="currentColor" opacity="0.82" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.6l4.1 4.1L19 6.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function WaveformIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 9v6M9 5v14M13 8v8M17 3v18M21 10v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg className={open ? "open" : ""} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const postCaptureReviewCss = `
  .post-capture-review {
    width: min(100%, 900px);
    margin: 0 auto;
    padding: 22px 26px 24px;
    scroll-margin-top: 88px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.96);
    color: #171336;
    box-shadow: 0 24px 72px rgba(35, 38, 73, 0.14);
  }

  .post-capture-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
  }

  .post-capture-title-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .post-capture-sparkle {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #6d49ff;
    background: linear-gradient(135deg, rgba(109, 73, 255, 0.10), rgba(255, 255, 255, 0.92));
    box-shadow: inset 0 0 0 1px rgba(109, 73, 255, 0.08);
  }

  .post-capture-header h1 {
    margin: 0 0 8px;
    font-size: 24px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #171336;
  }

  .post-capture-header p {
    margin: 0;
    color: #747b96;
    font-size: 14px;
    font-weight: 650;
  }

  .post-capture-found-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    margin-bottom: 20px;
  }

  .post-capture-check {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #6d49ff;
    background: #ffffff;
    border: 1px solid rgba(109, 73, 255, 0.28);
    box-shadow: 0 0 0 6px rgba(109, 73, 255, 0.05);
  }

  .post-capture-found-row p {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 720;
    letter-spacing: -0.02em;
    color: #232042;
  }

  .post-capture-found-row strong {
    color: #6d49ff;
  }

  .post-capture-found-row span:not(.post-capture-check) {
    color: #747b96;
    font-size: 13px;
    font-weight: 560;
  }

  .post-capture-select-all {
    min-height: 34px;
    padding: 0 12px;
    border-radius: 12px;
    border: 1px solid rgba(109, 73, 255, 0.16);
    background: rgba(255, 255, 255, 0.88);
    color: #6d49ff;
    font: inherit;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
  }

  .post-capture-card-list {
    display: grid;
    gap: 12px;
    margin-bottom: 18px;
  }

  .post-capture-toat-card {
    display: grid;
    grid-template-columns: auto 92px minmax(0, 1fr);
    gap: 22px;
    align-items: start;
    padding: 24px 24px 22px;
    border: 1.5px solid rgba(109, 73, 255, 0.45);
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(252,250,255,0.88));
    box-shadow: 0 18px 42px rgba(109, 73, 255, 0.06);
    transition: opacity 0.18s ease, transform 0.18s ease;
  }

  .post-capture-toat-card.is-dimmed {
    opacity: 0.54;
  }

  .post-capture-toat-select {
    width: 30px;
    height: 30px;
    margin-top: 2px;
    border-radius: 999px;
    border: 1.5px solid rgba(109, 73, 255, 0.26);
    background: #ffffff;
    color: #6d49ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 0 0 6px rgba(109, 73, 255, 0.05);
  }

  .post-capture-toat-select.checked {
    background: #ffffff;
  }

  .post-capture-toat-visual {
    width: 84px;
    height: 84px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.72);
  }

  .post-capture-toat-visual span {
    font-size: 30px;
    line-height: 1;
  }

  .post-capture-toat-body {
    min-width: 0;
    padding-top: 2px;
  }

  .post-capture-toat-mainline {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: start;
    margin-bottom: 18px;
  }

  .post-capture-toat-mainline h2 {
    margin: 0;
    color: #171336;
    font-size: 22px;
    line-height: 1.25;
    font-weight: 820;
    letter-spacing: -0.035em;
  }

  .post-capture-edit-button {
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    border-radius: 12px;
    border: 1.5px solid rgba(109, 73, 255, 0.20);
    background: rgba(255, 255, 255, 0.86);
    color: #6d49ff;
    font: inherit;
    font-size: 14px;
    font-weight: 740;
    cursor: pointer;
    white-space: nowrap;
  }

  .post-capture-toat-details {
    display: grid;
    gap: 10px;
    margin-bottom: 18px;
    color: #69738d;
    font-size: 14px;
    font-weight: 560;
  }

  .post-capture-detail-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .post-capture-detail-row.split {
    gap: 14px;
    flex-wrap: wrap;
  }

  .post-capture-detail-row.split span {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .post-capture-detail-row svg {
    flex: 0 0 auto;
  }

  .post-capture-detail-row.split span:first-child,
  .post-capture-confidence-row .time {
    color: #6d49ff;
  }

  .post-capture-detail-row.place,
  .post-capture-confidence-row .place {
    color: #17a34a;
  }

  .post-capture-detail-row.person,
  .post-capture-confidence-row .person {
    color: #2670dc;
  }

  .post-capture-confidence-row {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 22px;
  }

  .post-capture-confidence-row span {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid currentColor;
    font-size: 13px;
    font-weight: 760;
  }

  .post-capture-confidence-row .time {
    background: rgba(109, 73, 255, 0.06);
  }

  .post-capture-confidence-row .place {
    background: rgba(22, 163, 74, 0.08);
  }

  .post-capture-confidence-row .person {
    background: rgba(37, 99, 235, 0.07);
  }

  .post-capture-confidence-note {
    margin: 0;
    color: #747b96;
    font-size: 13px;
    line-height: 1.45;
    font-weight: 560;
  }

  .post-capture-transcript {
    border: 1px solid rgba(121, 130, 159, 0.18);
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(251,250,255,0.82));
    box-shadow: 0 14px 38px rgba(24, 29, 63, 0.05);
    margin-bottom: 20px;
    overflow: hidden;
  }

  .post-capture-transcript button {
    width: 100%;
    min-height: 64px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    padding: 14px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #6d49ff;
    text-align: left;
  }

  .post-capture-wave {
    display: inline-flex;
    color: #6d49ff;
  }

  .post-capture-transcript strong {
    display: block;
    margin-bottom: 7px;
    color: #232042;
    font-size: 14px;
    font-weight: 770;
  }

  .post-capture-transcript small {
    display: block;
    color: #737b96;
    font-size: 13px;
    line-height: 1.45;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .post-capture-transcript svg.open {
    transform: rotate(180deg);
  }

  .post-capture-transcript > p {
    margin: 0;
    padding: 0 20px 18px 58px;
    color: #4f5874;
    font-size: 13px;
    line-height: 1.65;
  }

  .post-capture-help {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 0 0 20px;
    color: #6d49ff;
    font-size: 14px;
    font-weight: 680;
    text-align: center;
  }

  .post-capture-help svg {
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
  }

  .post-capture-actions {
    display: grid;
    grid-template-columns: minmax(112px, 140px) minmax(190px, 1fr) minmax(218px, 280px);
    gap: 28px;
    align-items: center;
    padding-top: 20px;
    border-top: 1px solid rgba(121, 130, 159, 0.16);
  }

  .post-capture-actions button {
    min-height: 56px;
    border-radius: 14px;
    font: inherit;
    cursor: pointer;
  }

  .post-capture-cancel,
  .post-capture-secondary-action {
    border: 1px solid rgba(121, 130, 159, 0.22);
    background: rgba(255, 255, 255, 0.9);
    color: #5d647d;
    font-size: 15px;
    font-weight: 760;
  }

  .post-capture-secondary-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #6d49ff;
  }

  .post-capture-primary-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: none;
    background: linear-gradient(135deg, #5c5df7 0%, #6d49ff 48%, #9347f8 100%);
    color: #fff;
    font-weight: 780;
    font-size: 15px;
    box-shadow: 0 18px 38px rgba(109, 73, 255, 0.27);
  }

  .post-capture-primary-action:disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }

  .post-capture-primary-action span {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .post-capture-primary-action small {
    font-size: 12px;
    font-weight: 560;
    opacity: 0.88;
  }

  @media (max-width: 820px) {
    .post-capture-review {
      padding: 24px 18px 24px;
      border-radius: 24px;
    }

    .post-capture-title-row {
      gap: 14px;
    }

    .post-capture-sparkle {
      width: 54px;
      height: 54px;
      border-radius: 16px;
    }

    .post-capture-header h1 {
      font-size: 26px;
    }

    .post-capture-header p,
    .post-capture-found-row p {
      font-size: 16px;
    }

    .post-capture-found-row {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .post-capture-select-all {
      grid-column: 2;
      justify-self: start;
    }

    .post-capture-actions {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .post-capture-actions button {
      min-height: 58px;
    }

    .post-capture-toat-card {
      grid-template-columns: auto minmax(0, 1fr);
      gap: 16px;
      padding: 22px 18px;
    }

    .post-capture-toat-visual {
      width: 76px;
      height: 76px;
      grid-column: 1;
    }

    .post-capture-toat-body {
      grid-column: 1 / -1;
    }

    .post-capture-toat-mainline {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .post-capture-toat-mainline h2 {
      font-size: 22px;
    }

    .post-capture-edit-button {
      justify-content: center;
      width: 100%;
    }
  }
`;
