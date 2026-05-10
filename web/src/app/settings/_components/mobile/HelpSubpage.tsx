import { iosStyles, SettingsGroup, SettingsRow } from "./SettingsIOS";

export function HelpSubpage({ onOpenHelp }: { onOpenHelp: () => void }) {
  return (
    <div style={iosStyles.stack}>
      <SettingsGroup label="Help">
        <SettingsRow title="Help center" body="Browse articles and guides" onClick={onOpenHelp} />
        <SettingsRow title="Contact support" body="Get help from our team" onClick={onOpenHelp} />
        <SettingsRow title="Report a problem" body="Tell us what is not working" onClick={onOpenHelp} last />
      </SettingsGroup>
      <SettingsGroup label="Feedback">
        <SettingsRow title="Share feedback" body="Help us improve Toatre" onClick={onOpenHelp} />
        <SettingsRow title="Rate Toatre" body="Rate Toatre when store ratings are available" last />
      </SettingsGroup>
      <p style={{ ...iosStyles.body, textAlign: "center" }}>Toatre v1.0.0 (2026)<br />Made with care in California</p>
    </div>
  );
}