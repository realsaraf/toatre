"use client";

import { UserAvatar } from "@/components/mobile-ui";

interface DesktopAvatarUser {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

interface DesktopPreviewPanelProps {
  user: DesktopAvatarUser | null | undefined;
  displayName: string;
  bookingGreetingMessage: string;
  bookingSlotLength: 15 | 30 | 45 | 60;
  bookingTimezone: string;
}

export function DesktopPreviewPanel({
  user,
  displayName,
  bookingGreetingMessage,
  bookingSlotLength,
  bookingTimezone,
}: DesktopPreviewPanelProps) {
  return (
    <aside className="dts-preview-panel">
      <div className="dts-preview-panel-head">
        <span>Preview of your Toat Link</span>
        <div className="dts-device-toggle">
          <button type="button" className="active" title="Desktop">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="2" y="4" width="20" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" title="Mobile">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="7" y="2" width="10" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="18" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
      <div className="dts-preview-mini">
        <div className="dts-preview-mini-banner" />
        <div className="dts-preview-mini-avatar">
          <UserAvatar user={user} />
        </div>
        <strong className="dts-preview-name">{displayName}</strong>
        {bookingGreetingMessage ? (
          <p className="dts-preview-bio">
            {bookingGreetingMessage.slice(0, 100)}
            {bookingGreetingMessage.length > 100 ? "…" : ""}
          </p>
        ) : null}
        <div className="dts-preview-meta">
          <span>⏱ {bookingSlotLength} min sessions</span>
          <span>🌐 {bookingTimezone.split("/").pop()?.replace(/_/g, " ") ?? bookingTimezone}</span>
        </div>
        <div className="dts-preview-book-section">
          <strong>Select a date and time</strong>
          <div className="dts-preview-date-row">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() + i);
              return d;
            }).map((d, i) => (
              <div key={i} className={`dts-mini-date${i === 0 ? " active" : ""}`}>
                <span>{d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3).toUpperCase()}</span>
                <strong>{d.getDate()}</strong>
              </div>
            ))}
          </div>
          <div className="dts-preview-slots">
            <span>9:00 AM</span>
            <span>9:30 AM</span>
            <span>10:00 AM</span>
            <span>10:30 AM</span>
            <span>11:00 AM</span>
            <a href="#" className="dts-preview-more">View more</a>
          </div>
        </div>
        <div className="dts-preview-powered">Powered by <strong>toatre</strong></div>
      </div>
      <div className="dts-help-cta">
        <span className="dts-help-cta-icon">✦</span>
        <div>
          <strong>Want faster setup?</strong>
          <p>Describe your availability in natural language.</p>
        </div>
        <button type="button" className="dts-share-btn small">Try AI setup</button>
      </div>
    </aside>
  );
}
