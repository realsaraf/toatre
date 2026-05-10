"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarIcon, ChevronRightIcon, LocationIcon } from "@/components/mobile-ui";
import {
  formatClock,
  formatDateLabel,
  timeAgo,
  type BookingRequestItem,
} from "@/app/_components/booking-dashboard";
import { MobileAppShell, MobilePageIntro } from "@/app/_components/mobile-app-shell";

interface SharedInboxToat {
  id: string;
  shareUrl: string;
  role: string;
  createdAt: string;
  sender: {
    name: string;
    photoUrl: string | null;
  };
  toat: {
    title: string;
    enrichments?: {
      time?: { at?: string | null; startAt?: string | null; dueAt?: string | null };
      place?: { address?: string | null; placeName?: string | null };
      event?: { venueName?: string | null; address?: string | null };
    };
  };
}

type InboxFilter = "all" | "requests" | "shared";

interface MobileInboxViewProps {
  user: {
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null | undefined;
  bookingRequests: BookingRequestItem[];
  sharedToats: SharedInboxToat[];
  acceptedBookingsCount: number;
  loadingState: boolean;
  notice: string | null;
  actioningId: string | null;
  onRefresh: () => void;
  onAct: (request: BookingRequestItem, state: "accepted" | "denied") => Promise<void>;
  onOpenTimeline: () => void;
  onOpenInbox: () => void;
  onOpenBookings: () => void;
  onOpenMenu: () => void;
  onOpenCapture: () => void;
}

const styles = {
  section: {
    display: "grid",
    gap: 16,
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 5,
    padding: 5,
    borderRadius: 20,
    border: "1px solid rgba(192,179,255,0.36)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.82))",
    boxShadow: "0 14px 34px rgba(31,41,55,0.05)",
  },
  tabButton: {
    minHeight: 34,
    borderRadius: 16,
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 760,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  list: {
    display: "grid",
    gap: 18,
  },
  card: {
    borderRadius: 28,
    padding: 22,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.86))",
    border: "1px solid rgba(255,255,255,0.94)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
    display: "grid",
    gap: 18,
  },
  cardTop: {
    display: "grid",
    gridTemplateColumns: "68px minmax(0, 1fr) auto",
    gap: 16,
    alignItems: "start",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 22,
    objectFit: "cover" as const,
    boxShadow: "0 18px 40px rgba(31,41,55,0.12)",
  },
  avatarFallback: {
    width: 68,
    height: 68,
    borderRadius: 22,
    display: "grid",
    placeItems: "center" as const,
    background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.12))",
    color: "#5b3df5",
    fontSize: 26,
    fontWeight: 800,
  },
  cardCopy: {
    display: "grid",
    gap: 8,
    minWidth: 0,
  },
  sender: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: "#1f2a5a",
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.15,
    color: "#0f1b4c",
  },
  body: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.5,
    color: "#6b7280",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    padding: "0 14px",
    borderRadius: 999,
    background: "rgba(124,58,237,0.1)",
    color: "#6d28d9",
    fontSize: 14,
    fontWeight: 700,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 12,
    paddingTop: 16,
    borderTop: "1px solid rgba(99,102,241,0.1)",
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.45,
  },
  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  button: {
    minHeight: 54,
    borderRadius: 18,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
  },
  secondaryButton: {
    border: "1.5px solid rgba(99,102,241,0.6)",
    background: "#fff",
    color: "#5b3df5",
  },
  primaryButton: {
    border: "none",
    background: "linear-gradient(135deg, #5b3df5, #7c3aed)",
    color: "#fff",
    boxShadow: "0 22px 44px rgba(91,61,245,0.18)",
  },
  empty: {
    minHeight: 220,
    borderRadius: 28,
    padding: 28,
    border: "1px dashed rgba(99,102,241,0.18)",
    background: "rgba(255,255,255,0.72)",
    color: "#6b7280",
    display: "grid",
    placeItems: "center" as const,
    textAlign: "center" as const,
    gap: 10,
  },
  notice: {
    borderRadius: 18,
    padding: "12px 14px",
    border: "1px solid rgba(124,58,237,0.14)",
    background: "rgba(124,58,237,0.08)",
    color: "#5b21b6",
    fontSize: 14,
    fontWeight: 600,
  },
  earlierLabel: {
    margin: "2px 0 0",
    fontSize: 15,
    fontWeight: 700,
    color: "#6b7280",
  },
} as const;

export function MobileInboxView({
  user,
  bookingRequests,
  sharedToats,
  acceptedBookingsCount,
  loadingState,
  notice,
  actioningId,
  onRefresh,
  onAct,
  onOpenTimeline,
  onOpenInbox,
  onOpenBookings,
  onOpenMenu,
  onOpenCapture,
}: MobileInboxViewProps) {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [referenceTime] = useState(() => Date.now());

  const filteredRequests = filter === "shared" ? [] : bookingRequests;
  const filteredShared = filter === "requests" ? [] : sharedToats;
  const hasAcceptedShortcut = acceptedBookingsCount > 0;

  const earlierItems = useMemo(
    () => bookingRequests.filter((request) => new Date(request.slotStart).getTime() < referenceTime),
    [bookingRequests, referenceTime],
  );

  return (
    <MobileAppShell
      user={user}
      active="inbox"
      inboxCount={bookingRequests.length + sharedToats.length}
      onOpenTimeline={onOpenTimeline}
      onOpenInbox={onOpenInbox}
      onOpenBookings={onOpenBookings}
      onOpenMenu={onOpenMenu}
      onOpenCapture={onOpenCapture}
      topRight={null}
      header={
        <MobilePageIntro
          title="Inbox"
          subtitle="Requests and shared toats"
          count={bookingRequests.length + sharedToats.length}
          controls={
            <div style={styles.tabs}>
              <SegmentButton active={filter === "all"} onClick={() => setFilter("all")}>All</SegmentButton>
              <SegmentButton active={filter === "requests"} onClick={() => setFilter("requests")}>Requests</SegmentButton>
              <SegmentButton active={filter === "shared"} onClick={() => setFilter("shared")}>Shared</SegmentButton>
              <SegmentButton active={false} onClick={onOpenBookings}>Accepted</SegmentButton>
            </div>
          }
        />
      }
    >
      <section style={styles.section}>
        {notice ? <div style={styles.notice}>{notice}</div> : null}
        {loadingState ? (
          <div style={styles.empty}>
            <strong>Loading inbox</strong>
            <span>Checking booking requests and shared toats now.</span>
          </div>
        ) : null}

        {!loadingState ? (
          <button type="button" onClick={onRefresh} style={{ ...styles.button, ...styles.secondaryButton }}>
            Refresh inbox
          </button>
        ) : null}

        <div style={styles.list}>
          {filteredShared.map((share) => (
            <article key={share.id} style={styles.card}>
              <div style={styles.cardTop}>
                <AvatarImage name={share.sender.name} photoUrl={share.sender.photoUrl} />
                <div style={styles.cardCopy}>
                  <p style={styles.sender}>{share.sender.name}</p>
                  <h2 style={styles.title}>{share.toat.title}</h2>
                  <p style={styles.body}>{share.sender.name.split(" ")[0]} shared this toat with you.</p>
                </div>
                <span style={styles.tag}>Shared toat</span>
              </div>

              <div style={styles.meta}>
                {resolveShareTime(share) ? (
                  <span style={styles.metaItem}>
                    <CalendarIcon size={16} />
                    {resolveShareTime(share)}
                  </span>
                ) : null}
                {resolveShareLocation(share) ? (
                  <span style={styles.metaItem}>
                    <LocationIcon size={16} />
                    {resolveShareLocation(share)}
                  </span>
                ) : null}
              </div>

              <div style={{ ...styles.actions, gridTemplateColumns: "1fr" }}>
                <Link href={share.shareUrl} style={{ ...styles.button, ...styles.secondaryButton }}>
                  View
                </Link>
              </div>
            </article>
          ))}

          {filteredRequests.map((request) => (
            <article key={request.id} style={styles.card}>
              <div style={styles.cardTop}>
                <AvatarImage name={request.name} />
                <div style={styles.cardCopy}>
                  <p style={styles.sender}>{request.name}</p>
                  <h2 style={styles.title}>{request.message || request.title}</h2>
                  <p style={styles.body}>Requested {timeAgo(request.createdAt)}.</p>
                </div>
                <span style={{ ...styles.tag, background: "rgba(251,146,60,0.12)", color: "#ea580c" }}>
                  Booking request
                </span>
              </div>

              <div style={styles.meta}>
                <span style={styles.metaItem}>
                  <CalendarIcon size={16} />
                  {formatDateLabel(request.slotStart)} · {formatClock(request.slotStart).time} {formatClock(request.slotStart).period}
                </span>
                {request.location ? (
                  <span style={styles.metaItem}>
                    <LocationIcon size={16} />
                    {request.location}
                  </span>
                ) : null}
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  style={{ ...styles.button, ...styles.secondaryButton, borderColor: "rgba(251,146,60,0.7)", color: "#ea580c" }}
                  onClick={() => void onAct(request, "denied")}
                  disabled={actioningId === request.id}
                >
                  {actioningId === request.id ? "Working..." : "Decline"}
                </button>
                <button
                  type="button"
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={() => void onAct(request, "accepted")}
                  disabled={actioningId === request.id}
                >
                  {actioningId === request.id ? "Working..." : "Accept"}
                </button>
              </div>
            </article>
          ))}
        </div>

        {!loadingState && filteredRequests.length === 0 && filteredShared.length === 0 ? (
          <div style={styles.empty}>
            <strong>{hasAcceptedShortcut ? "Nothing waiting here" : "Inbox is clear"}</strong>
            <span>{hasAcceptedShortcut ? "Accepted bookings are already moved into Bookings." : "No requests or shared toats are waiting right now."}</span>
          </div>
        ) : null}

        {!loadingState && filter === "all" && earlierItems.length > 0 ? (
          <div style={styles.section}>
            <p style={styles.earlierLabel}>Earlier</p>
            {earlierItems.slice(0, 1).map((request) => (
              <article key={`earlier-${request.id}`} style={{ ...styles.card, gap: 14 }}>
                <div style={styles.cardTop}>
                  <AvatarImage name={request.name} />
                  <div style={styles.cardCopy}>
                    <p style={styles.sender}>{request.name}</p>
                    <h2 style={{ ...styles.title, fontSize: 20 }}>{request.message || request.title}</h2>
                    <p style={styles.body}>{formatDateLabel(request.slotStart)} · {formatClock(request.slotStart).time} {formatClock(request.slotStart).period}</p>
                  </div>
                  <span style={{ ...styles.tag, background: "rgba(34,197,94,0.12)", color: "#15803d" }}>
                    Accepted
                  </span>
                </div>
                <button type="button" onClick={onOpenBookings} style={{ ...styles.button, ...styles.secondaryButton }}>
                  Open Bookings <ChevronRightIcon size={16} />
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </MobileAppShell>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.tabButton,
        background: active ? "#fff" : "transparent",
        boxShadow: active ? "0 12px 28px rgba(31,41,55,0.06)" : "none",
        color: active ? "#5b3df5" : "#6b7280",
      }}
    >
      {children}
    </button>
  );
}

function AvatarImage({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt={name} referrerPolicy="no-referrer" style={styles.avatar} />;
  }

  return <div style={styles.avatarFallback}>{name.charAt(0).toUpperCase()}</div>;
}

function resolveShareTime(share: SharedInboxToat) {
  const value =
    share.toat.enrichments?.time?.at ??
    share.toat.enrichments?.time?.startAt ??
    share.toat.enrichments?.time?.dueAt ??
    null;
  return value ? `${formatDateLabel(value)} · ${formatClock(value).time} ${formatClock(value).period}` : null;
}

function resolveShareLocation(share: SharedInboxToat) {
  return (
    share.toat.enrichments?.place?.address ??
    share.toat.enrichments?.place?.placeName ??
    share.toat.enrichments?.event?.venueName ??
    share.toat.enrichments?.event?.address ??
    null
  );
}