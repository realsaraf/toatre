import { TOAT_KINDS, type NotificationPreferences } from "@/lib/settings/defaults";
import type { UseSettingsResult } from "../../_hooks/useSettings";
import { iosStyles, SettingsGroup, ToggleRow } from "./SettingsIOS";

export function NotificationsSubpage(props: UseSettingsResult & { notificationPreferences: NotificationPreferences }) {
  const allPush = TOAT_KINDS.every((kind) => props.notificationPreferences[kind]?.push);
  const allEmail = TOAT_KINDS.every((kind) => props.notificationPreferences[kind]?.email);
  const smsEnabled = TOAT_KINDS.some((kind) => props.notificationPreferences[kind]?.sms);
  const setChannelForAll = (channel: keyof NotificationPreferences[string], next: boolean) => {
    for (const kind of TOAT_KINDS) {
      if ((props.notificationPreferences[kind]?.[channel] ?? false) !== next) props.toggleNotificationChannel(kind, channel);
    }
  };

  return (
    <div style={iosStyles.stack}>
      <SettingsGroup label="In-app Pings">
        <ToggleRow title="Booking requests" body="Send a Ping when someone books with you" checked={allPush} onChange={(next) => setChannelForAll("push", next)} />
        <ToggleRow title="Toats shared with you" body="Send a Ping when someone shares a toat" checked={allPush} onChange={(next) => setChannelForAll("push", next)} />
        <ToggleRow title="Upcoming toats" body="Send Pings about upcoming toats and bookings" checked={allPush} onChange={(next) => setChannelForAll("push", next)} last />
      </SettingsGroup>

      <SettingsGroup label="Email Pings">
        <ToggleRow title="Booking confirmations" body="Receive email for new and upcoming bookings" checked={allEmail} onChange={(next) => setChannelForAll("email", next)} />
        <ToggleRow title="Weekly summary" body="Get a weekly summary of your toats and bookings" checked={allEmail} onChange={(next) => setChannelForAll("email", next)} />
        <ToggleRow title="SMS reminders" body="Use your verified phone for urgent reminder Pings" checked={smsEnabled} onChange={(next) => setChannelForAll("sms", next)} last />
      </SettingsGroup>

      <button type="button" style={iosStyles.button} onClick={() => void props.savePings()} disabled={props.savingKey === "pings"}>
        {props.savingKey === "pings" ? "Saving..." : "Save Ping settings"}
      </button>
    </div>
  );
}