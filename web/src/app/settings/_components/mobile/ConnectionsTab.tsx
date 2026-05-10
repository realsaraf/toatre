"use client";

import type { Dispatch, SetStateAction } from "react";
import type { SavedConnection, ConnectionDraft } from "../../_utils/settings-helpers";
import { styles } from "./mobile.styles";

interface ConnectionsTabProps {
  connections: SavedConnection[];
  connectionDraft: ConnectionDraft;
  setConnectionDraft: Dispatch<SetStateAction<ConnectionDraft>>;
  editingConnectionId: string | null;
  savingKey: string | null;
  saveConnection: () => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  editConnection: (connection: SavedConnection) => void;
  resetConnectionDraft: () => void;
}

export function ConnectionsTab({
  connections,
  connectionDraft,
  setConnectionDraft,
  editingConnectionId,
  savingKey,
  saveConnection,
  deleteConnection,
  editConnection,
  resetConnectionDraft,
}: ConnectionsTabProps) {
  return (
    <section style={styles.panelCard}>
      <div style={styles.sectionHead}>
        <div>
          <p style={styles.sectionEyebrow}>Connections</p>
          <h2 style={styles.sectionTitle}>People you work with</h2>
        </div>
      </div>

      <div style={styles.formGrid}>
        <div style={styles.inlineFields}>
          <label style={styles.fieldLabel}>
            Name
            <input value={connectionDraft.name} onChange={(event) => setConnectionDraft((current) => ({ ...current, name: event.target.value }))} style={styles.textInput} />
          </label>
          <label style={styles.fieldLabel}>
            Relationship
            <input value={connectionDraft.relationship} onChange={(event) => setConnectionDraft((current) => ({ ...current, relationship: event.target.value }))} style={styles.textInput} />
          </label>
        </div>

        <div style={styles.inlineFields}>
          <label style={styles.fieldLabel}>
            Phone
            <input value={connectionDraft.phone} onChange={(event) => setConnectionDraft((current) => ({ ...current, phone: event.target.value }))} style={styles.textInput} />
          </label>
          <label style={styles.fieldLabel}>
            Email
            <input value={connectionDraft.email} onChange={(event) => setConnectionDraft((current) => ({ ...current, email: event.target.value }))} style={styles.textInput} />
          </label>
        </div>

        <label style={styles.fieldLabel}>
          Handle
          <input value={connectionDraft.handle} onChange={(event) => setConnectionDraft((current) => ({ ...current, handle: event.target.value }))} style={styles.textInput} />
        </label>

        <label style={styles.fieldLabel}>
          Notes
          <textarea
            value={connectionDraft.notes}
            onChange={(event) => setConnectionDraft((current) => ({ ...current, notes: event.target.value }))}
            rows={4}
            style={{ ...styles.textInput, minHeight: 110, padding: 14, resize: "vertical" }}
          />
        </label>

        <div style={styles.inlineActions}>
          <button type="button" onClick={() => void saveConnection()} style={styles.primaryButton} disabled={savingKey === "connection-save"}>
            {savingKey === "connection-save"
              ? "Saving…"
              : editingConnectionId
                ? "Update connection"
                : "Add connection"}
          </button>
          {editingConnectionId ? (
            <button type="button" onClick={resetConnectionDraft} style={styles.secondaryButton}>
              Cancel edit
            </button>
          ) : null}
        </div>
      </div>

      {connections.length > 0 ? (
        <div style={styles.connectionList}>
          {connections.map((connection) => (
            <div key={connection.id} style={styles.connectionCard}>
              <div style={styles.connectionAvatar}>{connection.name.slice(0, 1).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.connectionName}>{connection.name}</p>
                <p style={styles.connectionMeta}>{connection.relationship || connection.email || connection.phone || "No details yet"}</p>
              </div>
              <div style={styles.inlineActions}>
                <button type="button" onClick={() => editConnection(connection)} style={styles.smallGhostButton}>Edit</button>
                <button
                  type="button"
                  onClick={() => void deleteConnection(connection.id)}
                  style={styles.smallDangerButton}
                  disabled={savingKey === `connection-delete-${connection.id}`}
                >
                  {savingKey === `connection-delete-${connection.id}` ? "Removing…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyConnectionCard}>No saved connections yet. Add people you coordinate with often.</div>
      )}
    </section>
  );
}
