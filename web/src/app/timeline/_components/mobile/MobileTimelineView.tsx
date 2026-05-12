"use client";

import { useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  CalendarIcon,
  ChevronDownIcon,
  UserAvatar,
} from "@/components/mobile-ui";
import { MobileAppShell } from "@/app/_components/mobile-app-shell";
import {
  type TimelineToat,
  formatTime,
  sortToats,
  toatTime,
} from "../../_utils/timeline-helpers";
import { EmptyTimeline } from "./EmptyTimeline";
import { TimelineRow } from "./TimelineRow";
import { styles } from "./mobile.styles";

interface MomentGroup {
  key: string;
  title: string;
  icon: string;
  color: string;
  toats: TimelineToat[];
}

type TimelineRange =
  | { kind: "next7" }
  | { kind: "next30" }
  | { kind: "next3months" }
  | { kind: "day"; dateKey: string };

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
  const [selectedRange, setSelectedRange] = useState<TimelineRange>({ kind: "next7" });
  const rangeOptions = useMemo(() => buildRangeOptions(now), [now]);
  const selectedOption = rangeOptions.find((option) => rangeEquals(option.value, selectedRange)) ?? rangeOptions[0];
  const sortedToats = useMemo(() => [...toats].sort(sortToats), [toats]);
  const visibleToats = useMemo(
    () => sortedToats.filter((toat) => isToatInRange(toat, selectedRange, now)),
    [now, selectedRange, sortedToats],
  );
  const groupedToats: MomentGroup[] = useMemo(() => buildMomentGroups(visibleToats), [visibleToats]);

  const isLoading = authLoading || fetching;
  const clearAfter = useMemo(() => {
    const timed = visibleToats
      .map((toat) => toatTime(toat))
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value))
      .sort((left, right) => left.getTime() - right.getTime());
    return timed.length ? formatTime(timed[timed.length - 1]) : "today";
  }, [visibleToats]);

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
              <span>{selectedOption.label}</span>
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
        <section style={{ ...styles.clearHeroCard, ...(isCompact ? styles.clearHeroCardCompact : {}) }}>
          <div style={styles.clearHeroCheckWrap}>
            <div style={{ ...styles.clearHeroCheck, ...(isCompact ? styles.clearHeroCheckCompact : {}) }}>✓</div>
          </div>
          <div style={styles.clearHeroCopy}>
            <h2 style={{ ...styles.clearHeroTitle, ...(isCompact ? styles.clearHeroTitleCompact : {}) }}>
              You&apos;re all clear <br />after <span style={styles.clearHeroTime}>{clearAfter}</span>
            </h2>
            <p style={styles.clearHeroSubtitle}>Plan looks great! Enjoy your day.</p>
          </div>
          <div style={styles.clearHeroSky} />
        </section>
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
                  <span aria-hidden>{group.icon}</span>
                  {group.title}
                </p>
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

function buildMomentGroups(toats: TimelineToat[]): MomentGroup[] {
  const definitions = [
    { key: "morning", title: "MORNING", icon: "☼", color: "#FF8A00", test: (hour: number) => hour < 12 },
    { key: "afternoon", title: "AFTERNOON", icon: "☀", color: "#FF2E91", test: (hour: number) => hour >= 12 && hour < 18 },
    { key: "evening", title: "EVENING", icon: "☾", color: "#6A35FF", test: (hour: number) => hour >= 18 },
  ];

  const groups = definitions.map((definition) => ({ ...definition, toats: [] as TimelineToat[] }));
  const someday: MomentGroup = { key: "someday", title: "SOMEDAY", icon: "✦", color: "#7B61FF", toats: [] };

  for (const toat of toats) {
    const time = toatTime(toat);
    if (!time) {
      someday.toats.push(toat);
      continue;
    }
    const hour = new Date(time).getHours();
    const group = groups.find((candidate) => candidate.test(hour));
    (group ?? groups[0]).toats.push(toat);
  }

  return [...groups, someday]
    .filter((group) => group.toats.length > 0)
    .map(({ key, title, icon, color, toats }) => ({ key, title, icon, color, toats }));
}

function buildRangeOptions(now: Date): Array<{ key: string; label: string; meta: string; value: TimelineRange }> {
  const start = startOfLocalDay(now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: `day-${dateKey(date)}`,
      label: index === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      meta: date.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
      value: { kind: "day", dateKey: dateKey(date) } as TimelineRange,
    };
  });

  return [
    { key: "next7", label: "Next 7 days", meta: "Today through the week", value: { kind: "next7" } },
    { key: "next30", label: "Next 30 days", meta: "Everything coming up", value: { kind: "next30" } },
    { key: "next3months", label: "Next 3 months", meta: "Longer horizon", value: { kind: "next3months" } },
    ...days,
  ];
}

function isToatInRange(toat: TimelineToat, range: TimelineRange, now: Date): boolean {
  const value = toatTime(toat);
  if (!value) return range.kind !== "day";
  const date = new Date(value);
  const start = startOfLocalDay(now);
  const end = new Date(start);

  if (range.kind === "day") return dateKey(date) === range.dateKey;
  if (range.kind === "next7") end.setDate(start.getDate() + 7);
  if (range.kind === "next30") end.setDate(start.getDate() + 30);
  if (range.kind === "next3months") end.setMonth(start.getMonth() + 3);
  return date >= start && date < end;
}

function rangeEquals(left: TimelineRange, right: TimelineRange): boolean {
  return left.kind === right.kind && (left.kind !== "day" || (right.kind === "day" && left.dateKey === right.dateKey));
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
