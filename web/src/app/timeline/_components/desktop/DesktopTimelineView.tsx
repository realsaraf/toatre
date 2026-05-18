"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type TimelineToat,
  type TimelineRange,
  type MomentGroup,
  type RangeOption,
  sortToats,
  dateKey,
  rangeEquals,
  isToatInRange,
  getPreferredRange,
  buildRangeOptions,
  buildMomentGroups,
  toatTime,
  formatTime,
} from "../../_utils/timeline-helpers";
import { desktopTimelineCss } from "./desktop.css";
import { DesktopAppSidebar } from "./DesktopAppSidebar";
import { DesktopTopbar } from "./DesktopTopbar";
import { DesktopTimelineBoard } from "./DesktopTimelineBoard";
import { DesktopCaptureModal } from "./DesktopCaptureModal";
import { DesktopToatPanel } from "./DesktopToatPanel";
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

  useEffect(() => {
    if (!selectedToatId) return;
    if (sortedToats.some((toat) => toat.id === selectedToatId)) return;
    setSelectedToatId(null);
  }, [selectedToatId, sortedToats]);

  const visibleToats = useMemo(
    () => sortedToats.filter((toat) => isToatInRange(toat, selectedRange, now)),
    [sortedToats, selectedRange, now],
  );

  const momentGroups: MomentGroup[] = useMemo(
    () => buildMomentGroups(visibleToats, selectedRange, now),
    [visibleToats, selectedRange, now],
  );

  const { clearAfterText, isAllDayClear } = useMemo(() => {
    const times = visibleToats
      .map((toat) => toatTime(toat))
      .filter((v): v is string => Boolean(v))
      .map((v) => new Date(v))
      .sort((a, b) => a.getTime() - b.getTime());
    if (!times.length) return { clearAfterText: null, isAllDayClear: true };
    return { clearAfterText: formatTime(times[times.length - 1]), isAllDayClear: false };
  }, [visibleToats]);

  const bookingCount = useMemo(
    () => toats.filter((toat) => Boolean((toat as TimelineToat & { bookingRequestId?: string | null }).bookingRequestId)).length,
    [toats],
  );

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
          }}
          onOpenSearch={onOpenSearch}
          onOpenSettings={onOpenSettings}
        />

        <div className={`desktop-content-grid${selectedToatId ? " desktop-content-grid--panel" : ""}`}>
          <div className="desktop-timeline-column">
            <DesktopPageIntro
              title="Your timeline"
              subtitle="Everything in chronological order"
            />

            <DesktopTimelineBoard
              momentGroups={momentGroups}
              removingToatId={removingToatId}
              finishingToatId={finishingToatId}
              captureModalOpen={captureModalOpen}
              isAllDayClear={isAllDayClear}
              clearAfterText={clearAfterText}
              onOpenToat={(toat) => setSelectedToatId(toat.id)}
              onMarkDone={onMarkDone}
              onOpenCapture={() => {
                setCaptureModalMode("voice");
                setCaptureModalOpen(true);
              }}
              onOpenTextCapture={() => {
                setCaptureModalMode("type");
                setCaptureModalOpen(true);
              }}
            />
          </div>

          {selectedToatId ? (
            <DesktopToatPanel
              toatId={selectedToatId}
              onClose={() => setSelectedToatId(null)}
            />
          ) : null}
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
