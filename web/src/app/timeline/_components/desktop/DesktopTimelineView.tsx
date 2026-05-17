"use client";

import { useEffect, useMemo, useState } from "react";
import { getToatVisual } from "@/components/toat-visual";
import {
  type TimelineToat,
  type TimelineRange,
  type MomentGroup,
  type RangeOption,
  toatTime,
  toatEndTime,
  toatLocation,
  toatPeople,
  mapHref,
  getPrimaryAction,
  sortToats,
  dateKey,
  rangeEquals,
  isToatInRange,
  getPreferredRange,
  buildRangeOptions,
  buildMomentGroups,
} from "../../_utils/timeline-helpers";
import { desktopTimelineCss } from "./desktop.css";
import { DesktopAppSidebar } from "./DesktopAppSidebar";
import { DesktopTopbar } from "./DesktopTopbar";
import { DesktopTimelineBoard } from "./DesktopTimelineBoard";
import { DesktopDetailPanel } from "./DesktopDetailPanel";
import { DesktopCaptureModal } from "./DesktopCaptureModal";
import { DesktopPageIntro } from "@/app/_components/desktop-page-intro";

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
  onOpenBookings: () => void;
  onOpenPeople: () => void;
  onOpenHelp: () => void;
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
  onOpenBookings,
  onOpenPeople,
  onOpenHelp,
  onOpenSearch,
  onCaptureSaved,
  onOpenToat,
  onMarkDone,
  onArchiveToat,
  finishingToatId,
  archivingToatId,
  removingToatId,
}: DesktopTimelineViewProps) {
  const rangeOptions = useMemo(() => buildRangeOptions(now), [now]);
  const sortedToats = useMemo(() => [...toats].sort(sortToats), [toats]);
  const preferredRange = useMemo(() => getPreferredRange(sortedToats, now), [sortedToats, now]);

  const [selectedRange, setSelectedRange] = useState<TimelineRange>({ kind: "day", dateKey: dateKey(now) });
  const [hasManualRangeSelection, setHasManualRangeSelection] = useState(false);
  const [selectedToatId, setSelectedToatId] = useState<string | null>(null);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [captureModalMode, setCaptureModalMode] = useState<"voice" | "type">("voice");

  useEffect(() => {
    if (hasManualRangeSelection) return;
    if (rangeEquals(selectedRange, preferredRange)) return;
    setSelectedRange(preferredRange);
  }, [hasManualRangeSelection, preferredRange, selectedRange]);

  const visibleToats = useMemo(
    () => sortedToats.filter((toat) => isToatInRange(toat, selectedRange, now)),
    [sortedToats, selectedRange, now],
  );

  const momentGroups: MomentGroup[] = useMemo(
    () => buildMomentGroups(visibleToats, selectedRange, now),
    [visibleToats, selectedRange, now],
  );

  const selectedToat = visibleToats.find((t) => t.id === selectedToatId) ?? visibleToats[0] ?? null;

  const bookingCount = useMemo(
    () => toats.filter((toat) => Boolean((toat as TimelineToat & { bookingRequestId?: string | null }).bookingRequestId)).length,
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
        onOpenBookings={onOpenBookings}
        onOpenPeople={onOpenPeople}
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
      />

      <div className="desktop-app-main">
        <DesktopTopbar
          user={user}
          selectedRange={selectedRange}
          rangeOptions={rangeOptions}
          onRangeChange={(range) => {
            setHasManualRangeSelection(true);
            setSelectedRange(range);
            setSelectedToatId(null);
          }}
          onOpenSearch={onOpenSearch}
          onOpenSettings={onOpenSettings}
        />

        <DesktopPageIntro
          title="Your timeline"
          subtitle="Everything in chronological order"
        />

        <div className="desktop-content-grid">
          <DesktopTimelineBoard
            momentGroups={momentGroups}
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
