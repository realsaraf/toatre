import type { UseSettingsResult } from "../../_hooks/useSettings";
import { iosStyles, SettingsGroup, SettingsRow, ToggleRow } from "./SettingsIOS";

export function GeneralSubpage(props: UseSettingsResult) {
  return (
    <div style={iosStyles.stack}>
      <SettingsGroup>
        <SettingsRow title="Language" value="English" />
        <SettingsRow title="Time zone" control={<select value={props.timezone} onChange={(event) => props.setTimezone(event.target.value)} style={iosStyles.select}>{props.timezoneOptions.map((option) => <option key={option}>{option}</option>)}</select>} />
        <SettingsRow title="Work start" control={<input type="time" value={props.workStart} onChange={(event) => props.setWorkStart(event.target.value)} style={iosStyles.input} />} />
        <SettingsRow title="Work end" control={<input type="time" value={props.workEnd} onChange={(event) => props.setWorkEnd(event.target.value)} style={iosStyles.input} />} />
        <SettingsRow title="Date & time format" value={new Date().toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })} />
        <SettingsRow title="Default duration" value={`${props.bookingSlotLength} minutes`} />
        <SettingsRow title="Start week on" value="Monday" />
        <ToggleRow title="Keep voice audio" body="Store voice audio for review and debugging." checked={props.voiceRetention} onChange={props.setVoiceRetention} last />
      </SettingsGroup>

      <button type="button" style={iosStyles.button} onClick={() => void props.saveProfile()} disabled={props.savingKey === "profile"}>
        {props.savingKey === "profile" ? "Saving..." : "Save general settings"}
      </button>
    </div>
  );
}