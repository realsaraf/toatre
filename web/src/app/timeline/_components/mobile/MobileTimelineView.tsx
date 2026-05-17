"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  CalendarIcon,
  ChevronDownIcon,
  UserAvatar,
} from "@/components/mobile-ui";
import { MobileAppShell } from "@/app/_components/mobile-app-shell";
import {
  type TimelineToat,
  type TimelineRange,
  type MomentGroup,
  type RangeOption,
  formatTime,
  sortToats,
  toatTime,
  dateKey,
  rangeEquals,
  isToatInRange,
  getPreferredRange,
  buildRangeOptions,
  buildMomentGroups,
  formatRangePillLabel,
} from "../../_utils/timeline-helpers";
import { EmptyTimeline } from "./EmptyTimeline";
import { TimelineRow } from "./TimelineRow";
import { styles } from "./mobile.styles";

interface MobileTimelineViewProps {
  user: User | null | undefined;
  toats: TimelineToat[];
  now: Date;
  isCompact: boolean;
  authLoading: boolean;
  fetching: boolean;
  fetchError: string | null;
  bookingCount: number;
  finishingToatId: string | null;
  archivingToatId: string | null;
  removingToatId: string | null;
  onMarkDone: (toat: TimelineToat, anchorEl?: HTMLElement | null) => void;
  onArchiveToat: (toat: TimelineToat) => void;
  onOpenTimeline: () => void;
  onOpenSearch: () => void;
  onOpenCapture: () => void;
  onOpenToat: (toat: TimelineToat) => void;
  onOpenInbox: () => void;
  onOpenBookings: () => void;
  onOpenMenu: () => void;
}

export function MobileTimelineView({
  user,
  toats,
  now,
  isCompact,
  authLoading,
  fetching,
  fetchError,
  bookingCount,
  finishingToatId,
  archivingToatId,
  removingToatId,
  onMarkDone,
  onOpenTimeline,
  onOpenSearch,
  onOpenCapture,
  onOpenToat,
  onOpenInbox,
  onOpenBookings,
  onOpenMenu,
}: MobileTimelineViewProps) {
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<TimelineRange>({ kind: "day", dateKey: dateKey(now) });
  const [hasManualRangeSelection, setHasManualRangeSelection] = useState(false);
  const rangeOptions = useMemo(() => buildRangeOptions(now), [now]);
  const sortedToats = useMemo(() => [...toats].sort(sortToats), [toats]);
  const preferredRange = useMemo(() => getPreferredRange(sortedToats, now), [sortedToats, now]);

  useEffect(() => {
    if (hasManualRangeSelection) return;
    if (rangeEquals(selectedRange, preferredRange)) return;
    setSelectedRange(preferredRange);
  }, [hasManualRangeSelection, preferredRange, selectedRange]);

  const visibleToats = useMemo(
    () => sortedToats.filter((toat) => isToatInRange(toat, selectedRange, now)),
    [now, selectedRange, sortedToats],
  );
  const groupedToats: MomentGroup[] = useMemo(
    () => buildMomentGroups(visibleToats, selectedRange, now),
    [visibleToats, selectedRange, now],
  );

  const isLoading = authLoading || fetching;

  // clearAfter is computed from today's toats only (or selected day for single-day view)
  const { clearAfterText, isAllDayClear } = useMemo(() => {
    const todayKey = dateKey(now);
    const scopeKey = selectedRange.kind === "day" ? selectedRange.dateKey : todayKey;
    const scopeToats = sortedToats.filter((toat) => {
      const t = toatTime(toat);
      if (!t) return false;
      return dateKey(new Date(t)) === scopeKey;
    });
    const times = scopeToats
      .map((toat) => toatTime(toat))
      .filter((v): v is string => Boolean(v))
      .map((v) => new Date(v))
      .sort((a, b) => a.getTime() - b.getTime());
    if (!times.length) return { clearAfterText: null, isAllDayClear: true };
    return { clearAfterText: formatTime(times[times.length - 1]), isAllDayClear: false };
  }, [sortedToats, selectedRange, now]);

  const selectedDateKey = selectedRange.kind === "day" ? selectedRange.dateKey : dateKey(now);
  const selectedDateCount = sortedToats.filter((toat) => {
    const t = toatTime(toat);
    return t ? dateKey(new Date(t)) === selectedDateKey : false;
  }).length;
  const toatsTodayLabel = `${selectedDateCount} toats today`;

  return (
    <MobileAppShell
      user={user}
      active="timeline"
      compact={isCompact}
      inboxCount={bookingCount}
      onOpenTimeline={onOpenTimeline}
      onOpenInbox={onOpenInbox}
      onOpenBookings={onOpenBookings}
      onOpenMenu={onOpenMenu}
      onOpenCapture={onOpenCapture}
      topRight={(
        <div style={{ display: "flex", alignItems: "center", gap: isCompact ? 8 : 10 }}>
          <div style={styles.rangeMenuWrap}>
            <button
              type="button"
              aria-label="Choose timeline range"
              aria-expanded={rangeMenuOpen}
              onClick={() => setRangeMenuOpen((open) => !open)}
              style={styles.datePill}
            >
              <CalendarIcon size={isCompact ? 15 : 17} />
              <span>{formatRangePillLabel(selectedRange, rangeOptions)}</span>
              <ChevronDownIcon size={isCompact ? 14 : 16} />
            </button>
            {rangeMenuOpen ? (
              <div style={styles.rangeMenu}>
                {rangeOptions.map((option) => {
                  const selected = rangeEquals(option.value, selectedRange);
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setHasManualRangeSelection(true);
                        setSelectedRange(option.value);
                        setRangeMenuOpen(false);
                      }}
                      style={{
                        ...styles.rangeMenuItem,
                        ...(selected ? styles.rangeMenuItemActive : {}),
                      }}
                    >
                      <span>{option.label}</span>
                      <small style={styles.rangeMenuItemMeta}>{option.meta}</small>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onOpenMenu}
            style={styles.avatarButton}
            aria-label="Open menu"
          >
            <UserAvatar user={user} />
          </button>
        </div>
      )}
      header={(
        <>
          <div style={{ ...styles.toatCountWrap, ...(isCompact ? styles.toatCountWrapCompact : {}) }}>
            <span style={styles.toatCountPill}>✦ {toatsTodayLabel}</span>
          </div>
          <section style={{ ...styles.clearHeroCard, ...(isCompact ? styles.clearHeroCardCompact : {}) }}>
            <div style={styles.clearHeroCheckWrap}>
              <div style={{ ...styles.clearHeroCheck, ...(isCompact ? styles.clearHeroCheckCompact : {}) }}>✓</div>
            </div>
            <div style={styles.clearHeroCopy}>
              {isAllDayClear ? (
                <>
                  <h2 style={{ ...styles.clearHeroTitle, ...(isCompact ? styles.clearHeroTitleCompact : {}) }}>
                    You&apos;re all clear <span style={styles.clearHeroTime}>today</span>
                  </h2>
                  <p style={styles.clearHeroSubtitle}>Your day looks open. Enjoy the quiet.</p>
                </>
              ) : (
                <>
                  <h2 style={{ ...styles.clearHeroTitle, ...(isCompact ? styles.clearHeroTitleCompact : {}) }}>
                    You&apos;re all clear <br />after <span style={styles.clearHeroTime}>{clearAfterText}</span>
                  </h2>
                  <p style={styles.clearHeroSubtitle}>Your evening looks light after dinner. Enjoy!</p>
                </>
              )}
            </div>
            <div style={styles.clearHeroSky} />
          </section>
        </>
      )}
    >
        {/* Loading state */}
        {isLoading && toats.length === 0 ? (
          <section
            style={{ ...styles.loadingCard, ...(isCompact ? styles.loadingCardCompact : {}) }}
          >
            <span style={styles.loadingSpinner} />
            <p style={styles.loadingText}>Loading your timeline…</p>
          </section>
        ) : null}

        {/* Error state */}
        {fetchError ? (
          <section
            style={{ ...styles.loadingCard, ...(isCompact ? styles.loadingCardCompact : {}) }}
          >
            <p style={{ ...styles.loadingText, color: "#DC2626" }}>{fetchError}</p>
          </section>
        ) : null}

        {/* Content */}
        {!authLoading && !fetching && visibleToats.length === 0 ? (
          <EmptyTimeline
            compact={isCompact}
            onOpenCapture={onOpenCapture}
            onOpenTextCapture={onOpenSearch}
          />
        ) : (
          <div style={{ ...styles.timelineFlow, ...(isCompact ? styles.timelineFlowCompact : {}) }}>
            {groupedToats.map((group) => (
              <section key={group.key} style={styles.sectionBlock}>
                <p
                  style={{
                    ...styles.sectionTitle,
                    ...(isCompact ? styles.sectionTitleCompact : {}),
                    color: group.color,
                  }}
                >
                  {group.icon ? <span aria-hidden>{group.icon}</span> : null}
                  {group.title}
                </p>
                {group.date ? (
                  <span style={{ ...styles.sectionDate, ...(isCompact ? styles.sectionDateCompact : {}) }}>
                    {group.date}
                  </span>
                ) : null}
                <div
                  style={{
                    ...styles.sectionRows,
                    ...(isCompact ? styles.sectionRowsCompact : {}),
                  }}
                >
                  {group.toats.map((toat) => (
                    <TimelineRow
                      key={toat.id}
                      toat={toat}
                      compact={isCompact}
                      removing={removingToatId === toat.id}
                      doneDisabled={finishingToatId === toat.id || archivingToatId === toat.id}
                      onOpen={() => onOpenToat(toat)}
                      onDone={(anchorEl) => onMarkDone(toat, anchorEl)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
    </MobileAppShell>
  );
}
