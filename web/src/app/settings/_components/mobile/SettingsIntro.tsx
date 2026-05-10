import { MobilePageIntro } from "@/app/_components/mobile-app-shell";
import type { MobileSettingsScreen } from "./MobileSettingsView";

const styles = {
  backIntro: { display: "grid", gap: 14, marginBottom: 20 },
  backButton: { width: 46, height: 46, borderRadius: 16, border: "1px solid rgba(91,61,245,0.14)", background: "rgba(255,255,255,0.88)", color: "#5b3df5", fontSize: 20, fontWeight: 700, cursor: "pointer" },
} as const;

export function SettingsRootIntro() {
  return <MobilePageIntro title="Settings" subtitle="Manage your account, handle, Pings, and integrations" />;
}

export function SubpageIntro({ screen, onBack }: { screen: Exclude<MobileSettingsScreen, "root">; onBack: () => void }) {
  const meta = getScreenMeta(screen);

  return (
    <div style={styles.backIntro}>
      <button type="button" onClick={onBack} style={styles.backButton} aria-label="Back to Settings">
        {"<"}
      </button>
      <MobilePageIntro title={meta.title} subtitle={meta.body} />
    </div>
  );
}

function getScreenMeta(screen: Exclude<MobileSettingsScreen, "root">) {
  switch (screen) {
    case "profile":
      return { title: "Profile", body: "Update your personal information, time zone, phone settings, and handle." };
    case "connections":
      return { title: "People & connections", body: "Manage who can share toats with you and who appears in capture context." };
    case "pings":
      return { title: "Pings", body: "Control how and when Toatre sends Pings across channels." };
    case "sync":
      return { title: "Integrations", body: "Connect calendars and meeting providers from the same mobile settings flow." };
    case "toatlink":
      return { title: "Handle & booking", body: "Manage your public handle, booking window, availability, and booking rules." };
    case "availability":
      return { title: "Availability", body: "Choose the days and times people can book with you." };
    case "bookingRules":
      return { title: "Booking rules", body: "Set limits, buffers, and default booking duration." };
    case "general":
      return { title: "General", body: "Manage language, time, and voice-retention preferences." };
    case "help":
      return { title: "Help & feedback", body: "Get support, report a problem, or share feedback." };
    case "theme":
      return { title: "Theme", body: "Review the current app appearance settings." };
    default:
      return { title: "Settings", body: "Manage your Toatre experience." };
  }
}