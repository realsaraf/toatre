"use client";

import { useMemo } from "react";
import type { User } from "firebase/auth";
import {
  ChevronDownIcon,
  SearchIcon,
  UserAvatar,
} from "@/components/mobile-ui";
import { MobileAppShell } from "@/app/_components/mobile-app-shell";
import {
  type TimelineToat,
  type DayGroup,
  buildDayGroups,
  sortToats,
  getUpNext,
  getWeekRangeLabel,
} from "../../_utils/timeline-helpers";
import { EmptyTimeline } from "./EmptyTimeline";
import { UpNextCard } from "./UpNextCard";
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
  const sortedToats = useMemo(() => [...toats].sort(sortToats), [toats]);
  const upNext = getUpNext(sortedToats, now);

  const groupedToats: DayGroup[] = useMemo(
    () => buildDayGroups(sortedToats.filter((t) => t.id !== upNext?.id), now),
    [sortedToats, upNext, now],
  );

  const isLoading = authLoading || fetching;
  const weekRangeLabel = useMemo(() => getWeekRangeLabel(now), [now]);
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
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search"
            style={{
              width: isCompact ? 38 : 42,
              height: isCompact ? 38 : 42,
              borderRadius: 14,
              border: "1px solid rgba(91,61,245,0.10)",
              background: "rgba(255,255,255,0.88)",
              color: "#5B3DF5",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 18px 38px rgba(31,41,55,0.06)",
            }}
          >
            <SearchIcon size={isCompact ? 16 : 18} />
          </button>
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
        <div style={{ ...styles.headingRow, ...(isCompact ? styles.headingRowCompact : {}) }}>
          <div>
            <div style={{ ...styles.dayButton, ...(isCompact ? styles.dayButtonCompact : {}) }}>
              <span style={styles.dayButtonLabel}>Next 7 days</span>
              <span style={styles.dayButtonChevron} aria-hidden>
                <ChevronDownIcon size={isCompact ? 16 : 18} />
              </span>
            </div>
            <p
              style={{
                ...styles.dayButtonSubtitle,
                ...(isCompact ? styles.dayButtonSubtitleCompact : {}),
              }}
            >
              {weekRangeLabel}
            </p>
          </div>
        </div>
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
        {!authLoading && !fetching && sortedToats.length === 0 ? (
          <EmptyTimeline
            compact={isCompact}
            onOpenCapture={onOpenCapture}
            onOpenTextCapture={onOpenSearch}
          />
        ) : (
          <>
            {upNext ? (
              <UpNextCard
                toat={upNext}
                compact={isCompact}
                removing={removingToatId === upNext.id}
                doneDisabled={finishingToatId === upNext.id || archivingToatId === upNext.id}
                onDone={(anchorEl) => onMarkDone(upNext, anchorEl)}
              />
            ) : null}

            {groupedToats.map((group) => (
              <section key={group.key} style={styles.sectionBlock}>
                <p
                  style={{
                    ...styles.sectionTitle,
                    ...(isCompact ? styles.sectionTitleCompact : {}),
                  }}
                >
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
          </>
        )}
    </MobileAppShell>
  );
}
