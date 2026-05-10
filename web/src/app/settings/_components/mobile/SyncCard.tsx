"use client";

import type { SyncConnection, SyncDirection } from "../../_utils/settings-helpers";
import { SYNC_DIRECTION_OPTIONS, formatSyncDate } from "../../_utils/settings-helpers";
import { styles } from "./mobile.styles";

interface SyncCardProps {
  connection: SyncConnection | undefined;
  title: string;
  description: string;
  direction: SyncDirection;
  setDirection: (value: SyncDirection) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onRun: () => void;
  actionKey: string;
  runKey: string;
  mark: string;
  savingKey: string | null;
}

export function SyncCard({
  connection,
  title,
  description,
  direction,
  setDirection,
  onConnect,
  onDisconnect,
  onRun,
  actionKey,
  runKey,
  mark,
  savingKey,
}: SyncCardProps) {
  return (
    <div style={styles.syncCard}>
      <div style={styles.syncCardHead}>
        <div style={styles.syncTitleRow}>
          <span style={styles.providerIcon}>{mark}</span>
          <div>
            <div style={styles.syncCardTitle}>{title}</div>
            <p style={styles.helperText}>{description}</p>
          </div>
        </div>
        <div style={styles.statusChips}>
          <span style={connection?.connected ? styles.statusChip : styles.statusChipMuted}>
            {connection?.connected ? "Connected" : "Not connected"}
          </span>
        </div>
      </div>

      <div style={styles.directionList}>
        {SYNC_DIRECTION_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setDirection(option.id)}
            style={{
              ...styles.directionOption,
              ...(direction === option.id ? styles.directionOptionActive : {}),
            }}
          >
            <span style={styles.radioMark}>{direction === option.id ? "●" : "○"}</span>
            <span>
              <strong style={styles.directionTitle}>{option.title}</strong>
              <span style={styles.directionBody}>{option.body}</span>
            </span>
          </button>
        ))}
      </div>

      {connection?.lastSyncedAt ? (
        <p style={styles.helperText}>Last synced {formatSyncDate(connection.lastSyncedAt)}</p>
      ) : null}

      <div style={styles.inlineActions}>
        <button
          type="button"
          onClick={() => {
            if (connection?.connected) {
              onDisconnect();
              return;
            }
            onConnect();
          }}
          style={styles.primaryButton}
          disabled={savingKey === actionKey || savingKey === runKey}
        >
          {savingKey === actionKey
            ? `Opening ${title}…`
            : connection?.connected
              ? `Pause ${title} sync`
              : `Connect ${title}`}
        </button>
        {connection?.connected ? (
          <button
            type="button"
            onClick={onRun}
            style={styles.secondaryButton}
            disabled={savingKey === actionKey || savingKey === runKey}
          >
            {savingKey === runKey ? "Syncing…" : "Sync now"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
