"use client";

import { SearchIcon, UserAvatar } from "@/components/mobile-ui";
import { BellIcon, CaretDownIcon } from "./desktop-icons";

interface DesktopUserSummary {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

interface DesktopTopbarProps {
  user: DesktopUserSummary | null | undefined;
  selectedDate: Date;
  selectedDateIndex: number;
  timelineDatesLength: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

export function DesktopTopbar({
  user,
  selectedDate,
  selectedDateIndex,
  timelineDatesLength,
  onPrev,
  onNext,
  onToday,
  onOpenSearch,
  onOpenSettings,
}: DesktopTopbarProps) {
  const dateText = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="desktop-app-topbar">
      <button type="button" className="desktop-search-button" onClick={onOpenSearch}>
        <span className="desktop-search-left">
          <SearchIcon size={18} />
          <span>Search toats, people, places...</span>
        </span>
        <span className="desktop-keycap">⌘ K</span>
      </button>

      <div className="desktop-date-nav" aria-label="Date navigation">
        <button
          type="button"
          className="desktop-square-button"
          disabled={selectedDateIndex <= 0}
          onClick={onPrev}
          aria-label="Previous day"
        >
          ‹
        </button>
        <button type="button" className="desktop-date-button" onClick={onToday}>
          <span>{dateText}</span>
          <CaretDownIcon size={14} />
        </button>
        <button
          type="button"
          className="desktop-square-button"
          disabled={selectedDateIndex < 0 || selectedDateIndex >= timelineDatesLength - 1}
          onClick={onNext}
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      <div className="desktop-topbar-right">
        <button
          type="button"
          className="desktop-bell-button"
          aria-label="Notifications"
        >
          <BellIcon />
          <span>2</span>
        </button>
        <button
          type="button"
          className="desktop-user-button"
          onClick={onOpenSettings}
          aria-label="Open profile settings"
        >
          <UserAvatar user={user} />
          <CaretDownIcon size={15} />
        </button>
      </div>
    </header>
  );
}
