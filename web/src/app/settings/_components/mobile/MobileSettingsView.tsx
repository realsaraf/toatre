"use client";

import { useState } from "react";
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
import { MobileAppShell, MobilePageIntro } from "@/app/_components/mobile-app-shell";
import type { UseSettingsResult } from "../../_hooks/useSettings";
import type { SettingsTab } from "../../_utils/settings-helpers";
import { styles } from "./mobile.styles";
import { ProfileTab } from "./ProfileTab";
import { ConnectionsTab } from "./ConnectionsTab";
import { PingsTab } from "./PingsTab";
import { SyncTab } from "./SyncTab";
import { ToatLinkTab } from "./ToatLinkTab";

type MobileSettingsScreen = "root" | SettingsTab | "theme";

interface MobileSettingsViewProps extends UseSettingsResult {
  initialScreen?: Exclude<MobileSettingsScreen, "root">;
}

const menuStyles = {
  stack: {
    display: "grid",
    gap: 20,
  },
  section: {
    display: "grid",
    gap: 12,
  },
  sectionLabel: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: "#6b7280",
  },
  card: {
    borderRadius: 28,
    padding: "8px 18px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.86))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
  },
  rowButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "18px 0",
    display: "grid",
    gridTemplateColumns: "52px minmax(0, 1fr) 20px",
    gap: 16,
    alignItems: "center",
    textAlign: "left" as const,
    cursor: "pointer",
  },
  rowIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    display: "grid",
    placeItems: "center" as const,
    background: "rgba(124,58,237,0.08)",
    color: "#6d28d9",
  },
  rowTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: "#0f1b4c",
  },
  rowBody: {
    margin: "6px 0 0",
    fontSize: 14,
    lineHeight: 1.5,
    color: "#6b7280",
  },
  divider: {
    height: 1,
    background: "rgba(99,102,241,0.10)",
  },
  notice: {
    borderRadius: 18,
    padding: "12px 14px",
    border: "1px solid rgba(124,58,237,0.14)",
    background: "rgba(124,58,237,0.08)",
    color: "#5b21b6",
    fontSize: 14,
    fontWeight: 600,
  },
  utilityRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  utilityButton: {
    minHeight: 44,
    padding: "0 16px",
    borderRadius: 16,
    border: "1px solid rgba(91,61,245,0.14)",
    background: "rgba(255,255,255,0.88)",
    color: "#5b3df5",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  backIntro: {
    display: "grid",
    gap: 14,
    marginBottom: 20,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    border: "1px solid rgba(91,61,245,0.14)",
    background: "rgba(255,255,255,0.88)",
    color: "#5b3df5",
    fontSize: 20,
    fontWeight: 700,
    cursor: "pointer",
  },
  subpageEyebrow: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#5b3df5",
  },
  subpageTitle: {
    margin: "6px 0 0",
    fontSize: "clamp(32px, 10vw, 46px)",
    lineHeight: 0.95,
    fontWeight: 850,
    letterSpacing: "-0.05em",
    color: "#0f1b4c",
  },
  subpageBody: {
    margin: "10px 0 0",
    fontSize: 15,
    lineHeight: 1.5,
    color: "#6b7280",
  },
  themeCard: {
    borderRadius: 28,
    padding: 24,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.86))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    display: "grid",
    gap: 12,
  },
  themeTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#0f1b4c",
  },
  themeBody: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.55,
    color: "#6b7280",
  },
} as const;

export function MobileSettingsView(props: MobileSettingsViewProps) {
  const router = useRouter();
  const [screen, setScreen] = useState<MobileSettingsScreen>(props.initialScreen ?? "root");
  const [themeNotice, setThemeNotice] = useState<string | null>(null);

  const sharedShellProps = {
    user: props.user,
    active: "menu" as const,
    inboxCount: 0,
    onOpenTimeline: () => router.push("/timeline"),
    onOpenInbox: () => router.push("/inbox"),
    onOpenBookings: () => router.push("/bookings"),
    onOpenMenu: () => router.push("/settings"),
    onOpenCapture: () => router.push("/capture"),
    onOpenProfile: () => setScreen("profile"),
  };

  return (
    <MobileAppShell
      {...sharedShellProps}
      header={screen === "root" ? (
        <MobilePageIntro
          title="Settings"
          subtitle="Manage your account, booking setup, integrations, and preferences"
        />
      ) : (
        <SubpageIntro screen={screen} onBack={() => setScreen(props.initialScreen ? props.initialScreen : "root")} />
      )}
    >
      {screen === "root" ? (
        <div style={menuStyles.stack}>
          <div style={menuStyles.utilityRow}>
            <button type="button" style={menuStyles.utilityButton} onClick={() => void props.handleSignOut()}>
              {props.savingKey === "signout" ? "Signing out..." : "Sign out"}
            </button>
          </div>

          {props.notice.message ? (
            <div
              style={{
                ...menuStyles.notice,
                ...(props.notice.tone === "error" ? styles.noticeError : styles.noticeSuccess),
              }}
            >
              {props.notice.message}
            </div>
          ) : null}

          {themeNotice ? <div style={menuStyles.notice}>{themeNotice}</div> : null}

          <section style={menuStyles.section}>
            <p style={menuStyles.sectionLabel}>Account</p>
            <div style={menuStyles.card}>
              <MenuRow icon={<PeopleIcon size={24} />} title="Profile" body="Manage your personal information" onClick={() => setScreen("profile")} />
              <div style={menuStyles.divider} />
              <MenuRow icon={<BellIcon size={24} />} title="Notifications" body="Manage how you get Pinged" onClick={() => setScreen("pings")} />
              <div style={menuStyles.divider} />
              <MenuRow icon={<PeopleIcon size={24} />} title="People & connections" body="Manage who can share toats with you" onClick={() => router.push("/people")} />
            </div>
          </section>

          <section style={menuStyles.section}>
            <p style={menuStyles.sectionLabel}>Handle & booking</p>
            <div style={menuStyles.card}>
              <MenuRow icon={<ShareIcon size={22} />} title="Handle / Toat Link" body="View and customize your link" onClick={() => setScreen("toatlink")} />
              <div style={menuStyles.divider} />
              <MenuRow icon={<CalendarIcon size={24} />} title="Availability" body="Set your available days and times" onClick={() => setScreen("toatlink")} />
              <div style={menuStyles.divider} />
              <MenuRow icon={<SettingsIcon size={24} />} title="Booking rules" body="Control how people can book with you" onClick={() => setScreen("toatlink")} />
            </div>
          </section>

          <section style={menuStyles.section}>
            <p style={menuStyles.sectionLabel}>Integrations</p>
            <div style={menuStyles.card}>
              <MenuRow icon={<CalendarIcon size={24} />} title="Connected calendars" body="Sync your toats and availability" onClick={() => setScreen("sync")} />
              <div style={menuStyles.divider} />
              <MenuRow icon={<VideoIcon size={24} />} title="Meeting apps" body="Connect Zoom, Google Meet and more" onClick={() => setScreen("sync")} />
            </div>
          </section>

          <section style={menuStyles.section}>
            <p style={menuStyles.sectionLabel}>Preferences</p>
            <div style={menuStyles.card}>
              <MenuRow icon={<SettingsIcon size={24} />} title="General" body="Language, time zone and more" onClick={() => setScreen("profile")} />
              <div style={menuStyles.divider} />
              <MenuRow icon={<SparkleIcon size={20} />} title="Theme" body="Choose your app appearance" onClick={() => { setThemeNotice("Theme choices are not live yet on web. This mobile layout is using the approved menu structure first."); setScreen("theme"); }} />
              <div style={menuStyles.divider} />
              <MenuRow icon={<MessageIcon size={22} />} title="Help & feedback" body="Get help or share feedback" onClick={() => router.push("/help")} />
            </div>
          </section>
        </div>
      ) : screen === "profile" ? (
        <ProfileTab
          settingsData={props.settingsData}
          savingKey={props.savingKey}
          timezone={props.timezone}
          setTimezone={props.setTimezone}
          workStart={props.workStart}
          setWorkStart={props.setWorkStart}
          workEnd={props.workEnd}
          setWorkEnd={props.setWorkEnd}
          voiceRetention={props.voiceRetention}
          setVoiceRetention={props.setVoiceRetention}
          handleDraft={props.handleDraft}
          setHandleDraft={props.setHandleDraft}
          phoneDraft={props.phoneDraft}
          setPhoneDraft={props.setPhoneDraft}
          verificationCode={props.verificationCode}
          setVerificationCode={props.setVerificationCode}
          smsEnabled={props.smsEnabled}
          setSmsEnabled={props.setSmsEnabled}
          timezoneOptions={props.timezoneOptions}
          phoneState={props.phoneState}
          toatLinkUrl={props.toatLinkUrl}
          saveProfile={props.saveProfile}
          saveHandle={props.saveHandle}
          sendPhoneCode={props.sendPhoneCode}
          verifyPhoneCode={props.verifyPhoneCode}
          savePhoneSettings={props.savePhoneSettings}
        />
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
        <PingsTab
          notificationPreferences={props.notificationPreferences}
          savingKey={props.savingKey}
          savePings={props.savePings}
          toggleNotificationChannel={props.toggleNotificationChannel}
        />
      ) : screen === "sync" ? (
        <SyncTab
          syncConnections={props.syncConnections}
          googleCalendarDirection={props.googleCalendarDirection}
          setGoogleCalendarDirection={props.setGoogleCalendarDirection}
          microsoftDirection={props.microsoftDirection}
          setMicrosoftDirection={props.setMicrosoftDirection}
          calendlyDirection={props.calendlyDirection}
          setCalendlyDirection={props.setCalendlyDirection}
          zoomDirection={props.zoomDirection}
          setZoomDirection={props.setZoomDirection}
          savingKey={props.savingKey}
          connectGoogleCalendar={props.connectGoogleCalendar}
          disconnectGoogleCalendar={props.disconnectGoogleCalendar}
          runGoogleCalendarSync={props.runGoogleCalendarSync}
          connectMicrosoft={props.connectMicrosoft}
          disconnectMicrosoft={props.disconnectMicrosoft}
          runMicrosoftSync={props.runMicrosoftSync}
          connectCalendly={props.connectCalendly}
          disconnectCalendly={props.disconnectCalendly}
          runCalendlySync={props.runCalendlySync}
          connectZoom={props.connectZoom}
          disconnectZoom={props.disconnectZoom}
          runZoomSync={props.runZoomSync}
        />
      ) : screen === "toatlink" ? (
        <ToatLinkTab
          toatLinkUrl={props.toatLinkUrl}
          bookingEnabled={props.bookingEnabled}
          setBookingEnabled={props.setBookingEnabled}
          bookingGreetingMessage={props.bookingGreetingMessage}
          setBookingGreetingMessage={props.setBookingGreetingMessage}
          bookingPageTitle={props.bookingPageTitle}
          setBookingPageTitle={props.setBookingPageTitle}
          bookingMetaDescription={props.bookingMetaDescription}
          setBookingMetaDescription={props.setBookingMetaDescription}
          bookingWindowDays={props.bookingWindowDays}
          bookingWindowStart={props.bookingWindowStart}
          setBookingWindowStart={props.setBookingWindowStart}
          bookingWindowEnd={props.bookingWindowEnd}
          setBookingWindowEnd={props.setBookingWindowEnd}
          bookingSlotLength={props.bookingSlotLength}
          setBookingSlotLength={props.setBookingSlotLength}
          bookingBuffer={props.bookingBuffer}
          setBookingBuffer={props.setBookingBuffer}
          bookingAdvance={props.bookingAdvance}
          setBookingAdvance={props.setBookingAdvance}
          bookingMaxDays={props.bookingMaxDays}
          setBookingMaxDays={props.setBookingMaxDays}
          bookingRequireReason={props.bookingRequireReason}
          setBookingRequireReason={props.setBookingRequireReason}
          bookingDisableDuringOfficeHours={props.bookingDisableDuringOfficeHours}
          setBookingDisableDuringOfficeHours={props.setBookingDisableDuringOfficeHours}
          bookingTimezone={props.bookingTimezone}
          setBookingTimezone={props.setBookingTimezone}
          timezoneOptions={props.timezoneOptions}
          loadingBooking={props.loadingBooking}
          savingBooking={props.savingBooking}
          setBookingWindowDays={props.setBookingWindowDays}
          saveBookingSettings={props.saveBookingSettings}
          toggleBookingWindowDay={props.toggleBookingWindowDay}
        />
      ) : (
        <div style={menuStyles.themeCard}>
          <h2 style={menuStyles.themeTitle}>Theme</h2>
          <p style={menuStyles.themeBody}>Theme selection is not wired on web yet. The current pass is focused on getting the mobile menu structure, Inbox, and Bookings layout aligned to the approved iOS-style mockups first.</p>
          <button type="button" style={menuStyles.utilityButton} onClick={() => setScreen("root")}>Back to menu</button>
        </div>
      )}
    </MobileAppShell>
  );
}

function MenuRow({
  icon,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
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

function SubpageIntro({ screen, onBack }: { screen: Exclude<MobileSettingsScreen, "root">; onBack: () => void }) {
  const meta = getScreenMeta(screen);

  return (
    <div style={menuStyles.backIntro}>
      <button type="button" onClick={onBack} style={menuStyles.backButton} aria-label="Back to menu">
        ‹
      </button>
      <div>
        <p style={menuStyles.subpageEyebrow}>Menu</p>
        <h1 style={menuStyles.subpageTitle}>{meta.title}</h1>
        <p style={menuStyles.subpageBody}>{meta.body}</p>
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
      return { title: "Notifications", body: "Control how and when Toatre sends Pings across channels." };
    case "sync":
      return { title: "Integrations", body: "Connect calendars and meeting providers from the same mobile settings flow." };
    case "toatlink":
      return { title: "Handle & booking", body: "Manage your public handle, booking window, availability, and booking rules." };
    case "theme":
      return { title: "Theme", body: "Appearance options will land after the mobile structure is settled." };
    default:
      return { title: "Settings", body: "Manage your Toatre experience." };
  }
}
