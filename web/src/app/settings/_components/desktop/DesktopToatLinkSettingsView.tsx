"use client";

import { desktopToatLinkSettingsCss } from "./desktop-booking.css";
import { DesktopBookingHeader } from "./DesktopBookingHeader";
import { DesktopBookingSidebar } from "./DesktopBookingSidebar";
import { DesktopGreetingSection } from "./DesktopGreetingSection";
import { DesktopAvailabilitySection } from "./DesktopAvailabilitySection";
import { DesktopBookingSection } from "./DesktopBookingSection";
import { DesktopPostBookingSection } from "./DesktopPostBookingSection";
import { DesktopAppearanceSection } from "./DesktopAppearanceSection";
import { DesktopExtraSection } from "./DesktopExtraSection";
import { DesktopPreviewPanel } from "./DesktopPreviewPanel";

type BookingSlotLength = 15 | 30 | 45 | 60;

interface DesktopAvatarUser {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

export interface DesktopToatLinkSettingsViewProps {
  user: DesktopAvatarUser | null | undefined;
  displayName: string;
  handleValue: string;
  toatLinkUrl: string | null;
  bookingEnabled: boolean;
  bookingGreetingMessage: string;
  bookingWindowDays: number[];
  bookingTimezone: string;
  timezoneOptions: string[];
  bookingWindowStart: string;
  bookingWindowEnd: string;
  bookingSlotLength: BookingSlotLength;
  bookingBuffer: number;
  bookingAdvance: number;
  bookingMaxDays: number;
  bookingMaxPerDay: number;
  bookingAllowRescheduling: boolean;
  bookingAllowCancellations: boolean;
  bookingRequireReason: boolean;
  bookingDisableDuringOfficeHours: boolean;
  bookingShowSuccessMessage: boolean;
  bookingRedirectAfterBooking: boolean;
  bookingRedirectUrl: string;
  bookingAddReasonToCalendar: boolean;
  bookingAccentColor: string;
  bookingPageTitle: string;
  bookingMetaDescription: string;
  bookingCollectEmailFirst: boolean;
  bookingHideFromSearch: boolean;
  bookingPasswordProtect: boolean;
  bookingUtmParams: boolean;
  savingBooking: boolean;
  loadingBooking: boolean;
  onCopyLink: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
  onGreetingMessageChange: (value: string) => void;
  onToggleWindowDay: (dayValue: number) => void;
  onTimezoneChange: (value: string) => void;
  onWindowStartChange: (value: string) => void;
  onWindowEndChange: (value: string) => void;
  onSlotLengthChange: (value: BookingSlotLength) => void;
  onBufferChange: (value: number) => void;
  onAdvanceChange: (value: number) => void;
  onMaxDaysChange: (value: number) => void;
  onMaxPerDayChange: (value: number) => void;
  onAllowReschedulingChange: (value: boolean) => void;
  onAllowCancellationsChange: (value: boolean) => void;
  onRequireReasonChange: (value: boolean) => void;
  onDisableDuringOfficeHoursChange: (value: boolean) => void;
  onShowSuccessMessageChange: (value: boolean) => void;
  onRedirectAfterBookingChange: (value: boolean) => void;
  onRedirectUrlChange: (value: string) => void;
  onAddReasonToCalendarChange: (value: boolean) => void;
  onAccentColorChange: (value: string) => void;
  onPageTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onCollectEmailFirstChange: (value: boolean) => void;
  onHideFromSearchChange: (value: boolean) => void;
  onPasswordProtectChange: (value: boolean) => void;
  onUtmParamsChange: (value: boolean) => void;
}

export function DesktopToatLinkSettingsView(props: DesktopToatLinkSettingsViewProps) {
  const {
    user, displayName, handleValue, toatLinkUrl,
    bookingGreetingMessage, bookingWindowDays, bookingTimezone, timezoneOptions,
    bookingWindowStart, bookingWindowEnd, bookingSlotLength, bookingBuffer,
    bookingAdvance, bookingMaxDays, bookingMaxPerDay,
    bookingAllowRescheduling, bookingAllowCancellations, bookingRequireReason, bookingDisableDuringOfficeHours,
    bookingShowSuccessMessage, bookingRedirectAfterBooking, bookingRedirectUrl, bookingAddReasonToCalendar,
    bookingAccentColor, bookingPageTitle, bookingMetaDescription,
    bookingCollectEmailFirst, bookingHideFromSearch, bookingPasswordProtect, bookingUtmParams,
    savingBooking, loadingBooking,
    onCopyLink, onSave,
    onGreetingMessageChange, onToggleWindowDay, onTimezoneChange, onWindowStartChange, onWindowEndChange,
    onSlotLengthChange, onBufferChange, onAdvanceChange, onMaxDaysChange, onMaxPerDayChange,
    onAllowReschedulingChange, onAllowCancellationsChange, onRequireReasonChange, onDisableDuringOfficeHoursChange,
    onShowSuccessMessageChange, onRedirectAfterBookingChange, onRedirectUrlChange, onAddReasonToCalendarChange,
    onAccentColorChange, onPageTitleChange, onMetaDescriptionChange,
    onCollectEmailFirstChange, onHideFromSearchChange, onPasswordProtectChange, onUtmParamsChange,
  } = props;

  const jumpToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="desktop-booking-settings-page">
      <style>{desktopToatLinkSettingsCss}</style>

      <DesktopBookingHeader toatLinkUrl={toatLinkUrl} onCopyLink={onCopyLink} />

      <main className="desktop-booking-shell">
        <DesktopBookingSidebar
          user={user}
          displayName={displayName}
          handleValue={handleValue}
          toatLinkUrl={toatLinkUrl}
          onJumpToSection={jumpToSection}
        />

        <section className="desktop-booking-main">
          <section className="desktop-settings-card desktop-settings-hero">
            <div>
              <h1>Your personal booking page</h1>
              <p>Share your link so others can request time with you.</p>
            </div>
            <div className="desktop-link-field">
              <span>{toatLinkUrl ?? "Create a handle in General settings to enable your public link."}</span>
              <button type="button" onClick={() => void onCopyLink()} disabled={!toatLinkUrl}>Copy</button>
            </div>
          </section>

          <DesktopGreetingSection
            bookingGreetingMessage={bookingGreetingMessage}
            onGreetingMessageChange={onGreetingMessageChange}
          />

          <DesktopAvailabilitySection
            bookingWindowDays={bookingWindowDays}
            bookingWindowStart={bookingWindowStart}
            bookingWindowEnd={bookingWindowEnd}
            bookingSlotLength={bookingSlotLength}
            bookingTimezone={bookingTimezone}
            timezoneOptions={timezoneOptions}
            bookingBuffer={bookingBuffer}
            onToggleWindowDay={onToggleWindowDay}
            onWindowStartChange={onWindowStartChange}
            onWindowEndChange={onWindowEndChange}
            onSlotLengthChange={onSlotLengthChange}
            onTimezoneChange={onTimezoneChange}
            onBufferChange={onBufferChange}
          />

          <DesktopBookingSection
            bookingAdvance={bookingAdvance}
            bookingMaxDays={bookingMaxDays}
            bookingMaxPerDay={bookingMaxPerDay}
            bookingAllowRescheduling={bookingAllowRescheduling}
            bookingAllowCancellations={bookingAllowCancellations}
            bookingRequireReason={bookingRequireReason}
            bookingDisableDuringOfficeHours={bookingDisableDuringOfficeHours}
            onAdvanceChange={onAdvanceChange}
            onMaxDaysChange={onMaxDaysChange}
            onMaxPerDayChange={onMaxPerDayChange}
            onAllowReschedulingChange={onAllowReschedulingChange}
            onAllowCancellationsChange={onAllowCancellationsChange}
            onRequireReasonChange={onRequireReasonChange}
            onDisableDuringOfficeHoursChange={onDisableDuringOfficeHoursChange}
          />

          <DesktopPostBookingSection
            bookingShowSuccessMessage={bookingShowSuccessMessage}
            bookingRedirectAfterBooking={bookingRedirectAfterBooking}
            bookingRedirectUrl={bookingRedirectUrl}
            bookingAddReasonToCalendar={bookingAddReasonToCalendar}
            onShowSuccessMessageChange={onShowSuccessMessageChange}
            onRedirectAfterBookingChange={onRedirectAfterBookingChange}
            onRedirectUrlChange={onRedirectUrlChange}
            onAddReasonToCalendarChange={onAddReasonToCalendarChange}
          />

          <DesktopAppearanceSection
            user={user}
            bookingAccentColor={bookingAccentColor}
            bookingPageTitle={bookingPageTitle}
            bookingMetaDescription={bookingMetaDescription}
            onAccentColorChange={onAccentColorChange}
            onPageTitleChange={onPageTitleChange}
            onMetaDescriptionChange={onMetaDescriptionChange}
          />

          <DesktopExtraSection
            bookingCollectEmailFirst={bookingCollectEmailFirst}
            bookingHideFromSearch={bookingHideFromSearch}
            bookingPasswordProtect={bookingPasswordProtect}
            bookingUtmParams={bookingUtmParams}
            onCollectEmailFirstChange={onCollectEmailFirstChange}
            onHideFromSearchChange={onHideFromSearchChange}
            onPasswordProtectChange={onPasswordProtectChange}
            onUtmParamsChange={onUtmParamsChange}
          />

          <footer className="desktop-settings-footer">
            <button
              type="button"
              className="desktop-save-button"
              onClick={() => void onSave()}
              disabled={savingBooking || loadingBooking}
            >
              {savingBooking ? "Saving…" : "Save Toat Link settings"}
            </button>
            <span className="desktop-autosave-note">● All changes are saved automatically</span>
          </footer>
        </section>

        <DesktopPreviewPanel
          user={user}
          displayName={displayName}
          bookingGreetingMessage={bookingGreetingMessage}
          bookingSlotLength={bookingSlotLength}
          bookingTimezone={bookingTimezone}
        />
      </main>
    </div>
  );
}
