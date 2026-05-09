"use client";

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6B7280" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label}
    </div>
  );
}

export function WaveIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 3 }} aria-hidden>
      <rect x={1} y={6} width={2} height={6} rx={1} fill="#8B5CF6" />
      <rect x={5} y={3} width={2} height={12} rx={1} fill="#8B5CF6" />
      <rect x={9} y={5} width={2} height={8} rx={1} fill="#8B5CF6" />
      <rect x={13} y={2} width={2} height={14} rx={1} fill="#8B5CF6" />
    </svg>
  );
}

export function MicIcon({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden>
      <rect x={17} y={6} width={18} height={26} rx={9} fill="#FFFFFF" />
      <path d="M12 24C12 31.732 18.268 38 26 38C33.732 38 40 31.732 40 24" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
      <path d="M26 38V45" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
      <path d="M18 46H34" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}

export function SpinIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" className="animate-spin" aria-hidden>
      <circle cx={7} cy={7} r={5} stroke="rgba(99,102,241,0.3)" strokeWidth={2} />
      <path d="M7 2a5 5 0 0 1 5 5" stroke="#6366F1" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function SpinIconLg() {
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" fill="none" className="animate-spin" aria-hidden>
      <circle cx={14} cy={14} r={11} stroke="rgba(99,102,241,0.25)" strokeWidth={3} />
      <path d="M14 3a11 11 0 0 1 11 11" stroke="#6366F1" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 13 13" fill="none" aria-hidden>
      <rect x={1} y={5} width={11} height={8} rx={2} stroke="#6B7280" strokeWidth={1.2} />
      <path d="M4 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="#6B7280" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}
