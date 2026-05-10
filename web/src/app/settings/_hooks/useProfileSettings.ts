"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import type { NotificationPreferences } from "@/lib/settings/defaults";
import {
  type SettingsResponse,
  PROVIDER_LABELS,
  readJsonResponse,
  getTimezoneOptions,
} from "../_utils/settings-helpers";

interface ProfileShared {
  user: User | null;
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>;
  setSavingKey: (key: string | null) => void;
  setSuccess: (msg: string) => void;
  setError: (msg: string) => void;
  settingsData: SettingsResponse | null;
  setSettingsData: (data: SettingsResponse) => void;
  loadSettings: () => Promise<void>;
}

export function useProfileSettings({
  user,
  authorizedFetch,
  setSavingKey,
  setSuccess,
  setError,
  settingsData,
  setSettingsData,
  loadSettings,
}: ProfileShared) {
  const [timezone, setTimezone] = useState("");
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:30");
  const [voiceRetention, setVoiceRetention] = useState(false);
  const [handleDraft, setHandleDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);

  // Hydrate from settingsData whenever it changes
  useEffect(() => {
    if (!settingsData) return;
    queueMicrotask(() => {
      setTimezone(settingsData.settings.timezone);
      setWorkStart(settingsData.settings.workStart);
      setWorkEnd(settingsData.settings.workEnd);
      setVoiceRetention(settingsData.settings.voiceRetention);
      setHandleDraft(settingsData.profile.handle ?? "");
      setPhoneDraft(settingsData.settings.pendingPhone ?? settingsData.settings.reminderPhone ?? "");
      setSmsEnabled(settingsData.settings.smsEnabled);
      setNotificationPreferences(settingsData.settings.notificationPreferences);
    });
  }, [settingsData]);

  const timezoneOptions = useMemo(
    () => getTimezoneOptions(timezone || Intl.DateTimeFormat().resolvedOptions().timeZone),
    [timezone],
  );

  const providerLabels = useMemo(() => {
    if (!user) return [] as string[];
    const labels = user.providerData
      .map((provider) => PROVIDER_LABELS[provider.providerId] ?? provider.providerId)
      .filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);
    return labels.length ? labels : ["Email link"];
  }, [user]);

  const saveProfile = useCallback(async () => {
    setSavingKey("profile");
    try {
      const response = await authorizedFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ timezone, workStart, workEnd, voiceRetention }),
      });
      const data = await readJsonResponse<SettingsResponse & { error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't save your profile settings.");
      if (!data) throw new Error("Couldn't save your profile settings.");
      setSettingsData(data);
      setSuccess("General settings updated.");
    } catch (error) {
      console.error("[settings/profile]", error);
      setError(error instanceof Error ? error.message : "Couldn't save your profile settings.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, setSettingsData, timezone, workStart, workEnd, voiceRetention]);

  const saveHandle = useCallback(async () => {
    setSavingKey("handle");
    try {
      const response = await authorizedFetch("/api/auth/profile", {
        method: "POST",
        body: JSON.stringify({ handle: handleDraft.replace(/^@+/, "") }),
      });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't update your handle.");
      await loadSettings();
      setSuccess("Handle updated.");
    } catch (error) {
      console.error("[settings/handle]", error);
      setError(error instanceof Error ? error.message : "Couldn't update your handle.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, handleDraft, loadSettings]);

  const sendPhoneCode = useCallback(async () => {
    setSavingKey("phone-start");
    try {
      const response = await authorizedFetch("/api/twilio/verify/start", {
        method: "POST",
        body: JSON.stringify({ phone: phoneDraft }),
      });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't send a verification code.");
      await loadSettings();
      setSuccess("Verification code sent.");
    } catch (error) {
      console.error("[settings/phone/start]", error);
      setError(error instanceof Error ? error.message : "Couldn't send a verification code.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, loadSettings, phoneDraft]);

  const verifyPhoneCode = useCallback(async () => {
    setSavingKey("phone-check");
    try {
      const response = await authorizedFetch("/api/twilio/verify/check", {
        method: "POST",
        body: JSON.stringify({ phone: phoneDraft, code: verificationCode }),
      });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't verify that code.");
      setVerificationCode("");
      await loadSettings();
      setSuccess("Phone verified for SMS Pings.");
    } catch (error) {
      console.error("[settings/phone/check]", error);
      setError(error instanceof Error ? error.message : "Couldn't verify that code.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, loadSettings, phoneDraft, verificationCode]);

  const savePhoneSettings = useCallback(async () => {
    setSavingKey("phone-save");
    try {
      const response = await authorizedFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ smsEnabled }),
      });
      const data = await readJsonResponse<SettingsResponse & { error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't save your SMS Ping setting.");
      if (!data) throw new Error("Couldn't save your SMS Ping setting.");
      setSettingsData(data);
      setSuccess("SMS Ping setting updated.");
    } catch (error) {
      console.error("[settings/phone/save]", error);
      setError(error instanceof Error ? error.message : "Couldn't save your SMS Ping setting.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, setSettingsData, smsEnabled]);

  const savePings = useCallback(async () => {
    if (!notificationPreferences) return;
    setSavingKey("pings");
    try {
      const response = await authorizedFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ notificationPreferences }),
      });
      const data = await readJsonResponse<SettingsResponse & { error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't save your Ping settings.");
      if (!data) throw new Error("Couldn't save your Ping settings.");
      setSettingsData(data);
      setSuccess("Ping settings updated.");
    } catch (error) {
      console.error("[settings/pings]", error);
      setError(error instanceof Error ? error.message : "Couldn't save your Ping settings.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, setSettingsData, notificationPreferences]);

  const toggleNotificationChannel = useCallback(
    (kind: string, channel: keyof NotificationPreferences[string]) => {
      setNotificationPreferences((current) => {
        if (!current) return current;
        return {
          ...current,
          [kind]: {
            ...current[kind],
            [channel]: !current[kind][channel],
          },
        };
      });
    },
    [],
  );

  return {
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
    notificationPreferences,
    timezoneOptions,
    providerLabels,
    saveProfile,
    saveHandle,
    sendPhoneCode,
    verifyPhoneCode,
    savePhoneSettings,
    savePings,
    toggleNotificationChannel,
  };
}
