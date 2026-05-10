"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CalendarIcon,
  ChevronRightIcon,
  MessageIcon,
  PeopleIcon,
  SettingsIcon,
  ShareIcon,
  SparkleIcon,
  VideoIcon,
} from "@/components/mobile-ui";
import { MobileAppShell } from "@/app/_components/mobile-app-shell";
import type { UseSettingsResult } from "../../_hooks/useSettings";
import type { SettingsTab } from "../../_utils/settings-helpers";
import { styles } from "./mobile.styles";
import { AvailabilitySubpage } from "./AvailabilitySubpage";
import { BookingRulesSubpage } from "./BookingRulesSubpage";
import { ConnectionsTab } from "./ConnectionsTab";
import { GeneralSubpage } from "./GeneralSubpage";
import { HandleSubpage } from "./HandleSubpage";
import { HelpSubpage } from "./HelpSubpage";
import { IntegrationsSubpage } from "./IntegrationsSubpage";
import { NotificationsSubpage } from "./NotificationsSubpage";
import { ProfileSubpage } from "./ProfileSubpage";
import { SettingsRootIntro, SubpageIntro } from "./SettingsIntro";
import { ThemeSubpage } from "./ThemeSubpage";

export type MobileSettingsScreen = "root" | SettingsTab | "availability" | "bookingRules" | "general" | "theme" | "help";

interface MobileSettingsViewProps extends UseSettingsResult {
  initialScreen?: Exclude<MobileSettingsScreen, "root">;
}

const menuStyles = {
  stack: { display: "grid", gap: 18 },
  section: { display: "grid", gap: 12 },
  sectionLabel: { margin: 0, fontSize: 14, fontWeight: 780, color: "#6b7280" },
  card: {
    borderRadius: 24,
    padding: "6px 18px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.86))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 24px 64px rgba(31,41,55,0.07)",
  },
  rowButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "16px 0",
    display: "grid",
    gridTemplateColumns: "48px minmax(0, 1fr) 18px",
    gap: 14,
    alignItems: "center",
    textAlign: "left" as const,
    cursor: "pointer",
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    display: "grid",
    placeItems: "center" as const,
    background: "rgba(124,58,237,0.08)",
    color: "#6d28d9",
  },
  rowTitle: { margin: 0, fontSize: 15, fontWeight: 800, color: "#0f1b4c" },
  rowBody: { margin: "5px 0 0", fontSize: 13, lineHeight: 1.38, color: "#6b7280" },
  divider: { height: 1, background: "rgba(99,102,241,0.10)" },
  notice: {
    borderRadius: 18,
    padding: "12px 14px",
    border: "1px solid rgba(124,58,237,0.14)",
    background: "rgba(124,58,237,0.08)",
    color: "#5b21b6",
    fontSize: 14,
    fontWeight: 600,
  },
  signOutButton: {
    minHeight: 48,
    borderRadius: 16,
    border: "1px solid rgba(239,68,68,0.16)",
    background: "rgba(255,255,255,0.9)",
    color: "#dc2626",
    fontSize: 13,
    fontWeight: 850,
    cursor: "pointer",
  },
} as const;

export function MobileSettingsView(props: MobileSettingsViewProps) {
  const router = useRouter();
  const [screen, setScreen] = useState<MobileSettingsScreen>(props.initialScreen ?? "root");

  return (
    <MobileAppShell
      user={props.user}
      active="menu"
      inboxCount={0}
      onOpenTimeline={() => router.push("/timeline")}
      onOpenInbox={() => router.push("/inbox")}
      onOpenBookings={() => router.push("/bookings")}
      onOpenMenu={() => router.push("/settings")}
      onOpenCapture={() => router.push("/capture")}
      onOpenProfile={() => setScreen("profile")}
      header={screen === "root" ? <SettingsRootIntro /> : <SubpageIntro screen={screen} onBack={() => setScreen(props.initialScreen ?? "root")} />}
    >
      {screen === "root" ? (
        <SettingsRoot notice={props.notice} savingKey={props.savingKey} onSignOut={props.handleSignOut} openScreen={setScreen} />
      ) : screen === "profile" ? (
        <ProfileSubpage {...props} />
      ) : screen === "connections" ? (
        <ConnectionsTab
          connections={props.connections}
          connectionDraft={props.connectionDraft}
          setConnectionDraft={props.setConnectionDraft}
          editingConnectionId={props.editingConnectionId}
          savingKey={props.savingKey}
          saveConnection={props.saveConnection}
          deleteConnection={props.deleteConnection}
          editConnection={props.editConnection}
          resetConnectionDraft={props.resetConnectionDraft}
        />
      ) : screen === "pings" && props.notificationPreferences ? (
        <NotificationsSubpage {...props} notificationPreferences={props.notificationPreferences} />
      ) : screen === "sync" ? (
        <IntegrationsSubpage {...props} />
      ) : screen === "toatlink" ? (
        <HandleSubpage {...props} />
      ) : screen === "availability" ? (
        <AvailabilitySubpage {...props} />
      ) : screen === "bookingRules" ? (
        <BookingRulesSubpage {...props} />
      ) : screen === "general" ? (
        <GeneralSubpage {...props} />
      ) : screen === "help" ? (
        <HelpSubpage onOpenHelp={() => router.push("/help")} />
      ) : (
        <ThemeSubpage />
      )}
    </MobileAppShell>
  );
}

function SettingsRoot({
  notice,
  savingKey,
  onSignOut,
  openScreen,
}: {
  notice: UseSettingsResult["notice"];
  savingKey: string | null;
  onSignOut: () => Promise<void>;
  openScreen: (screen: MobileSettingsScreen) => void;
}) {
  return (
    <div style={menuStyles.stack}>
      {notice.message ? (
        <div style={{ ...menuStyles.notice, ...(notice.tone === "error" ? styles.noticeError : styles.noticeSuccess) }}>{notice.message}</div>
      ) : null}

      <MenuSection label="Account">
        <MenuRow icon={<PeopleIcon size={24} />} title="Profile" body="Manage your personal information" onClick={() => openScreen("profile")} />
        <Divider />
        <MenuRow icon={<BellIcon size={24} />} title="Pings" body="Manage how Toatre reaches you" onClick={() => openScreen("pings")} />
      </MenuSection>

      <MenuSection label="Handle & Booking">
        <MenuRow icon={<ShareIcon size={22} />} title="Handle / Toatre Link" body="View and customize your link" onClick={() => openScreen("toatlink")} />
        <Divider />
        <MenuRow icon={<CalendarIcon size={24} />} title="Availability" body="Set your available days and times" onClick={() => openScreen("availability")} />
        <Divider />
        <MenuRow icon={<SettingsIcon size={24} />} title="Booking rules" body="Control how people can book with you" onClick={() => openScreen("bookingRules")} />
      </MenuSection>

      <MenuSection label="Integrations">
        <MenuRow icon={<CalendarIcon size={24} />} title="Connected calendars" body="Sync your calendar items and availability" onClick={() => openScreen("sync")} />
        <Divider />
        <MenuRow icon={<VideoIcon size={24} />} title="Meeting apps" body="Connect Zoom, Teams, and Calendly" onClick={() => openScreen("sync")} />
      </MenuSection>

      <MenuSection label="Preferences">
        <MenuRow icon={<SettingsIcon size={24} />} title="General" body="Language, time zone, and more" onClick={() => openScreen("general")} />
        <Divider />
        <MenuRow icon={<SparkleIcon size={20} />} title="Theme" body="Review app appearance" onClick={() => openScreen("theme")} />
        <Divider />
        <MenuRow icon={<MessageIcon size={22} />} title="Help & feedback" body="Get help or share feedback" onClick={() => openScreen("help")} />
      </MenuSection>

      <button type="button" style={menuStyles.signOutButton} onClick={() => void onSignOut()} disabled={savingKey === "signout"}>
        {savingKey === "signout" ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}

function MenuSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section style={menuStyles.section}>
      <p style={menuStyles.sectionLabel}>{label}</p>
      <div style={menuStyles.card}>{children}</div>
    </section>
  );
}

function Divider() {
  return <div style={menuStyles.divider} />;
}

function MenuRow({ icon, title, body, onClick }: { icon: ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={menuStyles.rowButton}>
      <span style={menuStyles.rowIcon}>{icon}</span>
      <span>
        <p style={menuStyles.rowTitle}>{title}</p>
        <p style={menuStyles.rowBody}>{body}</p>
      </span>
      <ChevronRightIcon size={20} />
    </button>
  );
}