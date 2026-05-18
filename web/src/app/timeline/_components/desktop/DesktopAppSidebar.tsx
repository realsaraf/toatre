"use client";

import { AppBrand, InboxIcon, PeopleIcon, TimelineIcon } from "@/components/mobile-ui";
import { BookingIcon, ExternalLinkIcon, GearIcon, HelpIcon } from "./desktop-icons";
import { SidebarNavButton } from "./SidebarNavButton";

interface DesktopAppSidebarProps {
  toatsTotal: number;
  inboxCount?: number;
  bookingCount: number;
  active?: "timeline" | "inbox" | "people" | "bookings" | "settings" | "help";
  onOpenTimeline: () => void;
  onOpenInbox: () => void;
  onOpenPeople: () => void;
  onOpenSettings: () => void;
  onOpenBookings: () => void;
  onOpenHelp?: () => void;
}

export function DesktopAppSidebar({
  toatsTotal,
  inboxCount,
  bookingCount,
  active = "timeline",
  onOpenTimeline,
  onOpenInbox,
  onOpenPeople,
  onOpenSettings,
  onOpenBookings,
  onOpenHelp = () => window.location.assign("mailto:help@toatre.com"),
}: DesktopAppSidebarProps) {
  const weeklyLimit = 20;
  const weeklyUsed = Math.min(toatsTotal, weeklyLimit);
  const progress = Math.min(100, Math.round((weeklyUsed / weeklyLimit) * 100));

  return (
    <aside className="desktop-app-sidebar">
      <div className="desktop-app-brand-wrap">
        <AppBrand dark />
      </div>

      <div className="desktop-sidebar-group">
        <SidebarNavButton label="Timeline" active={active === "timeline"} onClick={onOpenTimeline} icon={<TimelineIcon size={18} />} />
        <SidebarNavButton
          label="Inbox"
          active={active === "inbox"}
          onClick={onOpenInbox}
          icon={<InboxIcon size={18} />}
          badge={(inboxCount ?? 0) > 0 ? inboxCount : undefined}
        />
        <SidebarNavButton
          label="Bookings"
          active={active === "bookings"}
          onClick={onOpenBookings}
          icon={<BookingIcon size={18} />}
          badge={bookingCount > 0 ? bookingCount : undefined}
        />
        <SidebarNavButton label="People" active={active === "people"} onClick={onOpenPeople} icon={<PeopleIcon size={18} />} />
      </div>

      <div className="desktop-link-card">
        <span>Your Toatre Link</span>
        <strong>toatre.com/saraf</strong>
        <ExternalLinkIcon size={15} />
      </div>

      <div className="desktop-usage-card">
        <span>This week</span>
        <strong>{weeklyUsed} / {weeklyLimit} toats used</strong>
        <div className="desktop-usage-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="desktop-sidebar-footer">
        <SidebarNavButton label="Settings" active={active === "settings"} onClick={onOpenSettings} icon={<GearIcon />} compact />
        <SidebarNavButton
          label="Help & feedback"
          active={active === "help"}
          onClick={onOpenHelp}
          icon={<HelpIcon />}
          compact
        />
      </div>
    </aside>
  );
}
