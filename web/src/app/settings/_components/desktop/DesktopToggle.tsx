"use client";

export interface DesktopToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description: string;
  badge?: string;
}

export function DesktopToggle({ checked, onChange, title, description, badge }: DesktopToggleProps) {
  return (
    <label className="desktop-toggle-card">
      <div>
        <div className="desktop-toggle-title-row">
          <strong>{title}</strong>
          {badge ? <span className="desktop-pro-pill muted">{badge}</span> : null}
        </div>
        <p>{description}</p>
      </div>
      <button
        type="button"
        className={`desktop-toggle-switch${checked ? " active" : ""}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span></span>
      </button>
    </label>
  );
}
