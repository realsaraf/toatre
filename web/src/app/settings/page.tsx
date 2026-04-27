"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  AppBrand,
  BottomTabBar,
  CalendarIcon,
  InboxIcon,
  PeopleIcon,
  SearchIcon,
  TimelineIcon,
  UserAvatar,
} from "@/components/mobile-ui";
import { TOAT_KINDS, type NotificationPreferences } from "@/lib/settings/defaults";
import { useAuth } from "@/lib/auth/auth-context";
import type { ToatKind } from "@/types";

type SettingsTab = "profile" | "phone" | "handle" | "pings";
type NoticeTone = "idle" | "success" | "error";

interface SettingsResponse {
  profile: {
    displayName: string | null;
    email: string | null;
    handle: string | null;
    photoUrl: string | null;
  };
  settings: {
    timezone: string;
    voiceRetention: boolean;
    smsEnabled: boolean;
    reminderPhone: string | null;
    pendingPhone: string | null;
    phoneVerified: boolean;
    phoneVerifiedAt: string | null;
    workStart: string;
    workEnd: string;
    notificationPreferences: NotificationPreferences;
  };
}

const SETTINGS_TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "profile", label: "General" },
  { id: "phone", label: "Phone" },
  { id: "handle", label: "Handle" },
  { id: "pings", label: "Pings" },
];

const KIND_LABELS: Record<ToatKind, string> = {
  task: "Tasks",
  event: "Events",
  meeting: "Meetings",
  idea: "Ideas",
  errand: "Errands",
  deadline: "Deadlines",
};

const PROVIDER_LABELS: Record<string, string> = {
  "google.com": "Google",
  "apple.com": "Apple",
  password: "Email link",
  phone: "Phone",
};

function getTimezoneOptions(currentTimezone: string) {
  if (typeof Intl.supportedValuesOf === "function") {
    const values = Intl.supportedValuesOf("timeZone");
    return values.includes(currentTimezone) ? values : [currentTimezone, ...values];
  }

  return [currentTimezone, "UTC"];
}

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [settingsData, setSettingsData] = useState<SettingsResponse | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string }>({ tone: "idle", message: "" });

  const [timezone, setTimezone] = useState("");
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:30");
  const [voiceRetention, setVoiceRetention] = useState(false);
  const [handleDraft, setHandleDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);

  const timezoneOptions = useMemo(() => getTimezoneOptions(timezone || Intl.DateTimeFormat().resolvedOptions().timeZone), [timezone]);

  const providerLabels = useMemo(() => {
    if (!user) {
      return [] as string[];
    }

    const labels = user.providerData
      .map((provider) => PROVIDER_LABELS[provider.providerId] ?? provider.providerId)
      .filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);

    return labels.length ? labels : ["Email link"];
  }, [user]);

  const applySettingsPayload = useCallback((payload: SettingsResponse) => {
    setSettingsData(payload);
    setTimezone(payload.settings.timezone);
    setWorkStart(payload.settings.workStart);
    setWorkEnd(payload.settings.workEnd);
    setVoiceRetention(payload.settings.voiceRetention);
    setHandleDraft(payload.profile.handle ?? "");
    setPhoneDraft(payload.settings.pendingPhone ?? payload.settings.reminderPhone ?? "");
    setSmsEnabled(payload.settings.smsEnabled);
    setNotificationPreferences(payload.settings.notificationPreferences);
  }, []);

  const authorizedFetch = useCallback(async (input: string, init?: RequestInit) => {
    if (!user) {
      throw new Error("Sign in required");
    }

    const token = await user.getIdToken();
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);

    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(input, {
      ...init,
      headers,
    });
  }, [user]);

  const loadSettings = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoadingState(true);
    try {
      const response = await authorizedFetch("/api/settings", { method: "GET" });
      const data = await readJsonResponse<SettingsResponse & { error?: string }>(response);

      if (!response.ok) {
        throw new Error(data?.error ?? "Couldn't load your settings.");
      }

      if (!data) {
        throw new Error("Couldn't load your settings.");
      }

      applySettingsPayload(data);
      setNotice((current) => (current.tone === "error" ? { tone: "idle", message: "" } : current));
    } catch (error) {
      console.error("[settings/load]", error);
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Couldn't load your settings." });
    } finally {
      setLoadingState(false);
    }
  }, [applySettingsPayload, authorizedFetch, user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadSettings();
  }, [loadSettings, user]);

  const setSuccess = (message: string) => setNotice({ tone: "success", message });
  const setError = (message: string) => setNotice({ tone: "error", message });

  const saveProfile = useCallback(async () => {
    setSavingKey("profile");
    try {
      const response = await authorizedFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ timezone, workStart, workEnd, voiceRetention }),
      });
      const data = await readJsonResponse<SettingsResponse & { error?: string }>(response);
      if (!response.ok) {
        throw new Error(data?.error ?? "Couldn't save your profile settings.");
      }

      if (!data) {
        throw new Error("Couldn't save your profile settings.");
      }

      applySettingsPayload(data);
      setSuccess("General settings updated.");
    } catch (error) {
      console.error("[settings/profile]", error);
      setError(error instanceof Error ? error.message : "Couldn't save your profile settings.");
    } finally {
      setSavingKey(null);
    }
  }, [applySettingsPayload, authorizedFetch, timezone, voiceRetention, workEnd, workStart]);

  const saveHandle = useCallback(async () => {
    setSavingKey("handle");
    try {
      const response = await authorizedFetch("/api/auth/profile", {
        method: "POST",
        body: JSON.stringify({ handle: handleDraft.replace(/^@+/, "") }),
      });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(data?.error ?? "Couldn't update your handle.");
      }

      await loadSettings();
      setSuccess("Handle updated.");
    } catch (error) {
      console.error("[settings/handle]", error);
      setError(error instanceof Error ? error.message : "Couldn't update your handle.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, handleDraft, loadSettings]);

  const sendPhoneCode = useCallback(async () => {
    setSavingKey("phone-start");
    try {
      const response = await authorizedFetch("/api/twilio/verify/start", {
        method: "POST",
        body: JSON.stringify({ phone: phoneDraft }),
      });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(data?.error ?? "Couldn't send a verification code.");
      }

      await loadSettings();
      setSuccess("Verification code sent.");
    } catch (error) {
      console.error("[settings/phone/start]", error);
      setError(error instanceof Error ? error.message : "Couldn't send a verification code.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, loadSettings, phoneDraft]);

  const verifyPhoneCode = useCallback(async () => {
    setSavingKey("phone-check");
    try {
      const response = await authorizedFetch("/api/twilio/verify/check", {
        method: "POST",
        body: JSON.stringify({ phone: phoneDraft, code: verificationCode }),
      });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(data?.error ?? "Couldn't verify that code.");
      }

      setVerificationCode("");
      await loadSettings();
      setSuccess("Phone verified for SMS Pings.");
    } catch (error) {
      console.error("[settings/phone/check]", error);
      setError(error instanceof Error ? error.message : "Couldn't verify that code.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, loadSettings, phoneDraft, verificationCode]);

  const savePhoneSettings = useCallback(async () => {
    setSavingKey("phone-save");
    try {
      const response = await authorizedFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ smsEnabled }),
      });
      const data = await readJsonResponse<SettingsResponse & { error?: string }>(response);
      if (!response.ok) {
        throw new Error(data?.error ?? "Couldn't save your SMS Ping setting.");
      }

      if (!data) {
        throw new Error("Couldn't save your SMS Ping setting.");
      }

      applySettingsPayload(data);
      setSuccess("SMS Ping setting updated.");
    } catch (error) {
      console.error("[settings/phone/save]", error);
      setError(error instanceof Error ? error.message : "Couldn't save your SMS Ping setting.");
    } finally {
      setSavingKey(null);
    }
  }, [applySettingsPayload, authorizedFetch, smsEnabled]);

  const savePings = useCallback(async () => {
    if (!notificationPreferences) {
      return;
    }

    setSavingKey("pings");
    try {
      const response = await authorizedFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ notificationPreferences }),
      });
      const data = await readJsonResponse<SettingsResponse & { error?: string }>(response);
      if (!response.ok) {
        throw new Error(data?.error ?? "Couldn't save your Ping settings.");
      }

      if (!data) {
        throw new Error("Couldn't save your Ping settings.");
      }

      applySettingsPayload(data);
      setSuccess("Ping settings updated.");
    } catch (error) {
      console.error("[settings/pings]", error);
      setError(error instanceof Error ? error.message : "Couldn't save your Ping settings.");
    } finally {
      setSavingKey(null);
    }
  }, [applySettingsPayload, authorizedFetch, notificationPreferences]);

  const handleSignOut = useCallback(async () => {
    setSavingKey("signout");
    try {
      await signOut();
      router.push("/login");
    } finally {
      setSavingKey(null);
    }
  }, [router, signOut]);

  const toggleNotificationChannel = useCallback((kind: ToatKind, channel: keyof NotificationPreferences[ToatKind]) => {
    setNotificationPreferences((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [kind]: {
          ...current[kind],
          [channel]: !current[kind][channel],
        },
      };
    });
  }, []);

  if (!user && !loading) {
    return null;
  }

  const displayName = settingsData?.profile.displayName ?? user?.displayName ?? "Your profile";
  const email = settingsData?.profile.email ?? user?.email ?? "No email attached";
  const handleValue = settingsData?.profile.handle ? `@${settingsData.profile.handle}` : "No handle yet";
  const phoneState = settingsData?.settings;

  return (
    <div style={styles.page}>
      <div style={styles.backgroundHaloOne} />
      <div style={styles.backgroundHaloTwo} />
      <div style={styles.backgroundHaloThree} />

      <main style={styles.main}>
        <section style={styles.topRow}>
          <AppBrand />
          <UserAvatar user={user} />
        </section>

        <section style={styles.heroCard}>
          <div style={styles.heroIdentity}>
            <div>
              <p style={styles.eyebrow}>Profile</p>
              <h1 style={styles.heroTitle}>{displayName}</h1>
              <p style={styles.heroMeta}>{handleValue} · {email}</p>
            </div>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              style={styles.signOutButton}
              disabled={savingKey === "signout"}
            >
              {savingKey === "signout" ? "Signing out…" : "Sign out"}
            </button>
          </div>

          <p style={styles.heroBody}>
            Manage your profile, phone Pings, handle, and privacy in one place.
          </p>

          <div style={styles.providerRow}>
            {providerLabels.map((provider) => (
              <span key={provider} style={styles.providerPill}>{provider}</span>
            ))}
          </div>
        </section>

        <div style={styles.tabRow}>
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab.id ? styles.tabButtonActive : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {notice.message ? (
          <section
            style={{
              ...styles.notice,
              ...(notice.tone === "error" ? styles.noticeError : styles.noticeSuccess),
            }}
          >
            {notice.message}
          </section>
        ) : null}

        {loadingState && !settingsData ? (
          <section style={styles.loadingCard}>
            <div style={styles.loadingSpinner} className="animate-spin" />
            <p style={styles.loadingText}>Loading your settings…</p>
          </section>
        ) : null}

        {!loadingState && settingsData && activeTab === "profile" ? (
          <section style={styles.panelCard}>
            <div style={styles.sectionHead}>
              <div>
                <p style={styles.sectionEyebrow}>General</p>
                <h2 style={styles.sectionTitle}>Profile and privacy</h2>
              </div>
            </div>

            <div style={styles.formGrid}>
              <label style={styles.fieldLabel}>
                Timezone
                <input
                  list="timezone-options"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  style={styles.textInput}
                  placeholder="America/New_York"
                />
                <datalist id="timezone-options">
                  {timezoneOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>

              <div style={styles.inlineFields}>
                <label style={styles.fieldLabel}>
                  Work starts
                  <input type="time" value={workStart} onChange={(event) => setWorkStart(event.target.value)} style={styles.textInput} />
                </label>
                <label style={styles.fieldLabel}>
                  Work ends
                  <input type="time" value={workEnd} onChange={(event) => setWorkEnd(event.target.value)} style={styles.textInput} />
                </label>
              </div>

              <label style={styles.toggleCard}>
                <div>
                  <p style={styles.toggleTitle}>Keep voice transcripts</p>
                  <p style={styles.toggleBody}>Turn this on only if you want capture transcripts kept after extraction.</p>
                </div>
                <input type="checkbox" checked={voiceRetention} onChange={(event) => setVoiceRetention(event.target.checked)} style={styles.checkbox} />
              </label>
            </div>

            <button type="button" onClick={() => void saveProfile()} style={styles.primaryButton} disabled={savingKey === "profile"}>
              {savingKey === "profile" ? "Saving…" : "Save general settings"}
            </button>
          </section>
        ) : null}

        {!loadingState && settingsData && activeTab === "phone" ? (
          <section style={styles.panelCard}>
            <div style={styles.sectionHead}>
              <div>
                <p style={styles.sectionEyebrow}>Phone</p>
                <h2 style={styles.sectionTitle}>Verify a number for SMS Pings</h2>
              </div>
            </div>

            <div style={styles.statusChips}>
              <span style={styles.statusChip}>{phoneState?.phoneVerified ? "Verified" : "Not verified"}</span>
              {phoneState?.reminderPhone ? <span style={styles.statusChipMuted}>{phoneState.reminderPhone}</span> : null}
            </div>

            <label style={styles.fieldLabel}>
              Phone number
              <input
                value={phoneDraft}
                onChange={(event) => setPhoneDraft(event.target.value)}
                style={styles.textInput}
                placeholder="+15551234567"
              />
            </label>

            <div style={styles.inlineActions}>
              <button type="button" onClick={() => void sendPhoneCode()} style={styles.primaryButton} disabled={savingKey === "phone-start"}>
                {savingKey === "phone-start" ? "Sending…" : "Send code"}
              </button>
              {phoneState?.pendingPhone ? <span style={styles.helperText}>Pending: {phoneState.pendingPhone}</span> : null}
            </div>

            <label style={styles.fieldLabel}>
              Verification code
              <input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                style={styles.textInput}
                placeholder="123456"
              />
            </label>

            <div style={styles.inlineActions}>
              <button type="button" onClick={() => void verifyPhoneCode()} style={styles.secondaryButton} disabled={savingKey === "phone-check"}>
                {savingKey === "phone-check" ? "Checking…" : "Verify phone"}
              </button>
              {phoneState?.phoneVerifiedAt ? <span style={styles.helperText}>Verified {new Date(phoneState.phoneVerifiedAt).toLocaleDateString()}</span> : null}
            </div>

            <label style={styles.toggleCard}>
              <div>
                <p style={styles.toggleTitle}>Use SMS for urgent Pings</p>
                <p style={styles.toggleBody}>SMS is optional and only works after your phone number is verified.</p>
              </div>
              <input type="checkbox" checked={smsEnabled} onChange={(event) => setSmsEnabled(event.target.checked)} style={styles.checkbox} />
            </label>

            <button type="button" onClick={() => void savePhoneSettings()} style={styles.primaryButton} disabled={savingKey === "phone-save"}>
              {savingKey === "phone-save" ? "Saving…" : "Save phone settings"}
            </button>
          </section>
        ) : null}

        {!loadingState && settingsData && activeTab === "handle" ? (
          <section style={styles.panelCard}>
            <div style={styles.sectionHead}>
              <div>
                <p style={styles.sectionEyebrow}>Handle</p>
                <h2 style={styles.sectionTitle}>Update your sharing handle</h2>
              </div>
            </div>

            <label style={styles.fieldLabel}>
              Handle
              <div style={styles.handleField}>
                <span style={styles.handlePrefix}>@</span>
                <input
                  value={handleDraft.replace(/^@+/, "")}
                  onChange={(event) => setHandleDraft(event.target.value.replace(/^@+/, ""))}
                  style={styles.handleInput}
                  placeholder="yourname"
                />
              </div>
            </label>

            <p style={styles.helperText}>Handles can use letters, numbers, and underscores.</p>

            <button type="button" onClick={() => void saveHandle()} style={styles.primaryButton} disabled={savingKey === "handle"}>
              {savingKey === "handle" ? "Saving…" : "Save handle"}
            </button>
          </section>
        ) : null}

        {!loadingState && settingsData && activeTab === "pings" && notificationPreferences ? (
          <section style={styles.panelCard}>
            <div style={styles.sectionHead}>
              <div>
                <p style={styles.sectionEyebrow}>Pings</p>
                <h2 style={styles.sectionTitle}>Choose how each kind reaches you</h2>
              </div>
            </div>

            <div style={styles.notificationList}>
              {TOAT_KINDS.map((kind) => (
                <div key={kind} style={styles.notificationRow}>
                  <div>
                    <p style={styles.notificationKind}>{KIND_LABELS[kind]}</p>
                    <p style={styles.notificationHint}>Push, email, and SMS preferences for {KIND_LABELS[kind].toLowerCase()}.</p>
                  </div>

                  <div style={styles.channelGroup}>
                    {(["push", "email", "sms"] as const).map((channel) => (
                      <label key={channel} style={styles.channelPill}>
                        <input
                          type="checkbox"
                          checked={notificationPreferences[kind][channel]}
                          onChange={() => toggleNotificationChannel(kind, channel)}
                          style={styles.checkbox}
                        />
                        {channel.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => void savePings()} style={styles.primaryButton} disabled={savingKey === "pings"}>
              {savingKey === "pings" ? "Saving…" : "Save Ping settings"}
            </button>
          </section>
        ) : null}

        <div style={{ height: 110 }} />
      </main>

      <BottomTabBar
        items={[
          { label: "Timeline", icon: <TimelineIcon />, href: "/timeline" },
          { label: "Search", icon: <SearchIcon /> },
          { label: "People", icon: <PeopleIcon /> },
          { label: "Inbox", icon: <InboxIcon /> },
          { label: "Calendar", icon: <CalendarIcon />, href: "/timeline" },
        ]}
      />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #FBFAFF 0%, #F7F5FF 52%, #FBFAFF 100%)",
    position: "relative",
    overflowX: "clip",
  },
  backgroundHaloOne: {
    position: "absolute",
    top: -120,
    left: -160,
    width: 420,
    height: 420,
    background: "radial-gradient(circle, rgba(249,168,212,0.18), rgba(249,168,212,0))",
    filter: "blur(20px)",
  },
  backgroundHaloTwo: {
    position: "absolute",
    top: 160,
    right: -140,
    width: 420,
    height: 420,
    background: "radial-gradient(circle, rgba(191,219,254,0.24), rgba(191,219,254,0))",
    filter: "blur(24px)",
  },
  backgroundHaloThree: {
    position: "absolute",
    bottom: 160,
    left: "18%",
    width: 340,
    height: 340,
    background: "radial-gradient(circle, rgba(253,224,71,0.12), rgba(253,224,71,0))",
    filter: "blur(24px)",
  },
  main: {
    width: "min(calc(100vw - 16px), 860px)",
    margin: "0 auto",
    padding: "16px 0 0",
    position: "relative",
    zIndex: 1,
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  heroCard: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: "20px 18px",
    borderRadius: 28,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,251,255,0.88))",
    border: "1px solid rgba(255,255,255,0.94)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    marginBottom: 18,
  },
  heroIdentity: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: 700,
    color: "#5B3DF5",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  heroTitle: {
    fontSize: "clamp(28px, 8vw, 38px)",
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: "-0.04em",
    color: "#0F1B4C",
    marginBottom: 8,
  },
  heroMeta: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 1.45,
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#6B7280",
  },
  signOutButton: {
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 14,
    border: "1px solid rgba(91,61,245,0.14)",
    background: "rgba(255,255,255,0.85)",
    color: "#5B3DF5",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  providerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  providerPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(91,61,245,0.08)",
    color: "#5B3DF5",
    fontSize: 12,
    fontWeight: 700,
  },
  tabRow: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 14,
  },
  tabButton: {
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(91,61,245,0.10)",
    background: "rgba(255,255,255,0.82)",
    color: "#6B7280",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },
  tabButtonActive: {
    background: "linear-gradient(135deg, rgba(91,61,245,0.14), rgba(236,72,153,0.1))",
    color: "#5B3DF5",
    borderColor: "rgba(91,61,245,0.18)",
  },
  notice: {
    borderRadius: 18,
    padding: "12px 14px",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 14,
  },
  noticeSuccess: {
    background: "rgba(34,197,94,0.12)",
    color: "#15803D",
    border: "1px solid rgba(34,197,94,0.18)",
  },
  noticeError: {
    background: "rgba(239,68,68,0.10)",
    color: "#B91C1C",
    border: "1px solid rgba(239,68,68,0.16)",
  },
  loadingCard: {
    minHeight: 180,
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.76))",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingSpinner: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "3px solid rgba(91,61,245,0.12)",
    borderTopColor: "#5B3DF5",
  },
  loadingText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: 500,
  },
  panelCard: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    padding: "20px 18px",
    borderRadius: 28,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))",
    border: "1px solid rgba(255,255,255,0.92)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: 700,
    color: "#5B3DF5",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  sectionTitle: {
    fontSize: "clamp(22px, 6vw, 28px)",
    lineHeight: 1.05,
    fontWeight: 800,
    color: "#0F1B4C",
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  inlineFields: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  fieldLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
  },
  textInput: {
    width: "100%",
    minHeight: 48,
    borderRadius: 16,
    border: "1px solid rgba(99,102,241,0.12)",
    background: "rgba(255,255,255,0.86)",
    padding: "0 14px",
    fontSize: 15,
    color: "#111827",
    outline: "none",
  },
  toggleCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "16px 18px",
    borderRadius: 20,
    background: "rgba(91,61,245,0.06)",
    border: "1px solid rgba(91,61,245,0.10)",
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
  },
  toggleBody: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#6B7280",
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: "#5B3DF5",
    flexShrink: 0,
  },
  primaryButton: {
    minHeight: 50,
    padding: "0 18px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #5B3DF5, #7C3AED)",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 22px 44px rgba(91,61,245,0.18)",
    alignSelf: "flex-start",
  },
  secondaryButton: {
    minHeight: 46,
    padding: "0 16px",
    borderRadius: 14,
    border: "1px solid rgba(91,61,245,0.14)",
    background: "rgba(255,255,255,0.88)",
    color: "#5B3DF5",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  statusChips: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  statusChip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(34,197,94,0.12)",
    color: "#15803D",
    fontSize: 12,
    fontWeight: 700,
  },
  statusChipMuted: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.9)",
    color: "#6B7280",
    fontSize: 12,
    fontWeight: 700,
  },
  inlineActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#6B7280",
  },
  handleField: {
    display: "flex",
    alignItems: "center",
    minHeight: 48,
    borderRadius: 16,
    border: "1px solid rgba(99,102,241,0.12)",
    background: "rgba(255,255,255,0.86)",
    overflow: "hidden",
  },
  handlePrefix: {
    width: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#5B3DF5",
    fontSize: 16,
    fontWeight: 800,
  },
  handleInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    border: "none",
    background: "transparent",
    paddingRight: 14,
    fontSize: 15,
    color: "#111827",
    outline: "none",
  },
  notificationList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  notificationRow: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "16px 18px",
    borderRadius: 20,
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(99,102,241,0.10)",
  },
  notificationKind: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
  },
  notificationHint: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#6B7280",
  },
  channelGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  channelPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(91,61,245,0.08)",
    color: "#5B3DF5",
    fontSize: 12,
    fontWeight: 700,
  },
};
