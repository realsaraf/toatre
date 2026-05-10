"use client";

type BookingSlotLength = 15 | 30 | 45 | 60;

interface DesktopAvailabilitySectionProps {
  bookingWindowDays: number[];
  bookingWindowStart: string;
  bookingWindowEnd: string;
  bookingSlotLength: BookingSlotLength;
  bookingTimezone: string;
  timezoneOptions: string[];
  bookingBuffer: number;
  onToggleWindowDay: (dayValue: number) => void;
  onWindowStartChange: (value: string) => void;
  onWindowEndChange: (value: string) => void;
  onSlotLengthChange: (value: BookingSlotLength) => void;
  onTimezoneChange: (value: string) => void;
  onBufferChange: (value: number) => void;
}

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
] as const;

function parseTimeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatTimeLabel(t: string) {
  const [h, m] = t.split(":").map(Number);
  const hour = h ?? 0;
  const min = m ?? 0;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return min === 0 ? `${displayHour} ${period}` : `${displayHour}:${String(min).padStart(2, "0")} ${period}`;
}

export function DesktopAvailabilitySection({
  bookingWindowDays,
  bookingWindowStart,
  bookingWindowEnd,
  bookingSlotLength,
  bookingTimezone,
  timezoneOptions,
  bookingBuffer,
  onToggleWindowDay,
  onWindowStartChange,
  onWindowEndChange,
  onSlotLengthChange,
  onTimezoneChange,
  onBufferChange,
}: DesktopAvailabilitySectionProps) {
  return (
    <section className="desktop-settings-card" id="desktop-toatlink-availability">
      <div className="desktop-card-head">
        <div>
          <h2>Availability</h2>
          <p>Set when people can book time with you.</p>
        </div>
        <div className="dts-avail-actions">
          <button type="button" className="dts-action-ghost">＋ Add time off</button>
          <button type="button" className="dts-action-ghost">✦ AI setup</button>
        </div>
      </div>

      <div className="dts-avail-timeline">
        <div className="dts-avail-time-row">
          <div className="dts-avail-day-spacer" />
          <div className="dts-avail-bar-area">
            {["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"].map((t) => (
              <span key={t} className="dts-avail-time-tick">{t}</span>
            ))}
          </div>
        </div>
        {DAYS.map((day) => {
          const active = bookingWindowDays.includes(day.value);
          const startMin = parseTimeToMinutes(bookingWindowStart);
          const endMin = parseTimeToMinutes(bookingWindowEnd);
          const totalSpan = (21 - 6) * 60;
          const barLeft = Math.max(0, (startMin - 6 * 60) / totalSpan * 100);
          const barWidth = active ? Math.max(0, (endMin - startMin) / totalSpan * 100) : 0;
          return (
            <div key={day.value} className={`dts-avail-row${active ? " on" : ""}`}>
              <button
                type="button"
                className={`dts-day-toggle${active ? " on" : ""}`}
                onClick={() => onToggleWindowDay(day.value)}
                aria-pressed={active}
              >
                <span />
              </button>
              <span className="dts-day-label">{day.label}</span>
              <div className="dts-bar-track">
                {active ? (
                  <div className="dts-bar" style={{ left: `${barLeft}%`, width: `${barWidth}%` }}>
                    <span className="dts-bar-start">{formatTimeLabel(bookingWindowStart)}</span>
                    <span className="dts-bar-end">{formatTimeLabel(bookingWindowEnd)}</span>
                  </div>
                ) : (
                  <span className="dts-unavailable">Unavailable</span>
                )}
              </div>
              {active ? <button type="button" className="dts-avail-overflow">⋯</button> : <div className="dts-avail-overflow-spacer" />}
            </div>
          );
        })}
      </div>

      <div className="dts-slot-controls">
        <div>
          <span className="dts-slot-label">Slot length</span>
          <div className="desktop-choice-row">
            {([15, 30, 45, 60] as const).map((value) => (
              <button key={value} type="button" className={bookingSlotLength === value ? "active" : ""} onClick={() => onSlotLengthChange(value)}>
                {value === 60 ? "1h" : `${value}m`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="dts-slot-label">Time zone</span>
          <select value={bookingTimezone} onChange={(e) => onTimezoneChange(e.target.value)}>
            {timezoneOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <span className="dts-slot-label">Buffer between slots</span>
          <select value={bookingBuffer} onChange={(e) => onBufferChange(Number(e.target.value))}>
            {[0, 5, 10, 15, 20, 30, 45, 60].map((v) => (
              <option key={v} value={v}>{v === 0 ? "No buffer" : `${v} min`}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
