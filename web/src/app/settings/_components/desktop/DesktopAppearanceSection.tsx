"use client";

import { UserAvatar } from "@/components/mobile-ui";

interface DesktopAvatarUser {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

interface DesktopAppearanceSectionProps {
  user: DesktopAvatarUser | null | undefined;
  bookingAccentColor: string;
  bookingPageTitle: string;
  bookingMetaDescription: string;
  onAccentColorChange: (value: string) => void;
  onPageTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
}

const ACCENT_COLORS = ["#6D49FF", "#5B8CFF", "#4FD1C5", "#61D276", "#F6C453", "#F97316", "#FB7185", "#94A3B8"];

export function DesktopAppearanceSection({
  user,
  bookingAccentColor,
  bookingPageTitle,
  bookingMetaDescription,
  onAccentColorChange,
  onPageTitleChange,
  onMetaDescriptionChange,
}: DesktopAppearanceSectionProps) {
  return (
    <section className="desktop-settings-card" id="desktop-toatlink-appearance">
      <div className="desktop-card-head">
        <div>
          <h2>Page customization</h2>
          <p>Make your page feel like you.</p>
        </div>
      </div>

      <div className="desktop-customization-grid">
        <div>
          <span className="desktop-field-title">Profile photo</span>
          <div className="desktop-photo-row">
            <div className="desktop-photo-chip"><UserAvatar user={user} /></div>
            <button type="button" className="ghost">Change</button>
          </div>
        </div>
        <div>
          <span className="desktop-field-title">Cover image (optional)</span>
          <div className="desktop-cover-card">
            <div className="desktop-cover-shape"></div>
            <button type="button" className="ghost overlay">Change</button>
          </div>
        </div>
        <div>
          <span className="desktop-field-title">Accent color</span>
          <div className="desktop-color-row">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`desktop-color-swatch${bookingAccentColor === color ? " active" : ""}`}
                style={{ background: color }}
                onClick={() => onAccentColorChange(color)}
                aria-label={`Use accent ${color}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="desktop-field-stack spaced-top">
        <label>
          <span>Page title</span>
          <input value={bookingPageTitle} onChange={(event) => onPageTitleChange(event.target.value)} />
        </label>
        <label>
          <span>Meta description</span>
          <textarea value={bookingMetaDescription} onChange={(event) => onMetaDescriptionChange(event.target.value)} rows={3} />
        </label>
      </div>
    </section>
  );
}
