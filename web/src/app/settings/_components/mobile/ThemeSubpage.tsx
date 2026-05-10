import { iosStyles, SettingsGroup, SettingsRow } from "./SettingsIOS";

export function ThemeSubpage() {
  return (
    <div style={iosStyles.stack}>
      <SettingsGroup label="Appearance">
        <SettingsRow title="Theme" body="Toatre launches with the approved dark theme. Light theme is planned after v1." value="Dark" last />
      </SettingsGroup>
      <SettingsGroup label="Accent color">
        <div style={{ padding: 16, display: "flex", gap: 16, alignItems: "center" }}>
          {["#6d28d9", "#0ea5e9", "#22c55e", "#f97316", "#ec4899"].map((color, index) => (
            <span key={color} style={{ width: 32, height: 32, borderRadius: "50%", background: color, boxShadow: index === 0 ? "0 0 0 4px rgba(109,40,217,0.16)" : undefined }} />
          ))}
        </div>
      </SettingsGroup>
    </div>
  );
}