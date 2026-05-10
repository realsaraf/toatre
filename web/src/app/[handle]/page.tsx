"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  DEFAULT_BOOKING_META,
  groupAvailableSlotsByDay,
  HandleBookingPageView,
  type BookingMeta,
  type HostInfo,
  type Slot,
  type SlotDayGroup,
} from "./_components/HandleBookingPageView";

interface BookingPayload {
  slots: Slot[];
  host: HostInfo;
  booking?: Partial<BookingMeta>;
}

export default function HandleBookingPage() {
  const params = useParams();
  const handle = typeof params.handle === "string" ? params.handle : "";
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [host, setHost] = useState<HostInfo | null>(null);
  const [bookingMeta, setBookingMeta] = useState<BookingMeta>(DEFAULT_BOOKING_META);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successSlot, setSuccessSlot] = useState<Slot | null>(null);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setNotFound(false);

    try {
      const response = await fetch(`/api/booking/${encodeURIComponent(handle)}/slots`);
      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      const data = (await response.json()) as BookingPayload;
      setHost(data.host);
      setSlots(data.slots);
      setBookingMeta({
        timezone: data.booking?.timezone ?? DEFAULT_BOOKING_META.timezone,
        greetingMessage: data.booking?.greetingMessage ?? DEFAULT_BOOKING_META.greetingMessage,
        pageTitle: data.booking?.pageTitle ?? DEFAULT_BOOKING_META.pageTitle,
        metaDescription: data.booking?.metaDescription ?? DEFAULT_BOOKING_META.metaDescription,
        requireReason: data.booking?.requireReason ?? DEFAULT_BOOKING_META.requireReason,
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSlots();
    });
  }, [loadSlots]);

  const availableDays = useMemo<SlotDayGroup[]>(() => groupAvailableSlotsByDay(slots), [slots]);

  useEffect(() => {
    queueMicrotask(() => {
      if (availableDays.length === 0) {
        setActiveDayKey(null);
        setSelectedSlot(null);
        return;
      }

      const fallbackDay = availableDays[0].key;
      const nextDay = activeDayKey && availableDays.some((day) => day.key === activeDayKey) ? activeDayKey : fallbackDay;
      setActiveDayKey(nextDay);
      setSelectedSlot((current) => {
        if (!current) return null;
        const activeDay = availableDays.find((day) => day.key === nextDay) ?? availableDays[0];
        return activeDay.slots.some((slot) => slot.start === current.start) ? current : null;
      });
    });
  }, [activeDayKey, availableDays]);

  const activeDay = useMemo(
    () => availableDays.find((day) => day.key === activeDayKey) ?? availableDays[0] ?? null,
    [activeDayKey, availableDays],
  );

  const greeting = bookingMeta.greetingMessage.trim();
  const title = bookingMeta.pageTitle.trim() || DEFAULT_BOOKING_META.pageTitle;
  const description = bookingMeta.metaDescription.trim() || DEFAULT_BOOKING_META.metaDescription;

  const resetSuccess = () => {
    setShowSuccess(false);
    setShowBookingModal(false);
    setSuccessSlot(null);
    void loadSlots();
  };

  return (
    <HandleBookingPageView
      handle={handle}
      host={host}
      greeting={greeting}
      title={title}
      description={description}
      loading={loading}
      notFound={notFound}
      availableDays={availableDays}
      activeDay={activeDay}
      selectedSlot={selectedSlot}
      showBookingModal={showBookingModal}
      showSuccess={showSuccess}
      successSlot={successSlot}
      requireReason={bookingMeta.requireReason}
      onSelectDay={(key) => {
        setActiveDayKey(key);
        setSelectedSlot(null);
      }}
      onSelectSlot={(slot) => {
        setSelectedSlot(slot);
        setShowBookingModal(true);
      }}
      onCloseBooking={() => setShowBookingModal(false)}
      onBookingSuccess={() => {
        if (selectedSlot) setSuccessSlot(selectedSlot);
        setShowBookingModal(false);
        setShowSuccess(true);
      }}
      onResetSuccess={resetSuccess}
    />
  );
}