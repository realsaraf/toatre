"use client";

import { useMemo, useState } from "react";
import { getToatVisual } from "@/components/toat-visual";
import {
  type TimelineToat,
  toatTime,
  toatEndTime,
  toatLocation,
  toatPeople,
  mapHref,
  getPrimaryAction,
  sortToats,
} from "../../_utils/timeline-helpers";
import { desktopTimelineCss } from "./desktop.css";
import { DesktopAppSidebar } from "./DesktopAppSidebar";
import { DesktopTopbar } from "./DesktopTopbar";
import { DesktopTimelineBoard } from "./DesktopTimelineBoard";
import { DesktopDetailPanel } from "./DesktopDetailPanel";
import { DesktopCaptureModal } from "./DesktopCaptureModal";

interface DesktopUserSummary {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

interface DesktopTimelineViewProps {
  user: DesktopUserSummary | null | undefined;
  toats: TimelineToat[];
  now: Date;
  onOpenSettings: () => void;
  onOpenTimeline: () => void;
  onOpenInbox: () => void;
  onOpenPeople: () => void;
  onOpenSearch: () => void;
  onCaptureSaved: () => void;
  onOpenToat: (toat: TimelineToat) => void;
  onMarkDone: (toat: TimelineToat, anchorEl?: HTMLElement | null) => void;
  onArchiveToat: (toat: TimelineToat) => void;
  finishingToatId: string | null;
  archivingToatId: string | null;
  removingToatId: string | null;
}

export function DesktopTimelineView({
  user,
  toats,
  now,
  onOpenSettings,
  onOpenTimeline,
  onOpenInbox,
  onOpenPeople,
  onOpenSearch,
  onCaptureSaved,
  onOpenToat,
  onMarkDone,
  onArchiveToat,
  finishingToatId,
  archivingToatId,
  removingToatId,
}: DesktopTimelineViewProps) {
  const todayKey = new Date(now).toLocaleDateString("en-CA");

  const groupedToats = useMemo(() => {
    const grouped = new Map<string, TimelineToat[]>();
    for (const toat of toats) {
      const timestamp = toatTime(toat);
      if (!timestamp) continue;
      const key = new Date(timestamp).toLocaleDateString("en-CA");
      const existing = grouped.get(key) ?? [];
      existing.push(toat);
      grouped.set(key, existing);
    }
    return grouped;
  }, [toats]);

  const timelineDates = useMemo(
    () => Array.from(groupedToats.keys()).sort((left, right) => left.localeCompare(right)),
    [groupedToats],
  );

  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [selectedToatId, setSelectedToatId] = useState<string | null>(null);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [captureModalMode, setCaptureModalMode] = useState<"voice" | "type">("voice");

  const resolvedSelectedDateKey = timelineDates.includes(selectedDateKey)
    ? selectedDateKey
    : timelineDates.includes(todayKey)
      ? todayKey
      : (timelineDates[0] ?? todayKey);

  const selectedDateToats = (groupedToats.get(resolvedSelectedDateKey) ?? []).slice().sort(sortToats);

  const selectedToat =
    selectedDateToats.find((toat) => toat.id === selectedToatId) ??
    selectedDateToats[0] ??
    null;
  const selectedDateIndex = timelineDates.findIndex((value) => value === resolvedSelectedDateKey);
  const selectedDate = new Date(`${resolvedSelectedDateKey}T00:00:00`);

  const bookingCount = useMemo(
    () =>
      toats.filter((toat) => {
        const extra = toat as TimelineToat & { bookingRequestId?: string | null };
        return Boolean(extra.bookingRequestId);
      }).length,
    [toats],
  );

  const selectedVisual = selectedToat
    ? getToatVisual(selectedToat.title, selectedToat.enrichments)
    : null;
  const selectedLocation = selectedToat ? toatLocation(selectedToat) : null;
  const selectedPeople = selectedToat ? toatPeople(selectedToat) : [];
  const selectedAction = selectedToat ? getPrimaryAction(selectedToat) : null;
  const selectedActionHref = selectedAction?.href ?? mapHref(selectedLocation) ?? undefined;
  const selectedStart = selectedToat ? toatTime(selectedToat) : null;
  const selectedEnd = selectedToat ? toatEndTime(selectedToat) : null;
  const durationMinutes = (() => {
    if (!selectedStart || !selectedEnd) {
      return selectedToat?.enrichments?.time?.duration ?? null;
    }
    return Math.max(
      15,
      Math.round(
        (new Date(selectedEnd).getTime() - new Date(selectedStart).getTime()) / 60000,
      ),
    );
  })();
  const guestLabel =
    selectedPeople[0] ?? selectedToat?.enrichments?.communication?.contact ?? null;

  return (
    <div className="desktop-timeline-page">
      <style>{desktopTimelineCss}</style>

      <DesktopAppSidebar
        toatsTotal={toats.length}
        bookingCount={bookingCount}
        onOpenTimeline={onOpenTimeline}
        onOpenInbox={onOpenInbox}
        onOpenPeople={onOpenPeople}
        onOpenSettings={onOpenSettings}
      />

      <div className="desktop-app-main">
        <DesktopTopbar
          user={user}
          selectedDate={selectedDate}
          selectedDateIndex={selectedDateIndex}
          timelineDatesLength={timelineDates.length}
          onPrev={() =>
            setSelectedDateKey(
              timelineDates[Math.max(0, selectedDateIndex - 1)] ?? resolvedSelectedDateKey,
            )
          }
          onNext={() =>
            setSelectedDateKey(
              timelineDates[Math.min(timelineDates.length - 1, selectedDateIndex + 1)] ??
                resolvedSelectedDateKey,
            )
          }
          onToday={() => setSelectedDateKey(todayKey)}
          onOpenSearch={onOpenSearch}
          onOpenSettings={onOpenSettings}
        />

        <div className="desktop-content-grid">
          <DesktopTimelineBoard
            selectedDateToats={selectedDateToats}
            selectedToatId={selectedToat?.id ?? null}
            removingToatId={removingToatId}
            captureModalOpen={captureModalOpen}
            onSelectToat={setSelectedToatId}
            onOpenCapture={() => {
              setCaptureModalMode("voice");
              setCaptureModalOpen(true);
            }}
            onOpenTextCapture={() => {
              setCaptureModalMode("type");
              setCaptureModalOpen(true);
            }}
          />

          <DesktopDetailPanel
            selectedToat={selectedToat}
            selectedVisual={selectedVisual}
            selectedStart={selectedStart}
            durationMinutes={durationMinutes}
            guestLabel={guestLabel}
            selectedLocation={selectedLocation}
            selectedAction={selectedAction}
            selectedActionHref={selectedActionHref}
            finishingToatId={finishingToatId}
            archivingToatId={archivingToatId}
            onClearSelection={() => setSelectedToatId(null)}
            onOpenToat={onOpenToat}
            onMarkDone={onMarkDone}
            onArchiveToat={onArchiveToat}
          />
        </div>
      </div>

      {captureModalOpen ? (
        <DesktopCaptureModal
          initialMode={captureModalMode}
          onClose={() => setCaptureModalOpen(false)}
          onSaved={() => {
            setCaptureModalOpen(false);
            onCaptureSaved();
          }}
        />
      ) : null}
    </div>
  );
}
