"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { MobileBookingsView } from "./_components/mobile/MobileBookingsView";
import {
  BookingDashboardShell,
  FilterButton,
  IconFilterButton,
  RequestStatusPill,
  formatClock,
  formatDateLabel,
  formatFullDate,
  type BookingRequestItem,
} from "@/app/_components/booking-dashboard";

interface BookingRequestsResponse {
  requests?: BookingRequestItem[];
}

type BookingFilter = "upcoming" | "past" | "all";

function MiniPinIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="11" r="2" fill="currentColor" /></svg>;
}

function MiniPersonIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2" /><path d="M6 20a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

export default function BookingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [requests, setRequests] = useState<BookingRequestItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<BookingRequestItem[]>([]);
  const [filter, setFilter] = useState<BookingFilter>("upcoming");
  const [loadingState, setLoadingState] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const authorizedFetch = useCallback(async (input: string, init?: RequestInit) => {
    if (!user) throw new Error("Auth required");
    const token = await user.getIdToken();
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetch(input, { ...init, headers });
  }, [user]);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoadingState(true);
    setNotice(null);
    try {
      const range = filter === "past" ? "past" : filter === "all" ? "all" : "upcoming";
      const [bookingsResponse, pendingResponse] = await Promise.all([
        authorizedFetch(`/api/booking/requests?state=accepted&range=${range}`),
        authorizedFetch("/api/booking/requests?state=pending&range=upcoming"),
      ]);
      const bookingsData = (await bookingsResponse.json()) as BookingRequestsResponse;
      const pendingData = (await pendingResponse.json()) as BookingRequestsResponse;
      setRequests(bookingsData.requests ?? []);
      setPendingRequests(pendingData.requests ?? []);
    } catch {
      setNotice("Bookings could not refresh. Try again in a moment.");
    } finally {
      setLoadingState(false);
    }
  }, [authorizedFetch, filter, user]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadBookings();
    });
  }, [loadBookings]);

  const grouped = useMemo(() => groupBookings(requests), [requests]);
  const isDesktop = viewportWidth !== null && viewportWidth >= 1100;

  if (!isDesktop) {
    return (
      <MobileBookingsView
        user={user}
        requests={requests}
        pendingCount={pendingRequests.length}
        loadingState={loadingState}
        notice={notice}
        currentFilter={filter}
        onChangeFilter={setFilter}
        onOpenRequest={(request) => {
          if (request.toatId) {
            router.push(`/toats/${request.toatId}`);
            return;
          }
          router.push("/timeline");
        }}
        onOpenTimeline={() => router.push("/timeline")}
        onOpenInbox={() => router.push("/inbox")}
        onOpenBookings={() => router.push("/bookings")}
        onOpenMenu={() => router.push("/settings")}
        onOpenCapture={() => router.push("/capture")}
      />
    );
  }

  return (
    <BookingDashboardShell
      user={user}
      active="bookings"
      inboxCount={pendingRequests.length}
      bookingCount={requests.length}
      pageTitle="Bookings"
      pageSubtitle="All toats booked through your link"
      onCapture={() => router.push("/capture?mode=text")}
    >
      <section className="booking-dashboard-content" style={{ gridTemplateColumns: "1fr" }}>
        <div className="booking-panel">
          <div className="booking-panel-head">
            <div className="booking-panel-meta"><strong>Accepted</strong><span className="booking-panel-count">{requests.length}</span></div>
            <div className="booking-panel-actions">
              <FilterButton>{filter === "past" ? "Past" : filter === "all" ? "All" : "Upcoming"}</FilterButton>
              <IconFilterButton />
              <button type="button" className="booking-small-button" onClick={() => setFilter((current) => current === "upcoming" ? "past" : current === "past" ? "all" : "upcoming")}>Change view</button>
              <button type="button" className="booking-small-button" onClick={() => void loadBookings()}>Refresh</button>
            </div>
          </div>

          {notice ? <div className="booking-notice">{notice}</div> : null}
          {loadingState ? <div className="booking-empty"><strong>Loading bookings</strong><span>Checking toats booked through your link.</span></div> : null}
          {!loadingState && requests.length === 0 ? <div className="booking-empty"><strong>No bookings here</strong><span>Accepted booking requests will appear here.</span></div> : null}

          {!loadingState && grouped.map((group) => (
            <section key={group.label}>
              <h3 className="booking-section-label">{group.label}</h3>
              <div className="request-list">
                {group.items.map((request) => <BookingRow key={request.id} request={request} completed={filter === "past"} />)}
              </div>
            </section>
          ))}
        </div>
      </section>
    </BookingDashboardShell>
  );
}

function BookingRow({ request, completed }: { request: BookingRequestItem; completed: boolean }) {
  const clock = formatClock(request.slotStart);
  const isAllDay = new Date(request.slotEnd).getTime() - new Date(request.slotStart).getTime() >= 23 * 60 * 60 * 1000;
  const icon = chooseBookingIcon(request);

  return (
    <article className="booking-row">
      <span className="booking-type-icon" style={{ background: icon.background, color: icon.color }}>{icon.label}</span>
      <span className="booking-time"><strong>{isAllDay ? formatDateLabel(request.slotStart) : clock.time}</strong><span>{isAllDay ? "All day" : clock.period}</span></span>
      <span className="booking-copy">
        <strong>{request.message || request.title}</strong>
        <span><MiniPinIcon /> {request.location || "Location not set"}</span>
        <span><MiniPersonIcon /> {request.name}</span>
      </span>
      <RequestStatusPill request={request} completed={completed} />
      <button type="button" className="booking-more" aria-label="More booking actions">⋮</button>
    </article>
  );
}

function groupBookings(requests: BookingRequestItem[]) {
  const now = new Date();
  const todayKey = dayKey(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = dayKey(tomorrow);
  const map = new Map<string, BookingRequestItem[]>();

  for (const request of requests) {
    const date = new Date(request.slotStart);
    const key = dayKey(date);
    let label = formatFullDate(request.slotStart);
    if (key === todayKey) label = `Today • ${formatDateLabel(request.slotStart)}`;
    else if (key === tomorrowKey) label = `Tomorrow • ${formatDateLabel(request.slotStart)}`;
    else if (date.getTime() > tomorrow.getTime()) label = "Upcoming";
    map.set(label, [...(map.get(label) ?? []), request]);
  }

  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function dayKey(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

function chooseBookingIcon(request: BookingRequestItem) {
  const text = `${request.title} ${request.message ?? ""}`.toLowerCase();
  if (text.includes("coffee")) return { label: "☕", background: "#efe9ff", color: "#5b2dff" };
  if (text.includes("flight")) return { label: "✈", background: "#e6f8ef", color: "#16a36a" };
  if (text.includes("dinner")) return { label: "🍴", background: "#fff0db", color: "#c76a00" };
  if (text.includes("pick up") || text.includes("pickup")) return { label: "🚙", background: "#eaf1ff", color: "#3365ff" };
  return { label: "📅", background: "#efe9ff", color: "#5b2dff" };
}
