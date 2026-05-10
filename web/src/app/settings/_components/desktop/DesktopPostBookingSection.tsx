"use client";

import { DesktopToggle } from "./DesktopToggle";

interface DesktopPostBookingSectionProps {
  bookingShowSuccessMessage: boolean;
  bookingRedirectAfterBooking: boolean;
  bookingRedirectUrl: string;
  bookingAddReasonToCalendar: boolean;
  onShowSuccessMessageChange: (value: boolean) => void;
  onRedirectAfterBookingChange: (value: boolean) => void;
  onRedirectUrlChange: (value: string) => void;
  onAddReasonToCalendarChange: (value: boolean) => void;
}

export function DesktopPostBookingSection({
  bookingShowSuccessMessage,
  bookingRedirectAfterBooking,
  bookingRedirectUrl,
  bookingAddReasonToCalendar,
  onShowSuccessMessageChange,
  onRedirectAfterBookingChange,
  onRedirectUrlChange,
  onAddReasonToCalendarChange,
}: DesktopPostBookingSectionProps) {
  return (
    <section className="desktop-settings-card" id="desktop-toatlink-integrations">
      <div className="desktop-card-head compact">
        <div>
          <h2>What happens after booking</h2>
          <p>Customize the confirmation experience.</p>
        </div>
        <span className="desktop-pro-pill">Premium</span>
      </div>
      <div className="desktop-field-stack">
        <DesktopToggle
          checked={bookingShowSuccessMessage}
          onChange={onShowSuccessMessageChange}
          title="Show success message"
          description="Display a message after booking is confirmed"
        />
        <div className="desktop-inline-toggle-row">
          <DesktopToggle
            checked={bookingRedirectAfterBooking}
            onChange={onRedirectAfterBookingChange}
            title="Redirect to a custom link"
            description="Send people to a custom page after booking"
          />
          <input
            value={bookingRedirectUrl}
            onChange={(event) => onRedirectUrlChange(event.target.value)}
            placeholder="https://yourdomain.com/thank-you"
          />
        </div>
        <DesktopToggle
          checked={bookingAddReasonToCalendar}
          onChange={onAddReasonToCalendarChange}
          title="Add to reason automatically"
          description="Generate .ics file notes for the booked session"
        />
      </div>
    </section>
  );
}
