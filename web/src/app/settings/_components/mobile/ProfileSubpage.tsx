import type { UseSettingsResult } from "../../_hooks/useSettings";
import { iosStyles, SettingsGroup, SettingsRow, ToggleRow } from "./SettingsIOS";

const styles = {
  photoWrap: { display: "grid", placeItems: "center", gap: 10, padding: "4px 0 10px" },
  photoShell: { position: "relative" as const, width: 104, height: 104 },
  photoEdit: {
    position: "absolute" as const,
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "3px solid #fff",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #5b3df5, #7c3aed)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 850,
    boxShadow: "0 12px 28px rgba(91,61,245,0.22)",
  },
};

export function ProfileSubpage(props: UseSettingsResult) {
  const phone = (props.phoneState?.reminderPhone ?? props.phoneDraft) || "Not set";

  return (
    <div style={iosStyles.stack}>
      <div style={styles.photoWrap}>
        <div style={styles.photoShell}>
          <div style={{ position: "absolute", inset: 0, transform: "scale(1.8)", transformOrigin: "top left", pointerEvents: "none" }}>
            {props.user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={props.user.photoURL} alt={props.displayName} referrerPolicy="no-referrer" style={{ width: 58, height: 58, borderRadius: 22, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 58, height: 58, borderRadius: 22, display: "grid", placeItems: "center", background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "#fff", fontWeight: 850 }}>{props.displayName.slice(0, 1)}</div>
            )}
          </div>
          <span style={styles.photoEdit}>+</span>
        </div>
      </div>

      <SettingsGroup>
        <SettingsRow title="Full name" value={props.displayName} />
        <SettingsRow title="Email" value={props.email} />
        <SettingsRow title="Phone" value={phone} />
        <SettingsRow title="Time zone" control={<select value={props.timezone} onChange={(event) => props.setTimezone(event.target.value)} style={iosStyles.select}>{props.timezoneOptions.map((option) => <option key={option}>{option}</option>)}</select>} />
        <SettingsRow title="Bio" value={props.bookingMetaDescription || "Not set"} last />
      </SettingsGroup>

      <button type="button" style={iosStyles.button} onClick={() => void props.saveProfile()} disabled={props.savingKey === "profile"}>
        {props.savingKey === "profile" ? "Saving..." : "Save profile"}
      </button>

      <SettingsGroup label="Phone Pings">
        <SettingsRow title="Reminder phone" control={<input value={props.phoneDraft} onChange={(event) => props.setPhoneDraft(event.target.value)} placeholder="+1 555 555 5555" style={iosStyles.input} />} />
        {props.phoneState?.phoneVerified ? (
          <SettingsRow title="Verification" value="Phone verified" />
        ) : (
          <SettingsRow title="Verification code" control={<input value={props.verificationCode} onChange={(event) => props.setVerificationCode(event.target.value)} placeholder="123456" style={iosStyles.input} />} />
        )}
        <ToggleRow title="SMS Pings" body="Send reminder Pings to your verified phone number." checked={props.smsEnabled} onChange={props.setSmsEnabled} last />
      </SettingsGroup>
      {!props.phoneState?.phoneVerified ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button type="button" style={iosStyles.button} onClick={() => void props.sendPhoneCode()} disabled={props.savingKey === "phone-start"}>
            {props.savingKey === "phone-start" ? "Sending..." : "Send code"}
          </button>
          <button type="button" style={iosStyles.button} onClick={() => void props.verifyPhoneCode()} disabled={props.savingKey === "phone-check"}>
            {props.savingKey === "phone-check" ? "Verifying..." : "Verify code"}
          </button>
        </div>
      ) : null}
      <button type="button" style={iosStyles.button} onClick={() => void props.savePhoneSettings()} disabled={props.savingKey === "phone-save"}>
        {props.savingKey === "phone-save" ? "Saving..." : "Save phone settings"}
      </button>
    </div>
  );
}