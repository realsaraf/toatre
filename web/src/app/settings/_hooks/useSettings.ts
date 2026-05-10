"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { useAuth } from "@/lib/auth/auth-context";
import type { NotificationPreferences } from "@/lib/settings/defaults";
import {
  type SettingsTab,
  type NoticeTone,
  type SyncDirection,
  type BookingSlotLength,
  type SyncConnection,
  type SettingsResponse,
  type SavedConnection,
  type ConnectionDraft,
  readJsonResponse,
} from "../_utils/settings-helpers";
import { useProfileSettings } from "./useProfileSettings";
import { useSyncSettings } from "./useSyncSettings";
import { useConnectionsSettings } from "./useConnectionsSettings";
import { useBookingSettings } from "./useBookingSettings";

export interface UseSettingsResult {
  // Auth
  user: User | null;
  loading: boolean;
  handleSignOut: () => Promise<void>;

  // Core
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
  settingsData: SettingsResponse | null;
  loadingState: boolean;
  savingKey: string | null;
  notice: { tone: NoticeTone; message: string };

  // Layout
  isDesktopViewport: boolean;

  // General / Profile
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
  providerLabels: string[];

  // Pings
  notificationPreferences: NotificationPreferences | null;

  // Sync
  syncConnections: Record<string, SyncConnection>;
  googleCalendarDirection: SyncDirection;
  setGoogleCalendarDirection: (v: SyncDirection) => void;
  microsoftDirection: SyncDirection;
  setMicrosoftDirection: (v: SyncDirection) => void;
  calendlyDirection: SyncDirection;
  setCalendlyDirection: (v: SyncDirection) => void;
  zoomDirection: SyncDirection;
  setZoomDirection: (v: SyncDirection) => void;

  // Connections
  connections: SavedConnection[];
  connectionDraft: ConnectionDraft;
  setConnectionDraft: Dispatch<SetStateAction<ConnectionDraft>>;
  editingConnectionId: string | null;

  // Booking
  bookingEnabled: boolean;
  setBookingEnabled: (v: boolean) => void;
  bookingGreetingMessage: string;
  setBookingGreetingMessage: (v: string) => void;
  bookingPageTitle: string;
  setBookingPageTitle: (v: string) => void;
  bookingMetaDescription: string;
  setBookingMetaDescription: (v: string) => void;
  bookingWindowDays: number[];
  setBookingWindowDays: Dispatch<SetStateAction<number[]>>;
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
  loadingBooking: boolean;
  savingBooking: boolean;
  bookingMaxPerDay: number;
  setBookingMaxPerDay: (v: number) => void;
  bookingAllowRescheduling: boolean;
  setBookingAllowRescheduling: (v: boolean) => void;
  bookingAllowCancellations: boolean;
  setBookingAllowCancellations: (v: boolean) => void;
  bookingShowSuccessMessage: boolean;
  setBookingShowSuccessMessage: (v: boolean) => void;
  bookingRedirectAfterBooking: boolean;
  setBookingRedirectAfterBooking: (v: boolean) => void;
  bookingRedirectUrl: string;
  setBookingRedirectUrl: (v: string) => void;
  bookingAddReasonToCalendar: boolean;
  setBookingAddReasonToCalendar: (v: boolean) => void;
  bookingAccentColor: string;
  setBookingAccentColor: (v: string) => void;
  bookingCollectEmailFirst: boolean;
  setBookingCollectEmailFirst: (v: boolean) => void;
  bookingHideFromSearch: boolean;
  setBookingHideFromSearch: (v: boolean) => void;
  bookingPasswordProtect: boolean;
  setBookingPasswordProtect: (v: boolean) => void;
  bookingUtmParams: boolean;
  setBookingUtmParams: (v: boolean) => void;

  // Derived
  displayName: string;
  email: string;
  handleValue: string;
  phoneState: SettingsResponse["settings"] | null | undefined;
  toatLinkUrl: string | null;

  // Callbacks
  saveProfile: () => Promise<void>;
  saveHandle: () => Promise<void>;
  sendPhoneCode: () => Promise<void>;
  verifyPhoneCode: () => Promise<void>;
  savePhoneSettings: () => Promise<void>;
  savePings: () => Promise<void>;
  saveConnection: () => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  editConnection: (connection: SavedConnection) => void;
  resetConnectionDraft: () => void;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  runGoogleCalendarSync: () => Promise<void>;
  connectMicrosoft: () => Promise<void>;
  disconnectMicrosoft: () => Promise<void>;
  runMicrosoftSync: () => Promise<void>;
  connectCalendly: () => Promise<void>;
  disconnectCalendly: () => Promise<void>;
  runCalendlySync: () => Promise<void>;
  connectZoom: () => Promise<void>;
  disconnectZoom: () => Promise<void>;
  runZoomSync: () => Promise<void>;
  saveBookingSettings: () => Promise<void>;
  copyToatLink: () => Promise<void>;
  toggleNotificationChannel: (kind: string, channel: keyof NotificationPreferences[string]) => void;
  toggleBookingWindowDay: (dayValue: number) => void;
}


export function useSettings(): UseSettingsResult {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [settingsData, setSettingsData] = useState<SettingsResponse | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string }>({ tone: "idle", message: "" });
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  const setSuccess = useCallback((message: string) => {
    setNotice({ tone: "success", message });
  }, []);

  const setError = useCallback((message: string) => {
    setNotice({ tone: "error", message });
  }, []);
  const isDesktopViewport = viewportWidth !== null && viewportWidth >= 1180;

  const authorizedFetch = useCallback(async (input: string, init?: RequestInit) => {
    if (!user) throw new Error("Sign in required");
    const token = await user.getIdToken();
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(input, { ...init, headers });
  }, [user]);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    setLoadingState(true);
    try {
      const response = await authorizedFetch("/api/settings", { method: "GET" });
      const data = await readJsonResponse<SettingsResponse & { error?: string }>(response);
      if (!response.ok) throw new Error(data?.error ?? "Couldn't load your settings.");
      if (!data) throw new Error("Couldn't load your settings.");
      setSettingsData(data);
      setNotice((current) => (current.tone === "error" ? { tone: "idle", message: "" } : current));
    } catch (error) {
      console.error("[settings/load]", error);
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Couldn't load your settings." });
    } finally {
      setLoadingState(false);
    }
  }, [authorizedFetch, user]);

  const handleSignOut = useCallback(async () => {
    setSavingKey("signout");
    try {
      await signOut();
      router.push("/login");
    } finally {
      setSavingKey(null);
    }
  }, [router, signOut]);

  // ── Effects ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      void loadSettings();
    });
  }, [loadSettings, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const syncParam = params.get("sync");
    if (syncParam && user) {
      const labels: Record<string, string> = {
        google: "Google Calendar",
        microsoft: "Microsoft Calendar",
        calendly: "Calendly",
        zoom: "Zoom",
      };
      const label = labels[syncParam] ?? syncParam;
      queueMicrotask(() => {
        void loadSettings().then(() => setSuccess(`${label} connection updated.`));
      });
      window.history.replaceState(null, "", "/settings");
    }
  }, [loadSettings, setSuccess, user]);

  // ── Sub-hooks ─────────────────────────────────────────────────────
  const profile = useProfileSettings({
    user, authorizedFetch, setSavingKey, setSuccess, setError,
    settingsData, setSettingsData, loadSettings,
  });

  const sync = useSyncSettings({
    user, authorizedFetch, setSavingKey, setSuccess, setError, settingsData, loadSettings,
  });

  const connections = useConnectionsSettings({
    user, authorizedFetch, setSavingKey, setSuccess, setError,
  });

  const handle = settingsData?.profile.handle ?? null;
  const booking = useBookingSettings({
    user, authorizedFetch, setSuccess, setError,
    timezone: profile.timezone, activeTab, handle,
  });

  // ── Derived values ───────────────────────────────────────────────
  const displayName = settingsData?.profile.displayName ?? user?.displayName ?? "Your profile";
  const email = settingsData?.profile.email ?? user?.email ?? "No email attached";
  const handleValue = settingsData?.profile.handle ? `@${settingsData.profile.handle}` : "No handle yet";
  const phoneState = settingsData?.settings;
  const appOrigin = typeof window === "undefined" ? "https://toatre.com" : window.location.origin;
  const toatLinkUrl = settingsData?.profile.handle ? `${appOrigin}/${settingsData.profile.handle}` : null;

  return {
    // Auth
    user,
    loading,
    handleSignOut,

    // Core
    activeTab,
    setActiveTab,
    settingsData,
    loadingState,
    savingKey,
    notice,

    // Layout
    isDesktopViewport,

    // Profile / Pings
    ...profile,

    // Sync
    ...sync,

    // Connections
    ...connections,

    // Booking
    ...booking,

    // Derived
    displayName,
    email,
    handleValue,
    phoneState,
    toatLinkUrl,
  };
}