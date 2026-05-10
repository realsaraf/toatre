export function ToatreLogo({ size = 36 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icon.png"
      alt=""
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        objectFit: "cover",
        display: "block",
      }}
      aria-hidden
    />
  );
}

export function SparkleIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1v2M7 11v2M1 7h2M11 7h2M3 3l1.5 1.5M9.5 9.5l1.5 1.5M11 3l-1.5 1.5M4.5 9.5L3 11" stroke="#6366F1" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export function ArrowRight() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden style={{ marginLeft: 4 }}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx={10} cy={10} r={9} stroke="#374151" strokeWidth={1.5} />
      <path d="M8 7l6 3-6 3V7z" fill="#374151" />
    </svg>
  );
}

export function SignalIcon() {
  return (
    <svg width={16} height={12} viewBox="0 0 16 12" fill="none" aria-hidden>
      <rect x={0} y={8} width={3} height={4} rx={0.5} fill="#111" />
      <rect x={4.5} y={5} width={3} height={7} rx={0.5} fill="#111" />
      <rect x={9} y={2} width={3} height={10} rx={0.5} fill="#111" />
      <rect x={13.5} y={0} width={2.5} height={12} rx={0.5} fill="#111" opacity="0.3" />
    </svg>
  );
}

export function WifiIcon() {
  return (
    <svg width={16} height={12} viewBox="0 0 16 12" fill="none" aria-hidden>
      <path d="M8 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill="#111" />
      <path d="M3.5 7a6.5 6.5 0 0 1 9 0" stroke="#111" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M1 4.5a10 10 0 0 1 14 0" stroke="#111" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export function BatteryIcon() {
  return (
    <svg width={24} height={12} viewBox="0 0 24 12" fill="none" aria-hidden>
      <rect x={0.5} y={0.5} width={20} height={11} rx={2.5} stroke="#111" strokeWidth={1} />
      <rect x={2} y={2} width={14} height={8} rx={1.5} fill="#111" />
      <path d="M22 4v4a2 2 0 0 0 0-4z" fill="#111" />
    </svg>
  );
}
