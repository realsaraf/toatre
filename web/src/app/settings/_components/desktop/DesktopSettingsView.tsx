"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TOAT_KINDS, type NotificationPreferences } from "@/lib/settings/defaults";
import { UserAvatar } from "@/components/mobile-ui";
import { BookingDashboardShell } from "@/app/_components/booking-dashboard";
import type { UseSettingsResult } from "../../_hooks/useSettings";
import type { SettingsTab, SyncConnection, SyncDirection } from "../../_utils/settings-helpers";
import { formatSyncDate } from "../../_utils/settings-helpers";
import { ConnectionsTab } from "../mobile/ConnectionsTab";
import { desktopSettingsCss } from "./desktop-settings.css";

type DesktopSection = "profile" | "pings" | "toatlink" | "sync" | "connections";
type NotificationTab = "delivery" | "reminders" | "bookings";
type HandleTab = "handle" | "page" | "availability" | "rules";
type IntegrationTab = "calendars" | "rules" | "conflicts";

const SECTION_ITEMS: Array<{ id: DesktopSection; title: string; helper?: string; icon: ReactNode }> = [
  { id: "profile", title: "General", icon: <PersonIcon /> },
  { id: "pings", title: "Notifications", icon: <BellIcon /> },
  { id: "connections", title: "Connections", helper: "People you share toats with", icon: <PeopleIcon /> },
  { id: "toatlink", title: "Handle", helper: "Reserve your handle & booking page", icon: <AtIcon /> },
  { id: "sync", title: "Integrations", helper: "Connect your calendars and apps", icon: <CalendarIcon /> },
];

export function DesktopSettingsView(props: UseSettingsResult) {
  const router = useRouter();
  const activeSection = toDesktopSection(props.activeTab);

  return (
    <BookingDashboardShell
      user={props.user}
      active="settings"
      inboxCount={0}
      bookingCount={0}
      pageTitle="Settings"
      pageSubtitle="Manage your account, preferences and Toatre experience"
      onCapture={() => router.push("/capture?mode=text")}
    >
      <style>{desktopSettingsCss}</style>
      <section className="desktop-settings-workspace">
        <SettingsSectionNav activeSection={activeSection} onChange={(section) => props.setActiveTab(section)} />
        <section className="desktop-settings-content">
          {props.notice.message ? <Notice tone={props.notice.tone} message={props.notice.message} /> : null}
          {props.loadingState && !props.settingsData ? <LoadingCard /> : null}
          {!props.loadingState && props.settingsData && activeSection === "profile" ? <GeneralPanel {...props} /> : null}
          {!props.loadingState && props.settingsData && activeSection === "pings" ? <NotificationsPanel {...props} /> : null}
          {!props.loadingState && props.settingsData && activeSection === "connections" ? <ConnectionsPanel {...props} /> : null}
          {!props.loadingState && props.settingsData && activeSection === "toatlink" ? <HandlePanel {...props} /> : null}
          {!props.loadingState && props.settingsData && activeSection === "sync" ? <IntegrationsPanel {...props} /> : null}
        </section>
      </section>
    </BookingDashboardShell>
  );
}

function toDesktopSection(tab: SettingsTab): DesktopSection {
  if (tab === "pings" || tab === "toatlink" || tab === "sync" || tab === "connections") return tab;
  return "profile";
}

function SettingsSectionNav({ activeSection, onChange }: { activeSection: DesktopSection; onChange: (section: DesktopSection) => void }) {
  return (
    <nav className="desktop-settings-section-nav" aria-label="Settings sections">
      {SECTION_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`desktop-section-nav-item${activeSection === item.id ? " active" : ""}`}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          <span>
            <strong>{item.title}</strong>
            {item.helper ? <span>{item.helper}</span> : null}
          </span>
        </button>
      ))}
    </nav>
  );
}

function GeneralPanel(props: UseSettingsResult) {
  const [weekStartsOn, setWeekStartsOn] = useDesktopSettingState<string>("weekStartsOn", "Monday");
  const [language, setLanguage] = useDesktopSettingState<string>("language", "English");
  const [theme, setTheme] = useDesktopSettingState<string>("theme", "Light");
  const [defaultDuration, setDefaultDuration] = useDesktopSettingState<string>("defaultDuration", "30 mins");
  const [defaultReminder, setDefaultReminder] = useDesktopSettingState<string>("defaultReminder", "10 mins before");
  const [defaultCategory, setDefaultCategory] = useDesktopSettingState<string>("defaultCategory", "Personal");

  return (
    <>
      <Card>
        <div className="desktop-card-pad">
          <h2 className="desktop-card-title">Account</h2>
          <div className="desktop-account-row">
            <div className="desktop-account-avatar"><UserAvatar user={props.user} /></div>
            <div>
              <p className="desktop-account-name">{props.displayName}</p>
              <p className="desktop-account-email">{props.email}</p>
              <p className="desktop-account-bio">Builder of Toatre. Helping founders, engineers and creators make time for what matters.</p>
            </div>
          </div>
        </div>
        <div className="desktop-social-row">
          <span className="desktop-provider-chip"><span className="desktop-google-mark">G</span> Signed in with {props.providerLabels[0] ?? "Google"}</span>
          <button
            type="button"
            className="desktop-signout-btn"
            onClick={() => void props.handleSignOut()}
            disabled={props.savingKey === "signout"}
          >
            {props.savingKey === "signout" ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </Card>

      <Card padded>
        <h2 className="desktop-card-title">Preferences</h2>
        <div className="desktop-form-grid">
          <SelectField label="Time zone" icon={<GlobeIcon />} value={props.timezone} onChange={props.setTimezone} onBlur={() => void props.saveProfile()} options={props.timezoneOptions} />
          <SelectField label="Week starts on" icon={<CalendarIcon />} value={weekStartsOn} onChange={setWeekStartsOn} options={["Monday", "Sunday"]} />
          <SelectField label="Language" icon={<GlobeIcon />} value={language} onChange={setLanguage} options={["English"]} />
          <div className="desktop-field">
            <span className="desktop-field-label"><SunIcon /> Theme</span>
            <div className="desktop-segmented" aria-label="Theme">
              {["Light", "System"].map((option) => (
                <button key={option} type="button" className={theme === option ? "active" : ""} onClick={() => setTheme(option)}>{option}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card padded>
        <h2 className="desktop-card-title">Toat defaults</h2>
        <div className="desktop-form-grid">
          <SelectField label="Default duration" icon={<ClockIcon />} value={defaultDuration} onChange={setDefaultDuration} options={["15 mins", "30 mins", "45 mins", "60 mins"]} />
          <SelectField label="Default reminder" icon={<BellIcon />} value={defaultReminder} onChange={setDefaultReminder} options={["At start time", "10 mins before", "30 mins before"]} />
          <SelectField label="Default category" icon={<FolderIcon />} value={defaultCategory} onChange={setDefaultCategory} options={["Personal", "Work", "Family"]} />
          <div className="desktop-setting-row" style={{ borderBottom: 0, padding: 0, minHeight: 48 }}>
            <LightningIcon />
            <div>
              <h3>Quick-capture behavior</h3>
              <p>Split multiple requests into separate toats</p>
            </div>
            <Switch checked={props.voiceRetention} onChange={(next) => { props.setVoiceRetention(next); setTimeout(() => void props.saveProfile(), 0); }} />
          </div>
        </div>
      </Card>
      <SavedIndicator />
    </>
  );
}

function ConnectionsPanel(props: UseSettingsResult) {
  return (
    <Card>
      <div className="desktop-card-pad">
        <h2 className="desktop-card-title">Connections</h2>
        <p className="desktop-account-bio" style={{ marginBottom: 22 }}>People you can share toats with. Add their details to invite them from the share modal.</p>
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
      </div>
    </Card>
  );
}

function NotificationsPanel(props: UseSettingsResult) {
  const [tab, setTab] = useState<NotificationTab>("delivery");
  const [desktopNotifications, setDesktopNotifications] = useDesktopSettingState<string>("desktopNotifications", "Enabled");
  const [upcomingReminder, setUpcomingReminder] = useDesktopSettingState<string>("upcomingReminder", "10 mins before");
  const [startTimeAlert, setStartTimeAlert] = useDesktopSettingState<string>("startTimeAlert", "At start time");
  const [dailySummary, setDailySummary] = useDesktopSettingState<boolean>("dailySummary", true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useDesktopSettingState<boolean>("quietHoursEnabled", true);
  const [quietHoursStart, setQuietHoursStart] = useDesktopSettingState<string>("quietHoursStart", "10:00 PM");
  const [quietHoursEnd, setQuietHoursEnd] = useDesktopSettingState<string>("quietHoursEnd", "7:00 AM");
  const prefs = props.notificationPreferences;
  const allEmail = prefs ? TOAT_KINDS.every((kind) => prefs[kind]?.email) : false;
  const allPush = prefs ? TOAT_KINDS.every((kind) => prefs[kind]?.push) : false;

  const setAllChannels = (channel: keyof NotificationPreferences[string], value: boolean) => {
    if (!prefs) return;
    for (const kind of TOAT_KINDS) {
      if ((prefs[kind]?.[channel] ?? false) !== value) {
        props.toggleNotificationChannel(kind, channel);
      }
    }
  };

  return (
    <>
      <Tabs<NotificationTab> active={tab} onChange={setTab} items={[{ id: "delivery", label: "Delivery" }, { id: "reminders", label: "Reminders" }, { id: "bookings", label: "Bookings" }]} />
      {tab === "delivery" ? (
        <>
          <Card padded>
            <h2 className="desktop-card-title">Notification channels</h2>
            <Rows>
              <SettingsRow icon={<MailIcon />} title="Email" helper="Receive notifications at your primary email address." control={<Switch checked={allEmail} onChange={(next) => setAllChannels("email", next)} />} />
              <SettingsRow icon={<PhoneIcon />} title="Push notifications" helper="Receive notifications on your mobile devices." control={<Switch checked={allPush} onChange={(next) => setAllChannels("push", next)} />} />
              <SettingsRow icon={<DesktopIcon />} title="Desktop notifications" helper="Receive notifications while using Toatre in this browser." control={<select className="desktop-input-shell" value={desktopNotifications} onChange={(event) => setDesktopNotifications(event.target.value)}><option>Enabled</option><option>Muted</option></select>} />
            </Rows>
          </Card>
          <Card padded>
            <h2 className="desktop-card-title">Reminder delivery</h2>
            <Rows>
              <SettingsRow icon={<ClockIcon />} title="Upcoming toat reminders" helper="Remind me before toats begin." control={<select className="desktop-input-shell" value={upcomingReminder} onChange={(event) => setUpcomingReminder(event.target.value)}><option>10 mins before</option><option>30 mins before</option><option>At start time</option></select>} />
              <SettingsRow icon={<BellIcon />} title="Start time alerts" helper="Get an alert when a toat is starting." control={<select className="desktop-input-shell" value={startTimeAlert} onChange={(event) => setStartTimeAlert(event.target.value)}><option>At start time</option><option>5 mins before</option></select>} />
              <SettingsRow icon={<CalendarIcon />} title="Daily summary" helper="Receive a summary of your day each morning." control={<Switch checked={dailySummary} onChange={setDailySummary} />} />
            </Rows>
          </Card>
          <Card padded>
            <div className="desktop-section-card-head">
              <div><h2>Quiet hours</h2><p>Pause non-urgent notifications during quiet hours.</p></div>
              <Switch checked={quietHoursEnabled} onChange={setQuietHoursEnabled} />
            </div>
            <div className="desktop-form-grid three">
              <SelectField label="Start time" icon={<ClockIcon />} value={quietHoursStart} onChange={setQuietHoursStart} options={["9:00 PM", "10:00 PM", "11:00 PM"]} />
              <SelectField label="End time" icon={<ClockIcon />} value={quietHoursEnd} onChange={setQuietHoursEnd} options={["6:00 AM", "7:00 AM", "8:00 AM"]} />
              <SelectField label="Time zone" icon={<GlobeIcon />} value={props.timezone} onChange={props.setTimezone} onBlur={() => void props.saveProfile()} options={props.timezoneOptions} />
            </div>
          </Card>
          <Card padded>
            <h2 className="desktop-card-title">Booking notifications</h2>
            <Rows>
              {["New booking request", "Booking confirmed", "Booking cancelled", "Reschedule request"].map((title) => (
                <SettingsRow key={title} icon={<CalendarIcon />} title={title} helper={bookingNotificationHelper(title)} control={<span style={{ display: "flex", gap: 10 }}><span className="desktop-channel-pill">✓ Email</span><span className="desktop-channel-pill">✓ Push</span><ChevronRightIcon /></span>} />
              ))}
            </Rows>
          </Card>
        </>
      ) : tab === "reminders" ? (
        <SimpleTabCards cards={["Default reminder timing", "Location-based reminders", "Important toats", "Snooze behavior"]} />
      ) : (
        <SimpleTabCards cards={["Booking requests", "Confirmations and cancellations", "Guest reminders", "Owner daily booking summary"]} />
      )}
      <button type="button" className="desktop-primary-btn" onClick={() => void props.savePings()} disabled={props.savingKey === "pings"}>{props.savingKey === "pings" ? "Saving..." : "Save notification settings"}</button>
      <SavedIndicator />
    </>
  );
}

function HandlePanel(props: UseSettingsResult) {
  const [tab, setTab] = useState<HandleTab>("handle");
  const cleanHandle = props.handleDraft.replace(/^@+/, "");

  return (
    <>
      <div className="desktop-page-head" style={{ marginTop: 6 }}>
        <h1 style={{ fontSize: 22 }}>Handle</h1>
        <p>Reserve your handle and configure your public booking page.</p>
      </div>
      <Tabs<HandleTab> active={tab} onChange={setTab} items={[{ id: "handle", label: "Handle" }, { id: "page", label: "Page" }, { id: "availability", label: "Availability" }, { id: "rules", label: "Booking rules" }]} />
      {tab === "handle" ? (
        <>
          <Card padded>
            <div className="desktop-section-card-head"><div><h2>Your handle</h2></div><button type="button" className="desktop-ghost-btn" onClick={() => void props.copyToatLink()} disabled={!props.toatLinkUrl}><CopyIcon /> Copy link</button></div>
            <div className="desktop-handle-main-row">
              <div>
                <div className="desktop-handle-field">toatre.com/<strong>{(props.settingsData?.profile.handle ?? cleanHandle) || "handle"}</strong><span className="desktop-live-pill"><span className="desktop-dot" /> Live</span></div>
                <p className="desktop-account-bio" style={{ marginTop: 10 }}>This is your public page used for bookings.</p>
              </div>
            </div>
          </Card>
          <Card padded>
            <div className="desktop-section-card-head"><div><h2>Handle reservation</h2></div><button type="button" className="desktop-soft-btn" onClick={() => void props.saveHandle()} disabled={props.savingKey === "handle"}>{props.savingKey === "handle" ? "Saving..." : "Save handle"}</button></div>
            <div className="desktop-handle-field"><span>@</span><input value={cleanHandle} onChange={(event) => props.setHandleDraft(event.target.value.replace(/^@+/, ""))} style={{ border: 0, outline: 0, flex: 1, font: "inherit", fontWeight: 760 }} /><span className="desktop-live-pill">✓ Available</span></div>
            <p className="desktop-account-bio" style={{ marginTop: 10 }}>Handles must be unique. Letters, numbers, and underscores only.</p>
          </Card>
          <PageBasicsCard {...props} />
          <VisibilityCard {...props} />
        </>
      ) : tab === "page" ? (
        <><PageBasicsCard {...props} /><Card padded><h2 className="desktop-card-title">Confirmation message</h2><TextField label="Greeting message" value={props.bookingGreetingMessage} onChange={props.setBookingGreetingMessage} multiline /></Card></>
      ) : tab === "availability" ? (
        <AvailabilityCards {...props} />
      ) : (
        <BookingRuleCards {...props} />
      )}
      <button type="button" className="desktop-primary-btn" onClick={() => void props.saveBookingSettings()} disabled={props.savingBooking || props.loadingBooking}>{props.savingBooking ? "Saving..." : "Save booking page settings"}</button>
      <SavedIndicator />
    </>
  );
}

function IntegrationsPanel(props: UseSettingsResult) {
  const [tab, setTab] = useState<IntegrationTab>("calendars");
  const [primaryCalendar, setPrimaryCalendar] = useDesktopSettingState<string>("primaryCalendar", "Google Calendar");
  const [availabilityCalendar, setAvailabilityCalendar] = useDesktopSettingState<string>("availabilityCalendar", "Google Calendar");
  const [blockBusyTimes, setBlockBusyTimes] = useDesktopSettingState<boolean>("blockBusyTimes", true);
  const [readOnlyImportedEvents, setReadOnlyImportedEvents] = useDesktopSettingState<boolean>("readOnlyImportedEvents", true);
  const [meetingProvider, setMeetingProvider] = useDesktopSettingState<string>("meetingProvider", "Google Meet");
  const google = props.syncConnections.googleCalendar;
  const microsoft = props.syncConnections.microsoft;
  const calendly = props.syncConnections.calendly;
  const zoom = props.syncConnections.zoom;
  const primaryLabel = google?.connected ? `Google Calendar (${props.email})` : "Google Calendar";

  return (
    <>
      <Tabs<IntegrationTab> active={tab} onChange={setTab} items={[{ id: "calendars", label: "Connected calendars" }, { id: "rules", label: "Sync rules" }, { id: "conflicts", label: "Conflict handling" }]} />
      {tab === "calendars" ? (
        <>
          <Card padded>
            <h2 className="desktop-card-title">Connected calendars</h2>
            <CalendarConnection provider="google" title="Google Calendar" subtitle={props.email} connection={google} actionKey="sync-google" savingKey={props.savingKey} onConnect={props.connectGoogleCalendar} onDisconnect={props.disconnectGoogleCalendar} />
            <CalendarConnection provider="outlook" title="Outlook Calendar" subtitle="Connect your Outlook calendar" connection={microsoft} actionKey="sync-microsoft" savingKey={props.savingKey} onConnect={props.connectMicrosoft} onDisconnect={props.disconnectMicrosoft} />
            <CalendarConnection provider="calendly" title="Calendly" subtitle="Connect your booking source" connection={calendly} actionKey="sync-calendly" savingKey={props.savingKey} onConnect={props.connectCalendly} onDisconnect={props.disconnectCalendly} />
            <CalendarConnection provider="zoom" title="Zoom" subtitle="Connect meeting details" connection={zoom} actionKey="sync-zoom" savingKey={props.savingKey} onConnect={props.connectZoom} onDisconnect={props.disconnectZoom} />
          </Card>
          <div className="desktop-settings-card-grid">
            <Card padded><div className="desktop-section-card-head"><div><h2>Primary calendar for bookings</h2><p>Choose where booked sessions will be added.</p></div></div><select className="desktop-input-shell" value={primaryCalendar} onChange={(event) => setPrimaryCalendar(event.target.value)}><option>Google Calendar</option><option>Outlook Calendar</option></select></Card>
            <Card padded><div className="desktop-section-card-head"><div><h2>Availability sync</h2><p>Select which calendars to check for conflicts.</p></div></div><select className="desktop-input-shell" value={availabilityCalendar} onChange={(event) => setAvailabilityCalendar(event.target.value)}><option>{primaryLabel}</option><option>All connected calendars</option></select><Rows><SettingsRow icon={<ClockIcon />} title="Blocking busy times" helper="Treat busy calendar time as unavailable." control={<Switch checked={blockBusyTimes} onChange={setBlockBusyTimes} />} /><SettingsRow icon={<EyeIcon />} title="Read-only imported events" helper="Keep external calendar entries unchanged." control={<Switch checked={readOnlyImportedEvents} onChange={setReadOnlyImportedEvents} />} /><SettingsRow icon={<SyncIcon />} title="Two-way sync if supported" helper="Allow supported providers to receive Toatre updates." control={<Switch checked={google?.direction === "twoWay"} onChange={(next) => props.setGoogleCalendarDirection(next ? "twoWay" : "sourceToToatre")} />} /></Rows></Card>
          </div>
          <div className="desktop-settings-card-grid">
            <Card padded><div className="desktop-section-card-head"><div><h2>Default meeting provider</h2><p>Choose the meeting tool to use for new bookings.</p></div></div><div className="desktop-provider-options">{["Google Meet", "Zoom", "Microsoft Teams"].map((provider) => <button key={provider} className={`desktop-provider-option${meetingProvider === provider ? " active" : ""}`} type="button" onClick={() => setMeetingProvider(provider)}>{provider}</button>)}</div></Card>
            <Card padded><div className="desktop-section-card-head"><div><h2>Calendar sync status</h2><p>Last synced</p><p><span className="desktop-live-pill">✓ {formatSyncDate(google?.lastSyncedAt)}</span></p></div><button type="button" className="desktop-ghost-btn" onClick={() => void props.runGoogleCalendarSync()} disabled={!google?.connected || props.savingKey === "sync-google-run"}><SyncIcon /> {props.savingKey === "sync-google-run" ? "Syncing..." : "Sync now"}</button></div></Card>
          </div>
        </>
      ) : tab === "rules" ? (
        <SyncRulesCard {...props} />
      ) : (
        <ConflictCards />
      )}
      <SavedIndicator />
    </>
  );
}

function PageBasicsCard(props: UseSettingsResult) {
  return (
    <Card padded>
      <h2 className="desktop-card-title">Page basics</h2>
      <div className="desktop-page-basics-grid">
        <div className="desktop-page-basics-fields">
          <TextField label="Page title" value={props.bookingPageTitle || props.displayName} onChange={(value) => props.setBookingPageTitle(value.slice(0, 60))} countMax={60} />
          <TextField label="Greeting message" value={props.bookingGreetingMessage} onChange={(value) => props.setBookingGreetingMessage(value.slice(0, 100))} countMax={100} />
          <TextField label="Intro line" value={props.bookingMetaDescription} onChange={(value) => props.setBookingMetaDescription(value.slice(0, 160))} countMax={160} />
        </div>
        <div className="desktop-preview-box">
          <span className="desktop-field-label"><EyeIcon /> Live preview</span>
          <div className="desktop-mini-preview" style={{ marginTop: 12 }}>
            <div className="desktop-mini-preview-head"><div className="desktop-mini-avatar"><UserAvatar user={props.user} /></div><strong>{props.displayName}</strong></div>
            <p>{props.bookingGreetingMessage || "Let's find the perfect time to connect."}</p>
            <p>{props.bookingMetaDescription}</p>
            <button type="button" className="desktop-soft-btn">Book time with me</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function VisibilityCard(props: UseSettingsResult) {
  return (
    <Card padded>
      <h2 className="desktop-card-title">Visibility</h2>
      <Rows>
        <SettingsRow icon={<GlobeIcon />} title="Public page enabled" helper="Make your booking page accessible via your handle." control={<Switch checked={props.bookingEnabled} onChange={props.setBookingEnabled} />} />
        <SettingsRow icon={<MailIcon />} title="Collect guest email before showing availability" helper="Ask for email before displaying availability options." control={<Switch checked={props.bookingCollectEmailFirst} onChange={props.setBookingCollectEmailFirst} />} />
        <SettingsRow icon={<SearchIcon />} title="Hide from search engines" helper="Prevent your page from appearing in search engine results." control={<Switch checked={props.bookingHideFromSearch} onChange={props.setBookingHideFromSearch} />} />
      </Rows>
    </Card>
  );
}

function AvailabilityCards(props: UseSettingsResult) {
  return (
    <>
      <Card padded><h2 className="desktop-card-title">Available days</h2><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{[1, 2, 3, 4, 5, 6, 0].map((day) => <button key={day} type="button" className={props.bookingWindowDays.includes(day) ? "desktop-soft-btn" : "desktop-ghost-btn"} onClick={() => props.toggleBookingWindowDay(day)}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]}</button>)}</div></Card>
      <Card padded><h2 className="desktop-card-title">Daily time window</h2><div className="desktop-form-grid three"><TimeField label="Start time" value={props.bookingWindowStart} onChange={props.setBookingWindowStart} /><TimeField label="End time" value={props.bookingWindowEnd} onChange={props.setBookingWindowEnd} /><SelectField label="Time zone" icon={<GlobeIcon />} value={props.bookingTimezone} onChange={props.setBookingTimezone} options={props.timezoneOptions} /></div></Card>
      <Card padded><h2 className="desktop-card-title">Slot setup</h2><div className="desktop-form-grid three"><SelectField label="Slot duration" icon={<ClockIcon />} value={String(props.bookingSlotLength)} onChange={(value) => props.setBookingSlotLength(Number(value) as UseSettingsResult["bookingSlotLength"])} options={["15", "30", "45", "60"]} /><SelectField label="Buffer between slots" icon={<ClockIcon />} value={String(props.bookingBuffer)} onChange={(value) => props.setBookingBuffer(Number(value))} options={["0", "5", "10", "15", "20", "30", "45", "60"]} /><SelectField label="Maximum days in advance" icon={<CalendarIcon />} value={String(props.bookingMaxDays)} onChange={(value) => props.setBookingMaxDays(Number(value))} options={["7", "14", "21", "30", "45", "60", "90"]} /></div></Card>
    </>
  );
}

function BookingRuleCards(props: UseSettingsResult) {
  return (
    <Card padded>
      <h2 className="desktop-card-title">Booking rules</h2>
      <Rows>
        <SettingsRow icon={<ClockIcon />} title="Minimum notice" helper={`${props.bookingAdvance} minutes before a booking can start.`} control={<select className="desktop-input-shell" value={props.bookingAdvance} onChange={(event) => props.setBookingAdvance(Number(event.target.value))}>{[0, 15, 30, 60, 120, 240, 720, 1440].map((value) => <option key={value} value={value}>{value >= 60 ? `${value / 60} hour${value === 60 ? "" : "s"}` : `${value} min`}</option>)}</select>} />
        <SettingsRow icon={<MailIcon />} title="Guest info requirements" helper="Ask visitors why they are requesting time with you." control={<Switch checked={props.bookingRequireReason} onChange={props.setBookingRequireReason} />} />
        <SettingsRow icon={<CalendarIcon />} title="Disable during office hours" helper="Block incoming bookings inside your defined work hours." control={<Switch checked={props.bookingDisableDuringOfficeHours} onChange={props.setBookingDisableDuringOfficeHours} />} />
        <SettingsRow icon={<SyncIcon />} title="Rescheduling and cancellation rules" helper="Let people reschedule or cancel bookings." control={<span style={{ display: "flex", gap: 8 }}><Switch checked={props.bookingAllowRescheduling} onChange={props.setBookingAllowRescheduling} /><Switch checked={props.bookingAllowCancellations} onChange={props.setBookingAllowCancellations} /></span>} />
      </Rows>
    </Card>
  );
}

function CalendarConnection({ provider, title, subtitle, connection, actionKey, savingKey, onConnect, onDisconnect }: { provider: "google" | "outlook" | "calendly" | "zoom"; title: string; subtitle: string; connection?: SyncConnection; actionKey: string; savingKey: string | null; onConnect: () => Promise<void>; onDisconnect: () => Promise<void> }) {
  const connected = connection?.connected === true;
  return (
    <div className="desktop-connection-row">
      <span className={`desktop-calendar-icon ${provider}`}>{provider === "google" ? "31" : provider === "outlook" ? "O" : provider === "calendly" ? "C" : "Z"}</span>
      <div><h3>{title}</h3><p>{connected ? subtitle : subtitle}</p></div>
      <span className={`desktop-status-text${connected ? " connected" : ""}`}><span className="desktop-dot" />{connected ? "Connected" : "Not connected"}</span>
      <button type="button" className={connected ? "desktop-ghost-btn" : "desktop-soft-btn"} onClick={() => void (connected ? onDisconnect() : onConnect())} disabled={savingKey === actionKey}>{savingKey === actionKey ? "Opening..." : connected ? "Manage" : "Connect"}</button>
    </div>
  );
}

function SyncRulesCard(props: UseSettingsResult) {
  return (
    <Card padded>
      <h2 className="desktop-card-title">Sync rules</h2>
      <Rows>
        <DirectionRow label="Google Calendar" direction={props.googleCalendarDirection} setDirection={props.setGoogleCalendarDirection} />
        <DirectionRow label="Outlook Calendar" direction={props.microsoftDirection} setDirection={props.setMicrosoftDirection} />
        <DirectionRow label="Calendly" direction={props.calendlyDirection} setDirection={props.setCalendlyDirection} />
        <DirectionRow label="Zoom" direction={props.zoomDirection} setDirection={props.setZoomDirection} />
      </Rows>
    </Card>
  );
}

function DirectionRow({ label, direction, setDirection }: { label: string; direction: SyncDirection; setDirection: (direction: SyncDirection) => void }) {
  return <SettingsRow icon={<SyncIcon />} title={label} helper="Choose how new items move between Toatre and this service." control={<select className="desktop-input-shell" value={direction} onChange={(event) => setDirection(event.target.value as SyncDirection)}><option value="sourceToToatre">Toatre receives new items</option><option value="toatreToSource">Toatre sends new toats</option><option value="twoWay">Two-way</option></select>} />;
}

function ConflictCards() {
  return <SimpleTabCards cards={["Treat busy events as unavailable", "Ignore tentative events", "Buffer before calendar events", "Buffer after calendar events", "Conflict warning behavior"]} />;
}

function SimpleTabCards({ cards }: { cards: string[] }) {
  return <Card padded><Rows>{cards.map((title) => <PersistentToggleRow key={title} title={title} />)}</Rows></Card>;
}

function PersistentToggleRow({ title }: { title: string }) {
  const [checked, setChecked] = useDesktopSettingState(`toggle.${title}`, title !== "Ignore tentative events");
  return <SettingsRow icon={<GearIcon />} title={title} helper="Keep this behavior simple and predictable." control={<Switch checked={checked} onChange={setChecked} />} />;
}

function useDesktopSettingState<T extends string | boolean>(key: string, fallback: T): [T, (value: T) => void] {
  const storageKey = `toatre.desktopSettings.${key}`;
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return fallback;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === null) return fallback;
    return (typeof fallback === "boolean" ? stored === "true" : stored) as T;
  });

  const updateValue = (next: T) => {
    setValue(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, String(next));
    }
  };

  return [value, updateValue];
}

function TextField({ label, value, onChange, countMax, multiline = false }: { label: string; value: string; onChange: (value: string) => void; countMax?: number; multiline?: boolean }) {
  return (
    <label className="desktop-field">
      <span className="desktop-field-label">{label}{countMax ? <span style={{ marginLeft: "auto" }}>{value.length} / {countMax}</span> : null}</span>
      {multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="desktop-field"><span className="desktop-field-label"><ClockIcon /> {label}</span><input type="time" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, icon, value, options, onChange, onBlur }: { label: string; icon: ReactNode; value: string; options: string[]; onChange: (value: string) => void; onBlur?: () => void }) {
  return <label className="desktop-field"><span className="desktop-field-label">{icon} {label}</span><select value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function Rows({ children }: { children: ReactNode }) {
  return <div className="desktop-row-list">{children}</div>;
}

function SettingsRow({ icon, title, helper, control }: { icon: ReactNode; title: string; helper: string; control: ReactNode }) {
  return <div className="desktop-setting-row">{icon}<div><h3>{title}</h3><p>{helper}</p></div><div>{control}</div></div>;
}

function Card({ children, padded = false }: { children: ReactNode; padded?: boolean }) {
  return <section className="desktop-panel-card">{padded ? <div className="desktop-card-pad">{children}</div> : children}</section>;
}

function Notice({ tone, message }: { tone: string; message: string }) {
  return <div className={`desktop-notice ${tone === "error" ? "error" : "success"}`}>{message}</div>;
}

function LoadingCard() {
  return <Card padded><p className="desktop-account-bio">Loading your settings...</p></Card>;
}

function SavedIndicator() {
  return <div className="desktop-saved-indicator"><span>✓</span> All changes saved automatically.</div>;
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return <button type="button" className={`desktop-switch${checked ? " active" : ""}`} onClick={() => onChange(!checked)} aria-pressed={checked}><span /></button>;
}

function Tabs<T extends string>({ active, items, onChange }: { active: T; items: Array<{ id: T; label: string }>; onChange: (id: T) => void }) {
  return <div className="desktop-tabs">{items.map((item) => <button key={item.id} type="button" className={active === item.id ? "active" : ""} onClick={() => onChange(item.id)}>{item.label}</button>)}</div>;
}

function bookingNotificationHelper(title: string) {
  if (title === "New booking request") return "Notify me when I receive a new booking request.";
  if (title === "Booking confirmed") return "Notify me when a booking is confirmed.";
  if (title === "Booking cancelled") return "Notify me when a booking is cancelled.";
  return "Notify me when a reschedule is requested.";
}

function Svg({ children }: { children: ReactNode }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>{children}</svg>; }
function BellIcon() { return <Svg><path d="M6.5 16.5h11l-1.2-1.4a3.2 3.2 0 0 1-.8-2.1V10a4.5 4.5 0 0 0-9 0v3a3.2 3.2 0 0 1-.8 2.1L4.5 16.5h2Z" stroke="currentColor" strokeWidth="1.8"/><path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
function CalendarIcon() { return <Svg><rect x="4" y="6" width="16" height="14" rx="4" stroke="currentColor" strokeWidth="1.8"/><path d="M8 3.5V8M16 3.5V8M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
function PersonIcon() { return <Svg><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
function PeopleIcon() { return <Svg><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 20a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 7a3 3 0 1 1 0 0.01M22 20a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
function AtIcon() { return <Svg><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M15 12a3 3 0 1 1-1.2-2.4V12a1.8 1.8 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
function GearIcon() { return <Svg><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M18 18l1.5 1.5M4.5 4.5 6 6M18 6l1.5-1.5M4.5 19.5 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
function SearchIcon() { return <Svg><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
function ChevronRightIcon() { return <Svg><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></Svg>; }
function GlobeIcon() { return <Svg><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3.5 12h17M12 3.5c2 2.2 3 5 3 8.5s-1 6.3-3 8.5M12 3.5c-2 2.2-3 5-3 8.5s1 6.3 3 8.5" stroke="currentColor" strokeWidth="1.4"/></Svg>; }
function SunIcon() { return <Svg><circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
function ClockIcon() { return <Svg><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7.5v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
function FolderIcon() { return <Svg><path d="M4 7.5h6l1.5 2H20v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-10Z" stroke="currentColor" strokeWidth="1.8"/></Svg>; }
function LightningIcon() { return <Svg><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></Svg>; }
function MailIcon() { return <Svg><rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="m6 8 6 5 6-5" stroke="currentColor" strokeWidth="1.8"/></Svg>; }
function PhoneIcon() { return <Svg><rect x="8" y="3" width="8" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M11 17h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
function DesktopIcon() { return <Svg><rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
function CopyIcon() { return <Svg><rect x="9" y="8" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M15 8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.8"/></Svg>; }
function EyeIcon() { return <Svg><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></Svg>; }
function SyncIcon() { return <Svg><path d="M20 7v5h-5M4 17v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18 12a6 6 0 0 0-10-4.5L4 12M6 12a6 6 0 0 0 10 4.5L20 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>; }
