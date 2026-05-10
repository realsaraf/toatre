"use client";

import { DesktopToggle } from "./DesktopToggle";

interface DesktopBookingSectionProps {
  bookingAdvance: number;
  bookingMaxDays: number;
  bookingMaxPerDay: number;
  bookingAllowRescheduling: boolean;
  bookingAllowCancellations: boolean;
  bookingRequireReason: boolean;
  bookingDisableDuringOfficeHours: boolean;
  onAdvanceChange: (value: number) => void;
  onMaxDaysChange: (value: number) => void;
  onMaxPerDayChange: (value: number) => void;
  onAllowReschedulingChange: (value: boolean) => void;
  onAllowCancellationsChange: (value: boolean) => void;
  onRequireReasonChange: (value: boolean) => void;
  onDisableDuringOfficeHoursChange: (value: boolean) => void;
}

export function DesktopBookingSection({
  bookingAdvance,
  bookingMaxDays,
  bookingMaxPerDay,
  bookingAllowRescheduling,
  bookingAllowCancellations,
  bookingRequireReason,
  bookingDisableDuringOfficeHours,
  onAdvanceChange,
  onMaxDaysChange,
  onMaxPerDayChange,
  onAllowReschedulingChange,
  onAllowCancellationsChange,
  onRequireReasonChange,
  onDisableDuringOfficeHoursChange,
}: DesktopBookingSectionProps) {
  return (
    <section className="desktop-settings-card" id="desktop-toatlink-booking">
      <div className="desktop-card-head">
        <div>
          <h2>Booking settings</h2>
          <p>Define how bookings work on your page.</p>
        </div>
      </div>

      <div className="desktop-three-column-grid">
        <label>
          <span>Minimum notice</span>
          <select value={bookingAdvance} onChange={(event) => onAdvanceChange(Number(event.target.value))}>
            {[0, 15, 30, 60, 120, 240, 720, 1440].map((value) => (
              <option key={value} value={value}>{value >= 60 ? `${value / 60} hour${value === 60 ? "" : "s"}` : `${value} min`}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Maximum days in advance</span>
          <select value={bookingMaxDays} onChange={(event) => onMaxDaysChange(Number(event.target.value))}>
            {[7, 14, 21, 30, 45, 60, 90].map((value) => (
              <option key={value} value={value}>{value} days</option>
            ))}
          </select>
        </label>
        <label>
          <span>Maximum bookings per day</span>
          <select value={bookingMaxPerDay} onChange={(event) => onMaxPerDayChange(Number(event.target.value))}>
            {[3, 5, 8, 10, 12, 15].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="desktop-toggle-grid">
        <DesktopToggle checked={bookingAllowRescheduling} onChange={onAllowReschedulingChange} title="Allow rescheduling" description="Let people reschedule their booking" />
        <DesktopToggle checked={bookingAllowCancellations} onChange={onAllowCancellationsChange} title="Allow cancellations" description="Let people cancel their booking" />
        <DesktopToggle checked={bookingRequireReason} onChange={onRequireReasonChange} title="Require reason for booking" description="Ask for a reason when booking" />
        <DesktopToggle checked={bookingDisableDuringOfficeHours} onChange={onDisableDuringOfficeHoursChange} title="Disable during office hours" description="Use your General work hours to block requests" />
      </div>
    </section>
  );
}
