import type { UseSettingsResult } from "../../_hooks/useSettings";
import type { SyncDirection } from "../../_utils/settings-helpers";
import { IntegrationRow, iosStyles, SettingsGroup, SettingsRow } from "./SettingsIOS";

export function IntegrationsSubpage(props: UseSettingsResult) {
  const calendarRows = [
    { title: "Google Calendar", email: props.email, connection: props.syncConnections.googleCalendar, connect: props.connectGoogleCalendar, disconnect: props.disconnectGoogleCalendar, run: props.runGoogleCalendarSync, direction: props.googleCalendarDirection, setDirection: props.setGoogleCalendarDirection, mark: "G" },
    { title: "Outlook Calendar", email: props.email, connection: props.syncConnections.microsoft, connect: props.connectMicrosoft, disconnect: props.disconnectMicrosoft, run: props.runMicrosoftSync, direction: props.microsoftDirection, setDirection: props.setMicrosoftDirection, mark: "O" },
  ];
  const appRows = [
    { title: "Zoom", connection: props.syncConnections.zoom, connect: props.connectZoom, disconnect: props.disconnectZoom, run: props.runZoomSync, direction: props.zoomDirection, setDirection: props.setZoomDirection, mark: "Z" },
    { title: "Calendly", connection: props.syncConnections.calendly, connect: props.connectCalendly, disconnect: props.disconnectCalendly, run: props.runCalendlySync, direction: props.calendlyDirection, setDirection: props.setCalendlyDirection, mark: "C" },
    { title: "Microsoft Teams", connection: props.syncConnections.microsoft, connect: props.connectMicrosoft, disconnect: props.disconnectMicrosoft, run: props.runMicrosoftSync, direction: props.microsoftDirection, setDirection: props.setMicrosoftDirection, mark: "T" },
  ];

  return (
    <div style={iosStyles.stack}>
      <SettingsGroup label="Connected calendars">
        {calendarRows.map((row, index) => <IntegrationRow key={row.title} {...row} last={index === calendarRows.length - 1} />)}
        {calendarRows.map((row) => <SyncControls key={`${row.title}-sync`} {...row} />)}
      </SettingsGroup>
      <SettingsGroup label="Meeting apps">
        {appRows.map((row, index) => <IntegrationRow key={row.title} {...row} last={index === appRows.length - 1} />)}
        {appRows.map((row) => <SyncControls key={`${row.title}-sync`} {...row} />)}
      </SettingsGroup>
      <p style={iosStyles.body}>Calendars and meeting apps help keep your availability up to date.</p>
    </div>
  );
}

function SyncControls({ title, direction, setDirection, run }: { title: string; direction: SyncDirection; setDirection: (value: SyncDirection) => void; run: () => Promise<void> }) {
  return (
    <SettingsRow
      title={`${title} sync`}
      control={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select value={direction} onChange={(event) => setDirection(event.target.value as SyncDirection)} style={iosStyles.select}>
            <option value="sourceToToatre">Source to Toatre</option>
            <option value="toatreToSource">Toatre to source</option>
            <option value="twoWay">Two-way</option>
          </select>
          <button type="button" onClick={() => void run()} style={{ ...iosStyles.button, minHeight: 34, padding: "0 10px" }}>
            Run
          </button>
        </span>
      }
    />
  );
}