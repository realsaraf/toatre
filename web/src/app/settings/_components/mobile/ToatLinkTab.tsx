"use client";

import type { Dispatch, SetStateAction } from "react";
import type { BookingSlotLength } from "../../_utils/settings-helpers";
import { normalizeBookingSlotLength } from "../../_utils/settings-helpers";
import { styles } from "./mobile.styles";

interface ToatLinkTabProps {
  toatLinkUrl: string | null;
  bookingEnabled: boolean;
  setBookingEnabled: (v: boolean) => void;
  bookingGreetingMessage: string;
  setBookingGreetingMessage: (v: string) => void;
  bookingPageTitle: string;
  setBookingPageTitle: (v: string) => void;
  bookingMetaDescription: string;
  setBookingMetaDescription: (v: string) => void;
  bookingWindowDays: number[];
  bookingWindowStart: string;
  setBookingWindowStart: (v: string) => void;
  bookingWindowEnd: string;
  setBookingWindowEnd: (v: string) => void;
  bookingSlotLength: BookingSlotLength;
  setBookingSlotLength: (v: BookingSlotLength) => void;
  bookingBuffer: number;
  setBookingBuffer: (v: number) => void;
  bookingAdvance: number;
  setBookingAdvance: (v: number) => void;
  bookingMaxDays: number;
  setBookingMaxDays: (v: number) => void;
  bookingRequireReason: boolean;
  setBookingRequireReason: (v: boolean) => void;
  bookingDisableDuringOfficeHours: boolean;
  setBookingDisableDuringOfficeHours: (v: boolean) => void;
  bookingTimezone: string;
  setBookingTimezone: (v: string) => void;
  timezoneOptions: string[];
  loadingBooking: boolean;
  savingBooking: boolean;
  setBookingWindowDays: Dispatch<SetStateAction<number[]>>;
  saveBookingSettings: () => Promise<void>;
  toggleBookingWindowDay: (dayValue: number) => void;
}

export function ToatLinkTab({
  toatLinkUrl,
  bookingEnabled,
  setBookingEnabled,
  bookingGreetingMessage,
  setBookingGreetingMessage,
  bookingPageTitle,
  setBookingPageTitle,
  bookingMetaDescription,
  setBookingMetaDescription,
  bookingWindowDays,
  bookingWindowStart,
  setBookingWindowStart,
  bookingWindowEnd,
  setBookingWindowEnd,
  bookingSlotLength,
  setBookingSlotLength,
  bookingBuffer,
  setBookingBuffer,
  bookingAdvance,
  setBookingAdvance,
  bookingMaxDays,
  setBookingMaxDays,
  bookingRequireReason,
  setBookingRequireReason,
  bookingDisableDuringOfficeHours,
  setBookingDisableDuringOfficeHours,
  bookingTimezone,
  setBookingTimezone,
  timezoneOptions,
  loadingBooking,
  savingBooking,
  toggleBookingWindowDay,
  saveBookingSettings,
}: ToatLinkTabProps) {
  return (
    <section style={styles.panelCard}>
      <div style={styles.sectionHead}>
        <div>
          <p style={styles.sectionEyebrow}>Toat Link</p>
          <h2 style={styles.sectionTitle}>Your booking page</h2>
        </div>
        <div style={styles.statusChips}>
          <span style={bookingEnabled ? styles.statusChip : styles.statusChipMuted}>
            {bookingEnabled ? "Live" : "Off"}
          </span>
          {toatLinkUrl ? <span style={styles.helperText}>{toatLinkUrl}</span> : null}
        </div>
      </div>

      <label style={styles.toggleCard}>
        <div>
          <div style={styles.toggleTitle}>Enable your Toat Link</div>
          <div style={styles.toggleBody}>Let others request time with you using your public handle page.</div>
        </div>
        <input type="checkbox" checked={bookingEnabled} onChange={(event) => setBookingEnabled(event.target.checked)} style={styles.checkbox} />
      </label>

      <div style={styles.formGrid}>
        <label style={styles.fieldLabel}>
          Greeting message
          <textarea value={bookingGreetingMessage} onChange={(event) => setBookingGreetingMessage(event.target.value)} rows={4} style={{ ...styles.textInput, minHeight: 110, padding: 14, resize: "vertical" }} />
        </label>

        <label style={styles.fieldLabel}>
          Page title
          <input value={bookingPageTitle} onChange={(event) => setBookingPageTitle(event.target.value)} style={styles.textInput} />
        </label>

        <label style={styles.fieldLabel}>
          Meta description
          <textarea value={bookingMetaDescription} onChange={(event) => setBookingMetaDescription(event.target.value)} rows={3} style={{ ...styles.textInput, minHeight: 90, padding: 14, resize: "vertical" }} />
        </label>

        <div style={styles.inlineFields}>
          <label style={styles.fieldLabel}>
            Time zone
            <select value={bookingTimezone} onChange={(event) => setBookingTimezone(event.target.value)} style={styles.textInput}>
              {timezoneOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Slot length
            <select value={bookingSlotLength} onChange={(event) => setBookingSlotLength(normalizeBookingSlotLength(Number(event.target.value)))} style={styles.textInput}>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </label>
        </div>

        <div style={styles.inlineFields}>
          <label style={styles.fieldLabel}>
            Window start
            <input type="time" value={bookingWindowStart} onChange={(event) => setBookingWindowStart(event.target.value)} style={styles.textInput} />
          </label>
          <label style={styles.fieldLabel}>
            Window end
            <input type="time" value={bookingWindowEnd} onChange={(event) => setBookingWindowEnd(event.target.value)} style={styles.textInput} />
          </label>
        </div>

        <div style={styles.inlineFields}>
          <label style={styles.fieldLabel}>
            Buffer (minutes)
            <input type="number" min={0} step={5} value={bookingBuffer} onChange={(event) => setBookingBuffer(Number(event.target.value) || 0)} style={styles.textInput} />
          </label>
          <label style={styles.fieldLabel}>
            Advance notice (minutes)
            <input type="number" min={0} step={15} value={bookingAdvance} onChange={(event) => setBookingAdvance(Number(event.target.value) || 0)} style={styles.textInput} />
          </label>
        </div>

        <div style={styles.inlineFields}>
          <label style={styles.fieldLabel}>
            Max days ahead
            <input type="number" min={1} max={90} value={bookingMaxDays} onChange={(event) => setBookingMaxDays(Number(event.target.value) || 1)} style={styles.textInput} />
          </label>
          <label style={styles.fieldLabel}>
            Available days
            <div style={styles.providerRow}>
              {[1, 2, 3, 4, 5, 6, 0].map((dayValue) => (
                <button
                  key={dayValue}
                  type="button"
                  onClick={() => toggleBookingWindowDay(dayValue)}
                  style={{
                    ...styles.syncProviderButton,
                    ...(bookingWindowDays.includes(dayValue) ? styles.syncProviderButtonActive : {}),
                  }}
                >
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayValue]}
                </button>
              ))}
            </div>
          </label>
        </div>

        <label style={styles.toggleCard}>
          <div>
            <div style={styles.toggleTitle}>Require reason</div>
            <div style={styles.toggleBody}>Ask visitors why they are requesting time with you.</div>
          </div>
          <input type="checkbox" checked={bookingRequireReason} onChange={(event) => setBookingRequireReason(event.target.checked)} style={styles.checkbox} />
        </label>

        <label style={styles.toggleCard}>
          <div>
            <div style={styles.toggleTitle}>Disable during office hours</div>
            <div style={styles.toggleBody}>Block incoming bookings inside your defined work hours.</div>
          </div>
          <input type="checkbox" checked={bookingDisableDuringOfficeHours} onChange={(event) => setBookingDisableDuringOfficeHours(event.target.checked)} style={styles.checkbox} />
        </label>

        <button type="button" onClick={() => void saveBookingSettings()} style={styles.primaryButton} disabled={savingBooking || loadingBooking}>
          {savingBooking ? "Saving…" : "Save Toat Link settings"}
        </button>
      </div>
    </section>
  );
}
