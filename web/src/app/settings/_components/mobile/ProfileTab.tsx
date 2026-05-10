"use client";

import type { SettingsResponse } from "../../_utils/settings-helpers";
import { styles } from "./mobile.styles";

interface ProfileTabProps {
  settingsData: SettingsResponse | null;
  savingKey: string | null;
  timezone: string;
  setTimezone: (v: string) => void;
  workStart: string;
  setWorkStart: (v: string) => void;
  workEnd: string;
  setWorkEnd: (v: string) => void;
  voiceRetention: boolean;
  setVoiceRetention: (v: boolean) => void;
  handleDraft: string;
  setHandleDraft: (v: string) => void;
  phoneDraft: string;
  setPhoneDraft: (v: string) => void;
  verificationCode: string;
  setVerificationCode: (v: string) => void;
  smsEnabled: boolean;
  setSmsEnabled: (v: boolean) => void;
  timezoneOptions: string[];
  phoneState: SettingsResponse["settings"] | null | undefined;
  toatLinkUrl: string | null;
  saveProfile: () => Promise<void>;
  saveHandle: () => Promise<void>;
  sendPhoneCode: () => Promise<void>;
  verifyPhoneCode: () => Promise<void>;
  savePhoneSettings: () => Promise<void>;
}

export function ProfileTab({
  savingKey,
  timezone,
  setTimezone,
  workStart,
  setWorkStart,
  workEnd,
  setWorkEnd,
  voiceRetention,
  setVoiceRetention,
  handleDraft,
  setHandleDraft,
  phoneDraft,
  setPhoneDraft,
  verificationCode,
  setVerificationCode,
  smsEnabled,
  setSmsEnabled,
  timezoneOptions,
  phoneState,
  toatLinkUrl,
  saveProfile,
  saveHandle,
  sendPhoneCode,
  verifyPhoneCode,
  savePhoneSettings,
}: ProfileTabProps) {
  return (
    <section style={styles.panelCard}>
      <div style={styles.sectionHead}>
        <div>
          <p style={styles.sectionEyebrow}>General</p>
          <h2 style={styles.sectionTitle}>Profile and time settings</h2>
        </div>
      </div>

      <div style={styles.formGrid}>
        <div style={styles.inlineFields}>
          <label style={styles.fieldLabel}>
            Time zone
            <select value={timezone} onChange={(event) => setTimezone(event.target.value)} style={styles.textInput}>
              {timezoneOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Work start
            <input type="time" value={workStart} onChange={(event) => setWorkStart(event.target.value)} style={styles.textInput} />
          </label>
        </div>

        <div style={styles.inlineFields}>
          <label style={styles.fieldLabel}>
            Work end
            <input type="time" value={workEnd} onChange={(event) => setWorkEnd(event.target.value)} style={styles.textInput} />
          </label>
          <label style={styles.fieldLabel}>
            Voice retention
            <div style={styles.toggleCard}>
              <div>
                <div style={styles.toggleTitle}>Keep capture audio</div>
                <div style={styles.toggleBody}>Retain original voice captures for review and follow-up.</div>
              </div>
              <input type="checkbox" checked={voiceRetention} onChange={(event) => setVoiceRetention(event.target.checked)} style={styles.checkbox} />
            </div>
          </label>
        </div>

        <button type="button" onClick={() => void saveProfile()} style={styles.primaryButton} disabled={savingKey === "profile"}>
          {savingKey === "profile" ? "Saving…" : "Save general settings"}
        </button>
      </div>

      <div style={styles.sectionDivider} />

      <div style={styles.formGrid}>
        <label style={styles.fieldLabel}>
          Handle
          <div style={styles.handleField}>
            <span style={styles.handlePrefix}>@</span>
            <input value={handleDraft} onChange={(event) => setHandleDraft(event.target.value)} style={styles.handleInput} placeholder="yourhandle" />
          </div>
        </label>

        <div style={styles.inlineActions}>
          <button type="button" onClick={() => void saveHandle()} style={styles.primaryButton} disabled={savingKey === "handle"}>
            {savingKey === "handle" ? "Saving…" : "Save handle"}
          </button>
          {toatLinkUrl ? <span style={styles.helperText}>{toatLinkUrl}</span> : null}
        </div>
      </div>

      <div style={styles.sectionDivider} />

      <div style={styles.formGrid}>
        <label style={styles.fieldLabel}>
          Reminder phone
          <input value={phoneDraft} onChange={(event) => setPhoneDraft(event.target.value)} style={styles.textInput} placeholder="+1 555 555 5555" />
        </label>

        {phoneState?.phoneVerified ? (
          <div style={styles.statusChips}>
            <span style={styles.statusChip}>Phone verified</span>
            <span style={styles.helperText}>{phoneState.reminderPhone ?? phoneDraft}</span>
          </div>
        ) : (
          <div style={styles.inlineActions}>
            <button type="button" onClick={() => void sendPhoneCode()} style={styles.secondaryButton} disabled={savingKey === "phone-start"}>
              {savingKey === "phone-start" ? "Sending…" : "Send verification code"}
            </button>
            <span style={styles.helperText}>Verify a phone number to allow SMS Pings.</span>
          </div>
        )}

        {phoneState?.pendingPhone && !phoneState.phoneVerified ? (
          <div style={styles.inlineFields}>
            <label style={styles.fieldLabel}>
              Verification code
              <input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} style={styles.textInput} placeholder="123456" />
            </label>
            <div style={{ display: "flex", alignItems: "end" }}>
              <button type="button" onClick={() => void verifyPhoneCode()} style={styles.primaryButton} disabled={savingKey === "phone-check"}>
                {savingKey === "phone-check" ? "Verifying…" : "Verify code"}
              </button>
            </div>
          </div>
        ) : null}

        <label style={styles.toggleCard}>
          <div>
            <div style={styles.toggleTitle}>SMS Pings</div>
            <div style={styles.toggleBody}>Send reminder Pings to your verified phone number.</div>
          </div>
          <input type="checkbox" checked={smsEnabled} onChange={(event) => setSmsEnabled(event.target.checked)} style={styles.checkbox} />
        </label>

        <button type="button" onClick={() => void savePhoneSettings()} style={styles.secondaryButton} disabled={savingKey === "phone-save"}>
          {savingKey === "phone-save" ? "Saving…" : "Save phone settings"}
        </button>
      </div>
    </section>
  );
}
