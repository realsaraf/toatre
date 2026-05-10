"use client";

import { UserAvatar } from "@/components/mobile-ui";

interface DesktopAvatarUser {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

interface DesktopBookingSidebarProps {
  user: DesktopAvatarUser | null | undefined;
  displayName: string;
  handleValue: string;
  toatLinkUrl: string | null;
  onJumpToSection: (id: string) => void;
}

export function DesktopBookingSidebar({
  user,
  displayName,
  handleValue,
  toatLinkUrl,
  onJumpToSection,
}: DesktopBookingSidebarProps) {
  return (
    <aside className="desktop-booking-sidebar">
      <div className="dts-sidebar-profile">
        <div className="dts-sidebar-avatar">
          <UserAvatar user={user} />
        </div>
        <strong>{displayName}</strong>
        <span>@{handleValue.replace(/^@/, "")}</span>
      </div>

      <nav className="desktop-settings-nav">
        <span className="dts-nav-label">CORE SETTINGS</span>
        <button type="button" className="active" onClick={() => onJumpToSection("desktop-toatlink-greeting")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Toat Link
        </button>
        <button type="button" onClick={() => onJumpToSection("desktop-toatlink-availability")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Availability
        </button>
        <button type="button" onClick={() => onJumpToSection("desktop-toatlink-booking")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Booking Flow
        </button>
        <button type="button" onClick={() => onJumpToSection("desktop-toatlink-appearance")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 21.35l7.65-8.34.77-.78a5.4 5.4 0 0 0 0-7.65z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          Appearance
        </button>
        <span className="dts-nav-label">ADDITIONAL</span>
        <button type="button" onClick={() => onJumpToSection("desktop-toatlink-extra")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Advanced
          <span className="dts-pro-badge">Pro</span>
        </button>
      </nav>

      <div className="dts-help-card">
        <span className="dts-help-icon">✦</span>
        <div>
          <strong>Need help?</strong>
          <p>Use AI to setup or optimize your Toatre.</p>
        </div>
        <button type="button" className="dts-ask-ai-btn">Ask AI</button>
      </div>

      <a href={toatLinkUrl ?? "#"} target="_blank" rel="noreferrer" className="dts-view-link">
        View your Toat Link
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M7 17L17 7M7 7h10v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </aside>
  );
}
