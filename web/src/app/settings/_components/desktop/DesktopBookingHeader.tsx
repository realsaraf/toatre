"use client";

interface DesktopBookingHeaderProps {
  toatLinkUrl: string | null;
  onCopyLink: () => void | Promise<void>;
}

export function DesktopBookingHeader({ toatLinkUrl, onCopyLink }: DesktopBookingHeaderProps) {
  return (
    <header className="desktop-booking-header">
      <div className="dts-header-title">
        <h1>Toatre Link</h1>
        <p>Manage your public booking page and how people see you.</p>
      </div>
      <div className="desktop-booking-header-actions">
        <span className="dts-saved-pill">● All changes saved</span>
        <button
          type="button"
          className="dts-preview-btn"
          onClick={() => { if (toatLinkUrl) window.open(toatLinkUrl, "_blank"); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          Preview
        </button>
        <button type="button" className="dts-share-btn" onClick={() => void onCopyLink()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          Share
        </button>
      </div>
    </header>
  );
}
