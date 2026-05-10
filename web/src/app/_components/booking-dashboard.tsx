"use client";

import { useRouter } from "next/navigation";
import { SearchIcon, UserAvatar } from "@/components/mobile-ui";
import { DesktopAppSidebar } from "@/app/timeline/_components/desktop/DesktopAppSidebar";
import { desktopTimelineCss } from "@/app/timeline/_components/desktop/desktop.css";
import { BellIcon, CaretDownIcon, FilterIcon } from "@/app/timeline/_components/desktop/desktop-icons";
import { DesktopPageIntro } from "@/app/_components/desktop-page-intro";

export type BookingRequestState = "pending" | "accepted" | "denied";

export interface BookingRequestItem {
  id: string;
  toatId: string | null;
  title: string;
  slotStart: string;
  slotEnd: string;
  name: string;
  email: string;
  phone: string | null;
  bookerHandle: string | null;
  message: string | null;
  state: BookingRequestState;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardUser {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

interface DashboardShellProps {
  user: DashboardUser | null | undefined;
  active: "inbox" | "bookings" | "people" | "settings" | "help";
  inboxCount: number;
  bookingCount: number;
  pageTitle: string;
  pageSubtitle: string;
  children: React.ReactNode;
  onCapture: () => void;
}

export function BookingDashboardShell({ user, active, inboxCount, bookingCount, pageTitle, pageSubtitle, children, onCapture }: DashboardShellProps) {
  const router = useRouter();

  return (
    <div className="desktop-timeline-page booking-dashboard-page">
      <style>{desktopTimelineCss}</style>
      <style>{bookingDashboardCss}</style>
      <DesktopAppSidebar
        toatsTotal={0}
        inboxCount={inboxCount}
        bookingCount={bookingCount}
        active={active}
        onOpenTimeline={() => router.push("/timeline")}
        onOpenInbox={() => router.push("/inbox")}
        onOpenBookings={() => router.push("/bookings")}
        onOpenPeople={() => router.push("/people")}
        onOpenSettings={() => router.push("/settings")}
        onOpenHelp={() => router.push("/help")}
      />
      <main className="desktop-app-main booking-dashboard-main">
        <header className="desktop-app-topbar booking-app-topbar">
          <button type="button" className="desktop-search-button" onClick={() => router.push("/timeline?search=1")}>
            <span className="desktop-search-left">
              <SearchIcon size={18} />
              <span>Search toats, people, places...</span>
            </span>
            <span className="desktop-keycap">⌘ K</span>
          </button>
          <div className="booking-app-spacer" aria-hidden />
          <div className="desktop-topbar-right booking-top-actions">
            <button type="button" className="booking-capture-button" onClick={onCapture}><PlusIcon /> Capture toat</button>
            <button type="button" className="desktop-bell-button" aria-label="Open Pings"><BellIcon /><span>{inboxCount}</span></button>
            <button type="button" className="desktop-user-button" onClick={() => router.push("/settings")} aria-label="Open profile settings">
              <UserAvatar user={user} />
              <CaretDownIcon size={15} />
            </button>
          </div>
        </header>
        <DesktopPageIntro title={pageTitle} subtitle={pageSubtitle} />
        {children}
      </main>
    </div>
  );
}

export function RequestAvatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "?";
  return <span className="request-avatar">{initials}</span>;
}

export function RequestStatusPill({ request, completed = false }: { request: BookingRequestItem; completed?: boolean }) {
  const label = request.state === "pending" ? "Pending" : request.state === "denied" ? "Declined" : completed ? "Completed" : "Scheduled";
  return <span className={`request-status ${label.toLowerCase()}`}>{label}</span>;
}

export function formatClock(iso: string): { time: string; period: string } {
  const date = new Date(iso);
  const [time, period = ""] = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).split(" ");
  return { time, period };
}

export function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diff / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function PlusIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

export const bookingDashboardCss = `
  .booking-dashboard-page { background: #ffffff; color: #0d1235; }
  .booking-dashboard-main { min-width: 0; display: grid; grid-template-rows: 92px auto minmax(0, 1fr); }
  .booking-app-topbar { grid-template-columns: minmax(260px, 396px) minmax(240px, 1fr) auto; }
  .booking-app-spacer { min-width: 0; }
  .booking-top-actions { display: flex; align-items: center; gap: 16px; }
  .booking-capture-button { min-height: 48px; padding: 0 22px; border-radius: 12px; border: 1px solid #e2e5ef; background: #fff; color: #5b2dff; display: inline-flex; align-items: center; gap: 12px; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
  .booking-bell-button { position: relative; width: 48px; height: 48px; border-radius: 12px; border: 1px solid #e2e5ef; background: #fff; color: #1a2445; display: grid; place-items: center; cursor: pointer; }
  .booking-bell-button span { position: absolute; right: 11px; top: 10px; width: 8px; height: 8px; border-radius: 999px; background: #5b2dff; box-shadow: 0 0 0 2px #fff; }
  .booking-dashboard-content { min-width: 0; display: grid; grid-template-columns: minmax(460px, 1fr) minmax(440px, 0.96fr); }
  .booking-panel { min-width: 0; padding: 12px 34px 32px; }
  .booking-panel + .booking-panel { border-left: 1px solid #e9ebf4; }
  .booking-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
  .booking-panel-meta { min-height: 40px; display: inline-flex; align-items: center; gap: 10px; color: #66708f; font-size: 13px; font-weight: 700; }
  .booking-panel-meta strong { color: #0d1235; font-size: 15px; font-weight: 850; }
  .booking-panel-count { min-width: 24px; height: 24px; border-radius: 999px; display: inline-grid; place-items: center; background: #f0eaff; color: #5b2dff; font-size: 12px; font-weight: 850; }
  .booking-panel-actions { display: flex; align-items: center; gap: 12px; }
  .booking-small-button { min-height: 40px; border-radius: 9px; border: 1px solid #e4e7f0; background: #fff; color: #5b2dff; display: inline-flex; align-items: center; justify-content: center; gap: 9px; padding: 0 16px; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; }
  .booking-icon-button { width: 40px; height: 40px; border-radius: 9px; border: 1px solid #e4e7f0; background: #fff; color: #52607e; display: grid; place-items: center; cursor: pointer; }
  .request-list { display: grid; gap: 10px; }
  .request-card { position: relative; min-height: 91px; border: 1px solid #e4e7f0; border-radius: 12px; background: #fff; padding: 15px 14px; display: grid; grid-template-columns: 52px minmax(0, 1fr) auto; gap: 14px; align-items: center; box-shadow: 0 12px 30px rgba(20, 25, 58, 0.025); }
  .request-card::before { content: ""; position: absolute; left: -5px; top: 50%; width: 7px; height: 7px; border-radius: 999px; background: #5b2dff; transform: translateY(-50%); opacity: 0; }
  .request-card.unread::before { opacity: 1; }
  .request-avatar, .booking-type-icon { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; background: linear-gradient(135deg, #ffe7c4, #f8c8a7); color: #9b5b23; font-size: 14px; font-weight: 850; overflow: hidden; }
  .request-copy { min-width: 0; display: grid; gap: 7px; }
  .request-copy strong { font-size: 14px; font-weight: 850; color: #0d1235; }
  .request-copy p { margin: 0; font-size: 13px; line-height: 1.35; color: #0d1235; }
  .request-meta { display: flex; align-items: center; gap: 18px; color: #687492; font-size: 12px; font-weight: 650; flex-wrap: wrap; }
  .request-meta span { display: inline-flex; align-items: center; gap: 6px; }
  .request-age { align-self: start; color: #8a92aa; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .request-actions { display: flex; align-items: center; gap: 10px; grid-column: 3; }
  .request-actions button, .request-actions a { min-width: 66px; min-height: 34px; border-radius: 8px; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; box-sizing: border-box; }
  .decline-button { border: 1px solid #e1e5ef; background: #fff; color: #52607e; }
  .accept-button { border: 0; background: linear-gradient(135deg, #6942ff, #5428e8); color: #fff; box-shadow: 0 10px 20px rgba(91, 45, 255, 0.20); }
  .shared-avatar { background: linear-gradient(135deg, #efe9ff, #f8f5ff); color: #5b2dff; }
  .shared-toat-card { grid-template-columns: 52px minmax(0, 1fr) auto auto; }
  .inbox-open-link { padding: 0 16px; }
  .request-actions button:disabled { opacity: 0.55; cursor: not-allowed; }
  .booking-section-label { margin: 24px 0 12px; color: #5b2dff; font-size: 13px; font-weight: 850; }
  .booking-section-label:first-child { margin-top: 0; }
  .booking-row { min-height: 92px; border: 1px solid #e4e7f0; border-radius: 12px; background: #fff; padding: 14px 16px; display: grid; grid-template-columns: 52px 68px minmax(0, 1fr) auto 28px; align-items: center; gap: 14px; box-shadow: 0 12px 30px rgba(20, 25, 58, 0.025); }
  .booking-time { text-align: center; color: #0d1235; font-weight: 850; }
  .booking-time strong { display: block; font-size: 20px; line-height: 1; }
  .booking-time span { display: block; margin-top: 5px; font-size: 12px; color: #66708f; }
  .booking-copy { min-width: 0; display: grid; gap: 7px; }
  .booking-copy strong { color: #0d1235; font-size: 14px; font-weight: 850; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .booking-copy span { color: #66708f; font-size: 12px; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .request-status { min-height: 22px; border-radius: 6px; padding: 0 9px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 850; }
  .request-status.completed { color: #24843d; background: #e7f8ea; }
  .request-status.scheduled { color: #425dff; background: #edf1ff; }
  .request-status.pending { color: #9a6500; background: #fff4d8; }
  .request-status.declined { color: #b42318; background: #fff1f0; }
  .booking-more { border: 0; background: transparent; color: #52607e; font-size: 20px; cursor: pointer; }
  .booking-empty { min-height: 220px; border: 1px dashed #dfe4ef; border-radius: 14px; display: grid; place-items: center; text-align: center; padding: 34px; color: #66708f; }
  .booking-empty strong { display: block; color: #0d1235; margin-bottom: 8px; }
  .booking-notice { border: 1px solid #d8ceff; background: #f6f2ff; color: #4d2bd0; border-radius: 11px; padding: 12px 14px; font-size: 13px; font-weight: 750; margin-bottom: 16px; }
  @media (max-width: 1180px) { .booking-dashboard-page { grid-template-columns: 220px minmax(0, 1fr); } .booking-dashboard-content { grid-template-columns: 1fr; } .booking-panel + .booking-panel { border-left: 0; border-top: 1px solid #e9ebf4; } }
`;

export function FilterButton({ children }: { children: React.ReactNode }) {
  return <button type="button" className="booking-small-button">{children}<CaretDownIcon size={14} /></button>;
}

export function IconFilterButton() {
  return <button type="button" className="booking-icon-button" aria-label="Filter"><FilterIcon /></button>;
}
