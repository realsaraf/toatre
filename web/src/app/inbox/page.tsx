"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { MobileInboxView } from "./_components/mobile/MobileInboxView";
import {
  BookingDashboardShell,
  RequestAvatar,
  formatClock,
  formatDateLabel,
  timeAgo,
  type BookingRequestItem,
} from "@/app/_components/booking-dashboard";

interface SharedInboxToat {
  id: string;
  token: string;
  shareUrl: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string | null;
    name: string;
    handle: string | null;
    email: string | null;
    photoUrl: string | null;
  };
  recipient: {
    name: string | null;
    relationship: string | null;
  };
  toat: {
    id: string;
    title: string;
    notes: string | null;
    enrichments?: {
      time?: { at?: string | null; startAt?: string | null; dueAt?: string | null };
      place?: { address?: string | null; placeName?: string | null };
      event?: { venueName?: string | null; address?: string | null };
      communication?: { contact?: string | null };
    };
    createdAt: string;
    updatedAt: string;
  };
}

interface InboxResponse {
  bookingRequests?: BookingRequestItem[];
  sharedToats?: SharedInboxToat[];
}

type InboxItem =
  | { type: "booking"; createdAt: string; request: BookingRequestItem }
  | { type: "shared"; createdAt: string; share: SharedInboxToat };

function MiniCalendarIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="4" y="6" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M8 3v5M16 3v5M4 10h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function MiniClockIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" /><path d="M12 7.5v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function MiniPinIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="11" r="2" fill="currentColor" /></svg>;
}

function ShareGlyph() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M7 12a3 3 0 1 0 0 .01M17 6a3 3 0 1 0 0 .01M17 18a3 3 0 1 0 0 .01M9.6 10.7l4.8-3.4M9.6 13.3l4.8 3.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

export default function InboxPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [bookingRequests, setBookingRequests] = useState<BookingRequestItem[]>([]);
  const [sharedToats, setSharedToats] = useState<SharedInboxToat[]>([]);
  const [acceptedBookingsCount, setAcceptedBookingsCount] = useState(0);
  const [loadingState, setLoadingState] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
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

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingState(true);
    try {
      const [inboxResponse, bookingsResponse] = await Promise.all([
        authorizedFetch("/api/inbox"),
        authorizedFetch("/api/booking/requests?state=accepted&range=all"),
      ]);
      const inboxData = (await inboxResponse.json()) as InboxResponse;
      const bookingsData = (await bookingsResponse.json()) as { requests?: BookingRequestItem[] };
      setBookingRequests(inboxData.bookingRequests ?? []);
      setSharedToats(inboxData.sharedToats ?? []);
      setAcceptedBookingsCount(bookingsData.requests?.length ?? 0);
    } catch {
      setNotice("Inbox could not refresh. Try again in a moment.");
    } finally {
      setLoadingState(false);
    }
  }, [authorizedFetch, user]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  const act = useCallback(async (request: BookingRequestItem, state: "accepted" | "denied") => {
    setActioningId(request.id);
    setNotice(null);
    try {
      const response = await authorizedFetch(`/api/booking/requests/${request.id}`, {
        method: "PATCH",
        body: JSON.stringify({ state }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not complete that action.");
      }
      setNotice(state === "accepted" ? `${request.name}'s booking moved to Bookings.` : `${request.name}'s request was declined.`);
      await loadData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setActioningId(null);
    }
  }, [authorizedFetch, loadData]);

  const inboxItems = useMemo<InboxItem[]>(() => [
    ...bookingRequests.map((request) => ({ type: "booking" as const, createdAt: request.createdAt, request })),
    ...sharedToats.map((share) => ({ type: "shared" as const, createdAt: share.createdAt, share })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [bookingRequests, sharedToats]);

  const isDesktop = viewportWidth !== null && viewportWidth >= 1100;

  if (!isDesktop) {
    return (
      <MobileInboxView
        user={user}
        bookingRequests={bookingRequests}
        sharedToats={sharedToats}
        acceptedBookingsCount={acceptedBookingsCount}
        loadingState={loadingState}
        notice={notice}
        actioningId={actioningId}
        onRefresh={() => void loadData()}
        onAct={act}
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
      active="inbox"
      inboxCount={inboxItems.length}
      bookingCount={acceptedBookingsCount}
      pageTitle="Inbox"
      pageSubtitle="Requests you received and toats shared by your connections"
      onCapture={() => router.push("/capture?mode=text")}
    >
      <section className="booking-dashboard-content" style={{ gridTemplateColumns: "1fr" }}>
        <div className="booking-panel">
          <div className="booking-panel-head">
            <div className="booking-panel-meta"><strong>Waiting now</strong><span className="booking-panel-count">{inboxItems.length}</span></div>
            <button type="button" className="booking-small-button" onClick={() => void loadData()}>Refresh</button>
          </div>

          {notice ? <div className="booking-notice">{notice}</div> : null}
          {loadingState ? <div className="booking-empty"><strong>Loading inbox</strong><span>Checking booking requests and shared toats.</span></div> : null}
          {!loadingState && inboxItems.length === 0 ? <div className="booking-empty"><strong>All clear</strong><span>No booking requests or shared toats are waiting.</span></div> : null}

          <div className="request-list">
            {inboxItems.map((item, index) => item.type === "booking" ? (
              <BookingRequestCard
                key={`booking-${item.request.id}`}
                request={item.request}
                unread={index === 0}
                disabled={actioningId === item.request.id}
                onAct={act}
              />
            ) : (
              <SharedToatCard key={`shared-${item.share.id}`} share={item.share} unread={index === 0} />
            ))}
          </div>
        </div>
      </section>
    </BookingDashboardShell>
  );
}

function BookingRequestCard({ request, unread, disabled, onAct }: { request: BookingRequestItem; unread: boolean; disabled: boolean; onAct: (request: BookingRequestItem, state: "accepted" | "denied") => Promise<void> }) {
  const start = formatClock(request.slotStart);
  return (
    <article className={`request-card${unread ? " unread" : ""}`}>
      <RequestAvatar name={request.name} />
      <div className="request-copy">
        <strong>{request.name}</strong>
        <p>{request.message || request.title}</p>
        <div className="request-meta">
          <span><MiniCalendarIcon /> {formatDateLabel(request.slotStart)}</span>
          <span><MiniClockIcon /> {start.time} {start.period}</span>
          {request.location ? <span><MiniPinIcon /> {request.location}</span> : null}
        </div>
      </div>
      <span className="request-age">{timeAgo(request.createdAt)}</span>
      <div className="request-actions">
        <button type="button" className="decline-button" disabled={disabled} onClick={() => void onAct(request, "denied")}>{disabled ? "..." : "Decline"}</button>
        <button type="button" className="accept-button" disabled={disabled} onClick={() => void onAct(request, "accepted")}>{disabled ? "..." : "Accept"}</button>
      </div>
    </article>
  );
}

function SharedToatCard({ share, unread }: { share: SharedInboxToat; unread: boolean }) {
  const time = share.toat.enrichments?.time?.at ?? share.toat.enrichments?.time?.startAt ?? share.toat.enrichments?.time?.dueAt ?? null;
  const location = share.toat.enrichments?.place?.address ?? share.toat.enrichments?.place?.placeName ?? share.toat.enrichments?.event?.venueName ?? share.toat.enrichments?.event?.address ?? null;
  return (
    <article className={`request-card shared-toat-card${unread ? " unread" : ""}`}>
      <span className="request-avatar shared-avatar"><ShareGlyph /></span>
      <div className="request-copy">
        <strong>{share.sender.name}</strong>
        <p>Shared “{share.toat.title}” with you{share.recipient.relationship ? ` as ${share.recipient.relationship}` : ""}.</p>
        <div className="request-meta">
          {time ? <span><MiniCalendarIcon /> {formatDateLabel(time)}</span> : null}
          {location ? <span><MiniPinIcon /> {location}</span> : null}
          {share.role ? <span>{share.role === "edit" ? "Can edit" : "Can view"}</span> : null}
        </div>
      </div>
      <span className="request-age">{timeAgo(share.createdAt)}</span>
      <div className="request-actions">
        <Link className="accept-button inbox-open-link" href={share.shareUrl}>Open</Link>
      </div>
    </article>
  );
}
