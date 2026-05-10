import type { UseSettingsResult } from "../../_hooks/useSettings";
import { formatTime, iosStyles, SettingsGroup, SettingsRow } from "./SettingsIOS";

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const orderedDays = [1, 2, 3, 4, 5, 6, 0];

export function AvailabilitySubpage(props: UseSettingsResult) {
  return (
    <div style={iosStyles.stack}>
      <SettingsGroup label="Weekly schedule">
        {orderedDays.map((dayValue, index) => (
          <SettingsRow
            key={dayValue}
            title={dayLabels[dayValue]}
            value={props.bookingWindowDays.includes(dayValue) ? `${formatTime(props.bookingWindowStart)} - ${formatTime(props.bookingWindowEnd)}` : "Closed"}
            onClick={() => props.toggleBookingWindowDay(dayValue)}
            last={index === orderedDays.length - 1}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup label="Booking hours">
        <SettingsRow title="Starts" control={<input type="time" value={props.bookingWindowStart} onChange={(event) => props.setBookingWindowStart(event.target.value)} style={iosStyles.input} />} />
        <SettingsRow title="Ends" control={<input type="time" value={props.bookingWindowEnd} onChange={(event) => props.setBookingWindowEnd(event.target.value)} style={iosStyles.input} />} last />
      </SettingsGroup>

      <button type="button" style={iosStyles.button} onClick={() => void props.saveBookingSettings()} disabled={props.savingBooking}>
        {props.savingBooking ? "Saving..." : "Save availability"}
      </button>
    </div>
  );
}