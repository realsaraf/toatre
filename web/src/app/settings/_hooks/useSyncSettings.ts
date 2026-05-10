"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  type SyncDirection,
  type SyncConnection,
  type SettingsResponse,
  readJsonResponse,
} from "../_utils/settings-helpers";

interface SyncShared {
  user: User | null;
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>;
  setSavingKey: (key: string | null) => void;
  setSuccess: (msg: string) => void;
  setError: (msg: string) => void;
  settingsData: SettingsResponse | null;
  loadSettings: () => Promise<void>;
}

export function useSyncSettings({
  user,
  authorizedFetch,
  setSavingKey,
  setSuccess,
  setError,
  settingsData,
  loadSettings,
}: SyncShared) {
  const [syncConnections, setSyncConnections] = useState<Record<string, SyncConnection>>({});
  const [googleCalendarDirection, setGoogleCalendarDirection] = useState<SyncDirection>("sourceToToatre");
  const [microsoftDirection, setMicrosoftDirection] = useState<SyncDirection>("sourceToToatre");
  const [calendlyDirection, setCalendlyDirection] = useState<SyncDirection>("sourceToToatre");
  const [zoomDirection, setZoomDirection] = useState<SyncDirection>("sourceToToatre");

  useEffect(() => {
    if (!settingsData) return;
    queueMicrotask(() => {
      setSyncConnections(settingsData.settings.syncConnections ?? {});
      setGoogleCalendarDirection(settingsData.settings.syncConnections?.googleCalendar?.direction ?? "sourceToToatre");
      setMicrosoftDirection(settingsData.settings.syncConnections?.microsoft?.direction ?? "sourceToToatre");
      setCalendlyDirection(settingsData.settings.syncConnections?.calendly?.direction ?? "sourceToToatre");
      setZoomDirection(settingsData.settings.syncConnections?.zoom?.direction ?? "sourceToToatre");
    });
  }, [settingsData]);

  // ── Google Calendar ──────────────────────────────────────────────
  const connectGoogleCalendar = useCallback(async () => {
    if (!user) return;
    setSavingKey("sync-google");
    try {
      const response = await authorizedFetch("/api/sync/google/start", {
        method: "POST",
        body: JSON.stringify({ direction: googleCalendarDirection, returnTo: "/settings?sync=google" }),
      });
      const data = await readJsonResponse<{ authUrl?: string; error?: string }>(response);
      if (!response.ok || !data?.authUrl) throw new Error(data?.error ?? "Couldn't start Google Calendar connection.");
      window.location.assign(data.authUrl);
    } catch (error) {
      console.error("[settings/sync/google/connect]", error);
      setError(error instanceof Error ? error.message : "Couldn't connect Google Calendar sync.");
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setError, googleCalendarDirection, user]);

  const disconnectGoogleCalendar = useCallback(async () => {
    setSavingKey("sync-google");
    try {
      const response = await authorizedFetch("/api/sync/google/disconnect", { method: "POST", body: JSON.stringify({}) });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't pause Google Calendar sync.");
      await loadSettings();
      setSuccess("Google Calendar sync paused.");
    } catch (error) {
      console.error("[settings/sync/google/disconnect]", error);
      setError(error instanceof Error ? error.message : "Couldn't pause Google Calendar sync.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, loadSettings]);

  const runGoogleCalendarSync = useCallback(async () => {
    setSavingKey("sync-google-run");
    try {
      const response = await authorizedFetch("/api/sync/google/run", { method: "POST" });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't sync Google Calendar.");
      await loadSettings();
      setSuccess("Google Calendar sync finished.");
    } catch (error) {
      console.error("[settings/sync/google/run]", error);
      setError(error instanceof Error ? error.message : "Couldn't sync Google Calendar.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, loadSettings]);

  // ── Microsoft ────────────────────────────────────────────────────
  const connectMicrosoft = useCallback(async () => {
    if (!user) return;
    setSavingKey("sync-microsoft");
    try {
      const response = await authorizedFetch("/api/sync/microsoft/start", {
        method: "POST",
        body: JSON.stringify({ direction: microsoftDirection, returnTo: "/settings?sync=microsoft" }),
      });
      const data = await readJsonResponse<{ authUrl?: string; error?: string }>(response);
      if (!response.ok || !data?.authUrl) throw new Error(data?.error ?? "Couldn't start Microsoft connection.");
      window.location.assign(data.authUrl);
    } catch (error) {
      console.error("[settings/sync/microsoft/connect]", error);
      setError(error instanceof Error ? error.message : "Couldn't connect Microsoft Calendar sync.");
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setError, microsoftDirection, user]);

  const disconnectMicrosoft = useCallback(async () => {
    setSavingKey("sync-microsoft");
    try {
      const response = await authorizedFetch("/api/sync/microsoft/disconnect", { method: "POST", body: JSON.stringify({}) });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't pause Microsoft sync.");
      await loadSettings();
      setSuccess("Microsoft Calendar sync paused.");
    } catch (error) {
      console.error("[settings/sync/microsoft/disconnect]", error);
      setError(error instanceof Error ? error.message : "Couldn't pause Microsoft Calendar sync.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, loadSettings]);

  const runMicrosoftSync = useCallback(async () => {
    setSavingKey("sync-microsoft-run");
    try {
      const response = await authorizedFetch("/api/sync/microsoft/run", { method: "POST" });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't sync Microsoft Calendar.");
      await loadSettings();
      setSuccess("Microsoft Calendar sync finished.");
    } catch (error) {
      console.error("[settings/sync/microsoft/run]", error);
      setError(error instanceof Error ? error.message : "Couldn't sync Microsoft Calendar.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, loadSettings]);

  // ── Calendly ─────────────────────────────────────────────────────
  const connectCalendly = useCallback(async () => {
    if (!user) return;
    setSavingKey("sync-calendly");
    try {
      const response = await authorizedFetch("/api/sync/calendly/start", {
        method: "POST",
        body: JSON.stringify({ direction: calendlyDirection, returnTo: "/settings?sync=calendly" }),
      });
      const data = await readJsonResponse<{ authUrl?: string; error?: string }>(response);
      if (!response.ok || !data?.authUrl) throw new Error(data?.error ?? "Couldn't start Calendly connection.");
      window.location.assign(data.authUrl);
    } catch (error) {
      console.error("[settings/sync/calendly/connect]", error);
      setError(error instanceof Error ? error.message : "Couldn't connect Calendly sync.");
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setError, calendlyDirection, user]);

  const disconnectCalendly = useCallback(async () => {
    setSavingKey("sync-calendly");
    try {
      const response = await authorizedFetch("/api/sync/calendly/disconnect", { method: "POST", body: JSON.stringify({}) });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't pause Calendly sync.");
      await loadSettings();
      setSuccess("Calendly sync paused.");
    } catch (error) {
      console.error("[settings/sync/calendly/disconnect]", error);
      setError(error instanceof Error ? error.message : "Couldn't pause Calendly sync.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, loadSettings]);

  const runCalendlySync = useCallback(async () => {
    setSavingKey("sync-calendly-run");
    try {
      const response = await authorizedFetch("/api/sync/calendly/run", { method: "POST" });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't sync Calendly.");
      await loadSettings();
      setSuccess("Calendly sync finished.");
    } catch (error) {
      console.error("[settings/sync/calendly/run]", error);
      setError(error instanceof Error ? error.message : "Couldn't sync Calendly.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, loadSettings]);

  // ── Zoom ─────────────────────────────────────────────────────────
  const connectZoom = useCallback(async () => {
    if (!user) return;
    setSavingKey("sync-zoom");
    try {
      const response = await authorizedFetch("/api/sync/zoom/start", {
        method: "POST",
        body: JSON.stringify({ direction: zoomDirection, returnTo: "/settings?sync=zoom" }),
      });
      const data = await readJsonResponse<{ authUrl?: string; error?: string }>(response);
      if (!response.ok || !data?.authUrl) throw new Error(data?.error ?? "Couldn't start Zoom connection.");
      window.location.assign(data.authUrl);
    } catch (error) {
      console.error("[settings/sync/zoom/connect]", error);
      setError(error instanceof Error ? error.message : "Couldn't connect Zoom sync.");
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setError, zoomDirection, user]);

  const disconnectZoom = useCallback(async () => {
    setSavingKey("sync-zoom");
    try {
      const response = await authorizedFetch("/api/sync/zoom/disconnect", { method: "POST", body: JSON.stringify({}) });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't pause Zoom sync.");
      await loadSettings();
      setSuccess("Zoom sync paused.");
    } catch (error) {
      console.error("[settings/sync/zoom/disconnect]", error);
      setError(error instanceof Error ? error.message : "Couldn't pause Zoom sync.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, loadSettings]);

  const runZoomSync = useCallback(async () => {
    setSavingKey("sync-zoom-run");
    try {
      const response = await authorizedFetch("/api/sync/zoom/run", { method: "POST" });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't sync Zoom.");
      await loadSettings();
      setSuccess("Zoom sync finished.");
    } catch (error) {
      console.error("[settings/sync/zoom/run]", error);
      setError(error instanceof Error ? error.message : "Couldn't sync Zoom.");
    } finally {
      setSavingKey(null);
    }
  }, [authorizedFetch, setSavingKey, setSuccess, setError, loadSettings]);

  return {
    syncConnections,
    googleCalendarDirection,
    setGoogleCalendarDirection,
    microsoftDirection,
    setMicrosoftDirection,
    calendlyDirection,
    setCalendlyDirection,
    zoomDirection,
    setZoomDirection,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    runGoogleCalendarSync,
    connectMicrosoft,
    disconnectMicrosoft,
    runMicrosoftSync,
    connectCalendly,
    disconnectCalendly,
    runCalendlySync,
    connectZoom,
    disconnectZoom,
    runZoomSync,
  };
}
