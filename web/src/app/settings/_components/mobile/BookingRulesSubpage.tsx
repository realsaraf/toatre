import type { UseSettingsResult } from "../../_hooks/useSettings";
import { iosStyles, SettingsGroup, SettingsNumberRow, SettingsRow, ToggleRow } from "./SettingsIOS";

export function BookingRulesSubpage(props: UseSettingsResult) {
  return (
    <div style={iosStyles.stack}>
      <SettingsGroup label="General">
        <SettingsNumberRow title="Minimum notice" body="Bookings can be made at least" value={props.bookingAdvance} suffix=" min" onChange={props.setBookingAdvance} />
        <SettingsNumberRow title="Maximum notice" body="Bookings can be made up to" value={props.bookingMaxDays} suffix=" days" onChange={props.setBookingMaxDays} />
        <SettingsRow
          title="Booking duration"
          body="Default duration for bookings"
          control={
            <select value={props.bookingSlotLength} onChange={(event) => props.setBookingSlotLength(Number(event.target.value) as UseSettingsResult["bookingSlotLength"])} style={iosStyles.select}>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          }
          last
        />
      </SettingsGroup>

      <SettingsGroup label="Limits">
        <SettingsNumberRow title="Daily booking limit" body="Maximum bookings per day" value={props.bookingMaxPerDay} suffix=" bookings" onChange={props.setBookingMaxPerDay} />
        <SettingsNumberRow title="Buffer time" body="Add time before and after bookings" value={props.bookingBuffer} suffix=" minutes" onChange={props.setBookingBuffer} last />
      </SettingsGroup>

      <SettingsGroup label="Other">
        <ToggleRow title="Allow back-to-back bookings" body="Let people book multiple times without gaps" checked={props.bookingBuffer === 0} onChange={(next) => props.setBookingBuffer(next ? 0 : 15)} last />
      </SettingsGroup>

      <SettingsGroup label="Visitor options">
        <ToggleRow title="Require reason" body="Ask visitors why they are requesting time with you." checked={props.bookingRequireReason} onChange={props.setBookingRequireReason} />
        <ToggleRow title="Disable during office hours" body="Block incoming bookings inside your defined work hours." checked={props.bookingDisableDuringOfficeHours} onChange={props.setBookingDisableDuringOfficeHours} />
        <ToggleRow title="Allow rescheduling" checked={props.bookingAllowRescheduling} onChange={props.setBookingAllowRescheduling} />
        <ToggleRow title="Allow cancellations" checked={props.bookingAllowCancellations} onChange={props.setBookingAllowCancellations} />
        <ToggleRow title="Show success message" checked={props.bookingShowSuccessMessage} onChange={props.setBookingShowSuccessMessage} />
        <ToggleRow title="Collect email first" checked={props.bookingCollectEmailFirst} onChange={props.setBookingCollectEmailFirst} last />
      </SettingsGroup>

      <button type="button" style={iosStyles.button} onClick={() => void props.saveBookingSettings()} disabled={props.savingBooking}>
        {props.savingBooking ? "Saving..." : "Save booking rules"}
      </button>
    </div>
  );
}