"use client";

import { useState } from "react";
import { CalendarIcon, SearchIcon, UserAvatar } from "@/components/mobile-ui";
import { BellIcon, CaretDownIcon } from "./desktop-icons";
import {
  type TimelineRange,
  type RangeOption,
  rangeEquals,
  formatRangePillLabel,
} from "../../_utils/timeline-helpers";

interface DesktopUserSummary {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

interface DesktopTopbarProps {
  user: DesktopUserSummary | null | undefined;
  selectedRange: TimelineRange;
  rangeOptions: RangeOption[];
  onRangeChange: (range: TimelineRange) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

export function DesktopTopbar({
  user,
  selectedRange,
  rangeOptions,
  onRangeChange,
  onOpenSearch,
  onOpenSettings,
}: DesktopTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="desktop-app-topbar">
      <button type="button" className="desktop-search-button" onClick={onOpenSearch}>
        <span className="desktop-search-left">
          <SearchIcon size={18} />
          <span>Search toats, people, places...</span>
        </span>
        <span className="desktop-keycap">⌘ K</span>
      </button>

      <div className="desktop-range-menu-wrap">
        <button
          type="button"
          className="desktop-range-pill"
          aria-label="Choose timeline range"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <CalendarIcon size={16} />
          <span>{formatRangePillLabel(selectedRange, rangeOptions)}</span>
          <CaretDownIcon size={14} />
        </button>
        {menuOpen && (
          <div className="desktop-range-menu" role="menu">
            {rangeOptions.map((option) => {
              const selected = rangeEquals(option.value, selectedRange);
              return (
                <button
                  key={option.key}
                  type="button"
                  role="menuitem"
                  className={`desktop-range-item${selected ? " active" : ""}`}
                  onClick={() => {
                    onRangeChange(option.value);
                    setMenuOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  <small>{option.meta}</small>
                </button>
              );
            })}
          </div>
        )}
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
