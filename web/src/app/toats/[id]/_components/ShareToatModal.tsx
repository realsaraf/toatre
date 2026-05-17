import { ShareIcon } from "@/components/mobile-ui";
import type { SavedConnection, ToatDetail } from "../_types";
import { toatTime, initials } from "../_utils";
import { shareModalStyles, buttonStyles } from "../_styles";

export function ShareToatModal({
  toat,
  connections,
  selectedConnectionIds,
  permission,
  busy,
  onClose,
  onToggleConnection,
  onPermissionChange,
  onCreateLink,
  onSend,
  onOpenConnections,
}: {
  toat: ToatDetail;
  connections: SavedConnection[];
  selectedConnectionIds: string[];
  permission: "view" | "edit";
  busy: string | null;
  onClose: () => void;
  onToggleConnection: (connectionId: string) => void;
  onPermissionChange: (permission: "view" | "edit") => void;
  onCreateLink: () => void;
  onSend: () => void;
  onOpenConnections: () => void;
}) {
  const time = toatTime(toat);

  return (
    <div style={shareModalStyles.shareOverlay}>
      <section style={shareModalStyles.shareSheet}>
        <div style={shareModalStyles.shareSheetHandle} />
        <div style={shareModalStyles.shareHeader}>
          <div>
            <p style={shareModalStyles.shareEyebrow}>Share toat</p>
            <h2 style={shareModalStyles.shareTitle}>Choose connections</h2>
          </div>
          <button type="button" onClick={onClose} style={shareModalStyles.shareCloseButton}>
            &times;
          </button>
        </div>

        <article style={shareModalStyles.sharePreviewCard}>
          <div style={shareModalStyles.sharePreviewIcon}>
            <ShareIcon size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={shareModalStyles.sharePreviewTitle}>{toat.title}</p>
            <p style={shareModalStyles.sharePreviewMeta}>
              {time ? new Date(time).toLocaleString() : "No time set"}
            </p>
          </div>
        </article>

        <div style={shareModalStyles.sharePeopleGrid}>
          {busy === "load" ? (
            <p style={shareModalStyles.shareHelper}>Loading connections\u2026</p>
          ) : null}
          {!busy && !connections.length ? (
            <button
              type="button"
              onClick={onOpenConnections}
              style={shareModalStyles.shareEmptyButton}
            >
              Add connections in Settings
            </button>
          ) : null}
          {connections.map((connection) => {
            const selected = selectedConnectionIds.includes(connection.id);
            return (
              <button
                key={connection.id}
                type="button"
                onClick={() => onToggleConnection(connection.id)}
                style={{
                  ...shareModalStyles.sharePersonButton,
                  ...(selected ? shareModalStyles.sharePersonButtonSelected : {}),
                }}
              >
                <span style={shareModalStyles.sharePersonAvatar}>
                  {initials(connection.name)}
                </span>
                <span style={shareModalStyles.sharePersonName}>{connection.name}</span>
                <span style={shareModalStyles.sharePersonRelationship}>
                  {connection.relationship}
                </span>
              </button>
            );
          })}
        </div>

        <div style={shareModalStyles.sharePermissionRow}>
          <button
            type="button"
            onClick={() => onPermissionChange("view")}
            style={{
              ...shareModalStyles.sharePermissionButton,
              ...(permission === "view" ? shareModalStyles.sharePermissionButtonActive : {}),
            }}
          >
            View only
          </button>
          <button
            type="button"
            onClick={() => onPermissionChange("edit")}
            style={{
              ...shareModalStyles.sharePermissionButton,
              ...(permission === "edit" ? shareModalStyles.sharePermissionButtonActive : {}),
            }}
          >
            Can edit
          </button>
        </div>

        <button
          type="button"
          onClick={onSend}
          style={{
            ...buttonStyles.primaryButton,
            background: "linear-gradient(135deg, #7C3AED, #5B3DF5)",
          }}
          disabled={Boolean(busy) || selectedConnectionIds.length === 0}
        >
          {busy === "send" ? "Sending\u2026" : "Send invite"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
          <span style={{ fontSize: 11, color: "#C4C4D4", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
        </div>

        <button
          type="button"
          onClick={onCreateLink}
          disabled={Boolean(busy)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "12px 16px",
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,0.07)",
            background: "#F9F9FB",
            cursor: busy ? "default" : "pointer",
            textAlign: "left",
          }}
        >
          <span style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: "rgba(109,40,217,0.09)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🔗</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "#111827" }}>
              {busy === "link" ? "Copying\u2026" : "Copy public link"}
            </span>
            <span style={{ display: "block", fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
              Anyone with this link can view
            </span>
          </span>
          <span style={{ fontSize: 16, color: "#D1D5DB", flexShrink: 0 }}>›</span>
        </button>
      </section>
    </div>
  );
}
