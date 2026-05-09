"use client";

import { AppBrand, InboxIcon, PeopleIcon, TimelineIcon } from "@/components/mobile-ui";
import { BookingIcon, ExternalLinkIcon, GearIcon, HelpIcon, LinkIcon } from "./desktop-icons";
import { SidebarNavButton } from "./SidebarNavButton";

interface DesktopAppSidebarProps {
  toatsTotal: number;
  bookingCount: number;
  onOpenTimeline: () => void;
  onOpenInbox: () => void;
  onOpenPeople: () => void;
  onOpenSettings: () => void;
}

export function DesktopAppSidebar({
  toatsTotal,
  bookingCount,
  onOpenTimeline,
  onOpenInbox,
  onOpenPeople,
  onOpenSettings,
}: DesktopAppSidebarProps) {
  const weeklyLimit = 20;
  const weeklyUsed = Math.min(toatsTotal, weeklyLimit);
  const progress = Math.min(100, Math.round((weeklyUsed / weeklyLimit) * 100));

  return (
    <aside className="desktop-app-sidebar">
      <div className="desktop-app-brand-wrap">
        <AppBrand />
      </div>

      <div className="desktop-sidebar-group">
        <SidebarNavButton label="Timeline" active onClick={onOpenTimeline} icon={<TimelineIcon size={18} />} />
        <SidebarNavButton
          label="Inbox"
          onClick={onOpenInbox}
          icon={<InboxIcon size={18} />}
          badge={bookingCount > 0 ? bookingCount : 3}
        />
        <SidebarNavButton label="People" onClick={onOpenPeople} icon={<PeopleIcon size={18} />} />
      </div>

      <div className="desktop-sidebar-section">
        <span className="desktop-sidebar-heading">Shared Links</span>
        <div className="desktop-sidebar-link muted">
          <span className="desktop-sidebar-mini-icon"><LinkIcon size={16} /></span>
          <span>Toatre Link</span>
        </div>
        <div className="desktop-sidebar-link muted">
          <span className="desktop-sidebar-mini-icon"><BookingIcon size={16} /></span>
          <span>Bookings</span>
          <span className="desktop-sidebar-count">{bookingCount > 0 ? bookingCount : 7}</span>
        </div>
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
        <SidebarNavButton label="Settings" onClick={onOpenSettings} icon={<GearIcon />} compact />
        <SidebarNavButton
          label="Help & feedback"
          onClick={() => window.location.assign("mailto:help@toatre.com")}
          icon={<HelpIcon />}
          compact
        />
      </div>
    </aside>
  );
}
