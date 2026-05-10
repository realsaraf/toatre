import type { MobileSettingsScreen } from "./MobileSettingsView";

const styles = {
  rootIntro: { margin: "2px 0 22px" },
  rootTitle: { margin: 0, fontSize: "clamp(38px, 10.5vw, 44px)", lineHeight: 1, fontWeight: 850, letterSpacing: "-0.045em", color: "#0f1b4c" },
  backIntro: { display: "grid", gap: 14, marginBottom: 20 },
  backButton: { width: 46, height: 46, borderRadius: 16, border: "1px solid rgba(91,61,245,0.14)", background: "rgba(255,255,255,0.88)", color: "#5b3df5", fontSize: 20, fontWeight: 700, cursor: "pointer" },
  eyebrow: { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#5b3df5" },
  title: { margin: "6px 0 0", fontSize: "clamp(26px, 6.8vw, 32px)", lineHeight: 1, fontWeight: 850, letterSpacing: "-0.032em", color: "#0f1b4c" },
  body: { margin: "10px 0 0", fontSize: 14, lineHeight: 1.4, color: "#6b7280" },
} as const;

export function SettingsRootIntro() {
  return (
    <section style={styles.rootIntro}>
      <h1 style={styles.rootTitle}>Settings</h1>
    </section>
  );
}

export function SubpageIntro({ screen, onBack }: { screen: Exclude<MobileSettingsScreen, "root">; onBack: () => void }) {
  const meta = getScreenMeta(screen);

  return (
    <div style={styles.backIntro}>
      <button type="button" onClick={onBack} style={styles.backButton} aria-label="Back to Settings">
        {"<"}
      </button>
      <div>
        <p style={styles.eyebrow}>Settings</p>
        <h1 style={styles.title}>{meta.title}</h1>
        <p style={styles.body}>{meta.body}</p>
      </div>
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