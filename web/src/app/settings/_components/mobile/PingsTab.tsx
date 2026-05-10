"use client";

import { TOAT_KINDS, type NotificationPreferences } from "@/lib/settings/defaults";
import { KIND_LABELS } from "../../_utils/settings-helpers";
import { styles } from "./mobile.styles";

interface PingsTabProps {
  notificationPreferences: NotificationPreferences;
  savingKey: string | null;
  savePings: () => Promise<void>;
  toggleNotificationChannel: (kind: string, channel: keyof NotificationPreferences[string]) => void;
}

export function PingsTab({
  notificationPreferences,
  savingKey,
  savePings,
  toggleNotificationChannel,
}: PingsTabProps) {
  return (
    <section style={styles.panelCard}>
      <div style={styles.sectionHead}>
        <div>
          <p style={styles.sectionEyebrow}>Pings</p>
          <h2 style={styles.sectionTitle}>Notification rules</h2>
        </div>
      </div>

      <div style={styles.notificationList}>
        {TOAT_KINDS.map((kind) => (
          <div key={kind} style={styles.notificationRow}>
            <div>
              <div style={styles.notificationKind}>{KIND_LABELS[kind] ?? kind}</div>
              <div style={styles.notificationHint}>Choose how Toatre should Ping you for this kind.</div>
            </div>
            <div style={styles.channelGroup}>
              {(["push", "email", "sms"] as const).map((channel) => (
                <label key={channel} style={styles.channelPill}>
                  <input
                    type="checkbox"
                    checked={notificationPreferences[kind]?.[channel] ?? false}
                    onChange={() => toggleNotificationChannel(kind, channel)}
                    style={styles.checkbox}
                  />
                  {channel.toUpperCase()}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => void savePings()} style={styles.primaryButton} disabled={savingKey === "pings"}>
        {savingKey === "pings" ? "Saving…" : "Save Ping settings"}
      </button>
    </section>
  );
}
