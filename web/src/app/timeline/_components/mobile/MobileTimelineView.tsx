"use client";

import { useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  AppBrand,
  BottomTabBar,
  ChevronDownIcon,
  FloatingMicButton,
  InboxIcon,
  KeyboardIcon,
  PeopleIcon,
  SearchIcon,
  SettingsIcon,
  TimelineIcon,
  UserAvatar,
} from "@/components/mobile-ui";
import {
  type TimelineToat,
  type DayGroup,
  buildDayGroups,
  sortToats,
  formatSecondaryDate,
  getUpNext,
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
  onOpenSettings: () => void;
  onOpenTimeline: () => void;
  onOpenSearch: () => void;
  onOpenCapture: () => void;
  onOpenTextCapture: () => void;
  onOpenToat: (toat: TimelineToat) => void;
  onOpenInbox: () => void;
  onOpenPeople: () => void;
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
  onOpenSettings,
  onOpenTimeline,
  onOpenSearch,
  onOpenCapture,
  onOpenTextCapture,
  onOpenToat,
  onOpenInbox,
  onOpenPeople,
}: MobileTimelineViewProps) {
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const sortedToats = useMemo(() => [...toats].sort(sortToats), [toats]);
  const upNext = getUpNext(sortedToats, now);

  const groupedToats: DayGroup[] = useMemo(
    () => buildDayGroups(sortedToats.filter((t) => t.id !== upNext?.id), now),
    [sortedToats, upNext, now],
  );

  const resolvedSelectedDayKey =
    selectedDayKey && groupedToats.some((g) => g.key === selectedDayKey)
      ? selectedDayKey
      : (groupedToats[0]?.key ?? null);

  const activeGroups = resolvedSelectedDayKey
    ? groupedToats.filter((g) => g.key === resolvedSelectedDayKey)
    : groupedToats;

  const isLoading = authLoading || fetching;

  return (
    <div style={styles.page}>
      <div style={styles.backgroundHaloOne} />
      <div style={styles.backgroundHaloTwo} />
      <div style={styles.backgroundHaloThree} />

      <main style={{ ...styles.main, ...(isCompact ? styles.mainCompact : {}) }}>
        {/* Top row */}
        <div style={{ ...styles.topRow, ...(isCompact ? styles.topRowCompact : {}) }}>
          <AppBrand />
          <div style={{ display: "flex", alignItems: "center", gap: isCompact ? 8 : 10 }}>
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search"
              style={{
                width: isCompact ? 42 : 46,
                height: isCompact ? 42 : 46,
                borderRadius: 16,
                border: "1px solid rgba(91,61,245,0.10)",
                background: "rgba(255,255,255,0.88)",
                color: "#5B3DF5",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 18px 38px rgba(31,41,55,0.06)",
              }}
            >
              <SearchIcon size={isCompact ? 18 : 20} />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              style={styles.avatarButton}
              aria-label="Open settings"
            >
              <UserAvatar user={user} />
            </button>
          </div>
        </div>

        {/* Heading / day picker */}
        <div style={{ ...styles.headingRow, ...(isCompact ? styles.headingRowCompact : {}) }}>
          <div>
            <button
              type="button"
              onClick={() => setShowDayPicker((v) => !v)}
              style={{ ...styles.dayButton, ...(isCompact ? styles.dayButtonCompact : {}) }}
            >
              <span style={styles.dayButtonLabel}>{activeGroups[0]?.title ?? "Today"}</span>
              <ChevronDownIcon size={isCompact ? 16 : 18} />
            </button>
            <p
              style={{
                ...styles.dayButtonSubtitle,
                ...(isCompact ? styles.dayButtonSubtitleCompact : {}),
              }}
            >
              {activeGroups[0]?.subtitle ?? formatSecondaryDate(now)}
            </p>
          </div>

          {showDayPicker && groupedToats.length > 0 ? (
            <div style={{ ...styles.dayPicker, ...(isCompact ? styles.dayPickerCompact : {}) }}>
              {groupedToats.map((group) => (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => {
                    setSelectedDayKey(group.key);
                    setShowDayPicker(false);
                  }}
                  style={{
                    ...styles.dayPickerItem,
                    background:
                      group.key === resolvedSelectedDayKey
                        ? "rgba(91,61,245,0.08)"
                        : "transparent",
                  }}
                >
                  <span>
                    <span style={styles.dayPickerTitle}>{group.title}</span>
                    <span style={styles.dayPickerSubtitle}>{group.subtitle}</span>
                  </span>
                  <span style={styles.dayPickerCount}>{group.toats.length}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

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
            onOpenTextCapture={onOpenTextCapture}
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

            {activeGroups.map((group) => (
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
      </main>

      <button
        type="button"
        onClick={onOpenTextCapture}
        style={styles.textCaptureDockButton}
        aria-label="Open text capture"
      >
        <KeyboardIcon size={22} />
      </button>
      <FloatingMicButton onClick={onOpenCapture} />

      <BottomTabBar
        items={[
          {
            label: "Timeline",
            icon: <TimelineIcon size={22} />,
            href: "/timeline",
            active: true,
            onClick: onOpenTimeline,
          },
          {
            label: "Inbox",
            icon: <InboxIcon size={22} />,
            href: "/inbox",
            badge: bookingCount || undefined,
            onClick: onOpenInbox,
          },
          {
            label: "People",
            icon: <PeopleIcon size={22} />,
            href: "/people",
            onClick: onOpenPeople,
          },
          { label: "Settings", icon: <SettingsIcon size={22} />, href: "/settings" },
        ]}
      />
    </div>
  );
}
