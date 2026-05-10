import type { UseSettingsResult } from "../../_hooks/useSettings";
import { iosStyles, SettingsGroup, SettingsRow, ToggleRow } from "./SettingsIOS";

export function HandleSubpage(props: UseSettingsResult) {
  const link = props.toatLinkUrl ?? "toatre.com/handle";
  return (
    <div style={iosStyles.stack}>
      <SettingsGroup label="Your Toatre handle">
        <SettingsRow title={link} body="This is your unique link. People can book time with you using this link." value={props.bookingEnabled ? "Active" : "Off"} last />
      </SettingsGroup>

      <SettingsGroup label="Booking page">
        <ToggleRow title="Enable Toatre Link" body="Let others request time with you using your public handle page." checked={props.bookingEnabled} onChange={props.setBookingEnabled} />
        <SettingsRow title="Page title" control={<input value={props.bookingPageTitle} onChange={(event) => props.setBookingPageTitle(event.target.value)} style={iosStyles.input} />} />
        <SettingsRow title="Greeting" control={<input value={props.bookingGreetingMessage} onChange={(event) => props.setBookingGreetingMessage(event.target.value)} style={iosStyles.input} />} />
        <SettingsRow title="Description" control={<input value={props.bookingMetaDescription} onChange={(event) => props.setBookingMetaDescription(event.target.value)} style={iosStyles.input} />} />
        <SettingsRow title="Booking time zone" control={<select value={props.bookingTimezone} onChange={(event) => props.setBookingTimezone(event.target.value)} style={iosStyles.select}>{props.timezoneOptions.map((option) => <option key={option}>{option}</option>)}</select>} last />
      </SettingsGroup>

      <SettingsGroup label="Customize your link">
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0, 1fr) auto", alignItems: "center", gap: 8, minHeight: 54, padding: "0 12px", borderRadius: 16, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(99,102,241,0.12)" }}>
            <span style={iosStyles.value}>toatre.com/</span>
            <input value={props.handleDraft} onChange={(event) => props.setHandleDraft(event.target.value.replace(/^@+/, ""))} style={{ ...iosStyles.input, textAlign: "left" }} />
            <span style={{ color: "#22c55e", fontWeight: 900 }}>OK</span>
          </div>
          <p style={iosStyles.body}>You can change your handle once every 30 days.</p>
        </div>
      </SettingsGroup>

      <SettingsGroup label="Share your link">
        <SettingsRow title="Copy link" onClick={() => void props.copyToatLink()} />
        <SettingsRow title="Share link" onClick={() => void props.copyToatLink()} />
        <SettingsRow title="View my page" onClick={() => { if (props.toatLinkUrl) window.open(props.toatLinkUrl, "_blank"); }} last />
      </SettingsGroup>

      <button type="button" style={iosStyles.button} onClick={() => void props.saveHandle()} disabled={props.savingKey === "handle"}>
        {props.savingKey === "handle" ? "Saving..." : "Save handle"}
      </button>
      <button type="button" style={iosStyles.button} onClick={() => void props.saveBookingSettings()} disabled={props.savingBooking}>
        {props.savingBooking ? "Saving..." : "Save booking page"}
      </button>
    </div>
  );
}