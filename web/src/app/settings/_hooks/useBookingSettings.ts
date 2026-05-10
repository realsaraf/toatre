"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { User } from "firebase/auth";
import {
  type BookingSlotLength,
  type BookingSettingsResponse,
  normalizeBookingSlotLength,
  readJsonResponse,
} from "../_utils/settings-helpers";

interface BookingShared {
  user: User | null;
  authorizedFetch: (input: string, init?: RequestInit) => Promise<Response>;
  setSuccess: (msg: string) => void;
  setError: (msg: string) => void;
  timezone: string;
  activeTab: string;
  handle: string | null;
}

export function useBookingSettings({
  user,
  authorizedFetch,
  setSuccess,
  setError,
  timezone,
  activeTab,
  handle,
}: BookingShared) {
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [bookingGreetingMessage, setBookingGreetingMessage] = useState("");
  const [bookingPageTitle, setBookingPageTitle] = useState("Let's find a time that works for you.");
  const [bookingMetaDescription, setBookingMetaDescription] = useState("Book a 1-on-1 session with me. Simple, quick and hassle-free.");
  const [bookingWindowDays, setBookingWindowDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [bookingWindowStart, setBookingWindowStart] = useState("09:00");
  const [bookingWindowEnd, setBookingWindowEnd] = useState("17:00");
  const [bookingSlotLength, setBookingSlotLength] = useState<BookingSlotLength>(30);
  const [bookingBuffer, setBookingBuffer] = useState(15);
  const [bookingAdvance, setBookingAdvance] = useState(60);
  const [bookingMaxDays, setBookingMaxDays] = useState(14);
  const [bookingRequireReason, setBookingRequireReason] = useState(false);
  const [bookingDisableDuringOfficeHours, setBookingDisableDuringOfficeHours] = useState(false);
  const [bookingTimezone, setBookingTimezone] = useState("UTC");
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [bookingMaxPerDay, setBookingMaxPerDay] = useState(10);
  const [bookingAllowRescheduling, setBookingAllowRescheduling] = useState(true);
  const [bookingAllowCancellations, setBookingAllowCancellations] = useState(true);
  const [bookingShowSuccessMessage, setBookingShowSuccessMessage] = useState(true);
  const [bookingRedirectAfterBooking, setBookingRedirectAfterBooking] = useState(true);
  const [bookingRedirectUrl, setBookingRedirectUrl] = useState("https://yourdomain.com/thank-you");
  const [bookingAddReasonToCalendar, setBookingAddReasonToCalendar] = useState(false);
  const [bookingAccentColor, setBookingAccentColor] = useState("#6D49FF");
  const [bookingCollectEmailFirst, setBookingCollectEmailFirst] = useState(false);
  const [bookingHideFromSearch, setBookingHideFromSearch] = useState(false);
  const [bookingPasswordProtect, setBookingPasswordProtect] = useState(false);
  const [bookingUtmParams, setBookingUtmParams] = useState(false);

  const loadBookingSettings = useCallback(async () => {
    if (!user) return;
    setLoadingBooking(true);
    try {
      const response = await authorizedFetch("/api/booking/settings", { method: "GET" });
      const data = await readJsonResponse<BookingSettingsResponse>(response);
      if (!response.ok || !data) return;
      setBookingEnabled(data.enabled ?? false);
      setBookingGreetingMessage(data.greetingMessage ?? "");
      setBookingPageTitle(data.pageTitle ?? "Let's find a time that works for you.");
      setBookingMetaDescription(data.metaDescription ?? "Book a 1-on-1 session with me. Simple, quick and hassle-free.");
      setBookingWindowDays(data.windowDays ?? [1, 2, 3, 4, 5]);
      setBookingWindowStart(data.windowStart ?? "09:00");
      setBookingWindowEnd(data.windowEnd ?? "17:00");
      setBookingSlotLength(normalizeBookingSlotLength(data.slotLength));
      setBookingBuffer(data.bufferMinutes ?? 15);
      setBookingAdvance(data.advanceNoticeMinutes ?? 60);
      setBookingMaxDays(data.maxDaysAhead ?? 14);
      setBookingRequireReason(data.requireReason ?? false);
      setBookingDisableDuringOfficeHours(data.disableDuringOfficeHours ?? false);
      setBookingTimezone(data.timezone ?? timezone);
      setBookingMaxPerDay(data.maxPerDay ?? 10);
      setBookingAllowRescheduling(data.allowRescheduling ?? true);
      setBookingAllowCancellations(data.allowCancellations ?? true);
      setBookingShowSuccessMessage(data.showSuccessMessage ?? true);
      setBookingCollectEmailFirst(data.collectEmailFirst ?? false);
    } catch { /* best effort */ }
    finally { setLoadingBooking(false); }
  }, [authorizedFetch, timezone, user]);

  useEffect(() => {
    if (activeTab === "toatlink" && user && !loadingBooking) {
      queueMicrotask(() => {
        void loadBookingSettings();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const saveBookingSettings = useCallback(async () => {
    setSavingBooking(true);
    try {
      const response = await authorizedFetch("/api/booking/settings", {
        method: "PATCH",
        body: JSON.stringify({
          enabled: bookingEnabled,
          greetingMessage: bookingGreetingMessage,
          pageTitle: bookingPageTitle,
          metaDescription: bookingMetaDescription,
          windowDays: bookingWindowDays,
          windowStart: bookingWindowStart,
          windowEnd: bookingWindowEnd,
          slotLength: bookingSlotLength,
          bufferMinutes: bookingBuffer,
          advanceNoticeMinutes: bookingAdvance,
          maxDaysAhead: bookingMaxDays,
          requireReason: bookingRequireReason,
          disableDuringOfficeHours: bookingDisableDuringOfficeHours,
          maxPerDay: bookingMaxPerDay,
          allowRescheduling: bookingAllowRescheduling,
          allowCancellations: bookingAllowCancellations,
          showSuccessMessage: bookingShowSuccessMessage,
          collectEmailFirst: bookingCollectEmailFirst,
        }),
      });
      if (!response.ok) {
        const d = await readJsonResponse<{ error?: string }>(response);
        throw new Error(d?.error ?? "Couldn't save Toat Link settings.");
      }
      setSuccess("Toat Link settings saved.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Couldn't save Toat Link settings.");
    } finally {
      setSavingBooking(false);
    }
  }, [
    authorizedFetch,
    setSuccess,
    setError,
    bookingAdvance,
    bookingBuffer,
    bookingDisableDuringOfficeHours,
    bookingEnabled,
    bookingGreetingMessage,
    bookingMaxDays,
    bookingMetaDescription,
    bookingPageTitle,
    bookingRequireReason,
    bookingSlotLength,
    bookingWindowDays,
    bookingWindowEnd,
    bookingWindowStart,
    bookingMaxPerDay,
    bookingAllowRescheduling,
    bookingAllowCancellations,
    bookingShowSuccessMessage,
    bookingCollectEmailFirst,
  ]);

  const toggleBookingWindowDay = useCallback((dayValue: number) => {
    setBookingWindowDays((current) => {
      const next = current.includes(dayValue)
        ? current.filter((value) => value !== dayValue)
        : [...current, dayValue];
      return next.sort((left, right) => left - right);
    });
  }, []);

  const copyToatLink = useCallback(async () => {
    const appOrigin = typeof window === "undefined" ? "https://toatre.com" : window.location.origin;
    const url = handle ? `${appOrigin}/${handle}` : null;
    if (!url) return;
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setSuccess("Toat Link copied.");
  }, [handle, setSuccess]);

  return {
    bookingEnabled,
    setBookingEnabled,
    bookingGreetingMessage,
    setBookingGreetingMessage,
    bookingPageTitle,
    setBookingPageTitle,
    bookingMetaDescription,
    setBookingMetaDescription,
    bookingWindowDays,
    setBookingWindowDays: setBookingWindowDays as Dispatch<SetStateAction<number[]>>,
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
    loadingBooking,
    savingBooking,
    bookingMaxPerDay,
    setBookingMaxPerDay,
    bookingAllowRescheduling,
    setBookingAllowRescheduling,
    bookingAllowCancellations,
    setBookingAllowCancellations,
    bookingShowSuccessMessage,
    setBookingShowSuccessMessage,
    bookingRedirectAfterBooking,
    setBookingRedirectAfterBooking,
    bookingRedirectUrl,
    setBookingRedirectUrl,
    bookingAddReasonToCalendar,
    setBookingAddReasonToCalendar,
    bookingAccentColor,
    setBookingAccentColor,
    bookingCollectEmailFirst,
    setBookingCollectEmailFirst,
    bookingHideFromSearch,
    setBookingHideFromSearch,
    bookingPasswordProtect,
    setBookingPasswordProtect,
    bookingUtmParams,
    setBookingUtmParams,
    saveBookingSettings,
    toggleBookingWindowDay,
    copyToatLink,
  };
}
