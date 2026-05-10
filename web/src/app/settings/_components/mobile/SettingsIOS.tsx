import type { CSSProperties, ReactNode } from "react";
import { ChevronRightIcon } from "@/components/mobile-ui";

export const iosStyles: Record<string, CSSProperties> = {
  stack: { display: "grid", gap: 18 },
  sectionLabel: { margin: "0 0 8px", fontSize: 14, fontWeight: 780, color: "#6b7280" },
  group: {
    borderRadius: 20,
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(229,231,235,0.74)",
    boxShadow: "0 18px 48px rgba(31,41,55,0.045)",
    overflow: "hidden",
  },
  row: {
    width: "100%",
    minHeight: 58,
    border: "none",
    borderBottom: "1px solid rgba(99,102,241,0.10)",
    background: "transparent",
    padding: "13px 14px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto 16px",
    gap: 10,
    alignItems: "center",
    textAlign: "left",
    color: "inherit",
  },
  rowNoChevron: { gridTemplateColumns: "minmax(0, 1fr) auto" },
  title: { margin: 0, fontSize: 13, fontWeight: 850, color: "#101a44" },
  body: { margin: "3px 0 0", fontSize: 12, lineHeight: 1.35, color: "#6b7280" },
  value: {
    fontSize: 12,
    fontWeight: 760,
    color: "#52607e",
    textAlign: "right",
    maxWidth: 150,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  input: {
    width: "100%",
    minWidth: 0,
    border: "none",
    background: "transparent",
    color: "#101a44",
    font: "inherit",
    fontSize: 13,
    fontWeight: 800,
    outline: "none",
    textAlign: "right",
  },
  select: {
    maxWidth: 174,
    border: "none",
    background: "transparent",
    color: "#52607e",
    font: "inherit",
    fontSize: 12,
    fontWeight: 760,
    outline: "none",
    textAlign: "right",
  },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 999,
    border: "none",
    padding: 2,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(15,23,42,0.18)",
  },
  button: {
    minHeight: 48,
    borderRadius: 16,
    border: "1px solid rgba(91,61,245,0.18)",
    background: "rgba(255,255,255,0.9)",
    color: "#5b3df5",
    fontSize: 13,
    fontWeight: 850,
    cursor: "pointer",
  },
};

export function SettingsGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section>
      {label ? <p style={iosStyles.sectionLabel}>{label}</p> : null}
      <div style={iosStyles.group}>{children}</div>
    </section>
  );
}

export function SettingsRow({
  title,
  body,
  value,
  control,
  onClick,
  last = false,
}: {
  title: string;
  body?: string;
  value?: string;
  control?: ReactNode;
  onClick?: () => void;
  last?: boolean;
}) {
  const content = control ?? (value ? <span style={iosStyles.value}>{value}</span> : <span />);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{ ...iosStyles.row, borderBottom: last ? "none" : iosStyles.row.borderBottom, cursor: onClick ? "pointer" : "default" }}
    >
      <span>
        <p style={iosStyles.title}>{title}</p>
        {body ? <p style={iosStyles.body}>{body}</p> : null}
      </span>
      {content}
      <ChevronRightIcon size={16} />
    </button>
  );
}

export function SettingsNumberRow({
  title,
  body,
  value,
  suffix,
  onChange,
  last = false,
}: {
  title: string;
  body: string;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
  last?: boolean;
}) {
  return (
    <SettingsRow
      title={title}
      body={body}
      control={
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} style={{ ...iosStyles.input, width: 52 }} />
          <span style={iosStyles.value}>{suffix}</span>
        </label>
      }
      last={last}
    />
  );
}

export function ToggleRow({
  title,
  body,
  checked,
  onChange,
  last = false,
}: {
  title: string;
  body?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  return (
    <div style={{ ...iosStyles.row, ...iosStyles.rowNoChevron, borderBottom: last ? "none" : iosStyles.row.borderBottom }}>
      <span>
        <p style={iosStyles.title}>{title}</p>
        {body ? <p style={iosStyles.body}>{body}</p> : null}
      </span>
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        style={{ ...iosStyles.switch, justifyContent: checked ? "flex-end" : "flex-start", background: checked ? "linear-gradient(135deg, #7c3aed, #5b3df5)" : "#dce1ea" }}
      >
        <span style={iosStyles.knob} />
      </button>
    </div>
  );
}

export function formatTime(value: string) {
  const [hourText = "0", minute = "00"] = value.split(":");
  const hour = Number(hourText);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

export function IntegrationRow({
  title,
  email,
  connection,
  connect,
  disconnect,
  mark,
  last,
}: {
  title: string;
  email?: string;
  connection?: { connected: boolean };
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  mark: string;
  last?: boolean;
}) {
  const connected = connection?.connected === true;

  return (
    <button
      type="button"
      onClick={() => void (connected ? disconnect() : connect())}
      style={{ ...iosStyles.row, gridTemplateColumns: "38px minmax(0, 1fr) auto 16px", borderBottom: last ? "none" : iosStyles.row.borderBottom }}
    >
      <span style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center", background: "rgba(91,61,245,0.1)", color: "#5b3df5", fontSize: 12, fontWeight: 900 }}>{mark}</span>
      <span>
        <p style={iosStyles.title}>{title}</p>
        {email ? <p style={iosStyles.body}>{email}</p> : null}
      </span>
      <span style={{ ...iosStyles.value, color: connected ? "#16a34a" : "#7c3aed" }}>{connected ? "Connected" : "Connect"}</span>
      <ChevronRightIcon size={16} />
    </button>
  );
}