"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, ChevronRightIcon, ClockIcon, MessageIcon } from "@/components/mobile-ui";
import {
  formatClock,
  formatDateLabel,
  type BookingRequestItem,
} from "@/app/_components/booking-dashboard";
import { MobileAppShell, MobileEmptyState, MobilePageIntro, MobileSegmentedControl } from "@/app/_components/mobile-app-shell";

type DisplayFilter = "all" | "upcoming" | "completed" | "canceled";
type ServerFilter = "all" | "upcoming" | "past";

interface MobileBookingsViewProps {
  user: {
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null | undefined;
  requests: BookingRequestItem[];
  pendingCount: number;
  loadingState: boolean;
  notice: string | null;
  currentFilter: ServerFilter;
  onChangeFilter: (filter: ServerFilter) => void;
  onOpenRequest: (request: BookingRequestItem) => void;
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
  summary: {
    display: "grid",
    gridTemplateColumns: "58px minmax(0, 1fr) auto",
    gap: 16,
    alignItems: "center",
    borderRadius: 28,
    padding: 22,
    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.86))",
    border: "1px solid rgba(255,255,255,0.94)",
    boxShadow: "0 28px 80px rgba(31,41,55,0.08)",
  },
  summaryIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    display: "grid",
    placeItems: "center" as const,
    background: "rgba(124,58,237,0.1)",
    color: "#6d28d9",
  },
  summaryTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#0f1b4c",
  },
  summaryBody: {
    margin: "6px 0 0",
    fontSize: 15,
    color: "#6b7280",
  },
  sectionLabel: {
    margin: "2px 0 0",
    fontSize: 15,
    fontWeight: 700,
    color: "#6b7280",
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
    gap: 14,
  },
  cardTop: {
    display: "grid",
    gridTemplateColumns: "72px minmax(0, 1fr) auto",
    gap: 16,
    alignItems: "start",
  },
  iconPanel: {
    width: 72,
    height: 72,
    borderRadius: 22,
    display: "grid",
    placeItems: "center" as const,
  },
  cardCopy: {
    display: "grid",
    gap: 6,
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.15,
    fontWeight: 800,
    color: "#0f1b4c",
  },
  body: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.45,
    color: "#6b7280",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    padding: "0 14px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
  },
  meta: {
    display: "grid",
    gap: 10,
    color: "#6b7280",
    fontSize: 15,
  },
  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    minHeight: 52,
    borderRadius: 18,
    border: "1.5px solid rgba(99,102,241,0.6)",
    background: "#fff",
    color: "#5b3df5",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
} as const;

export function MobileBookingsView({
  user,
  requests,
  pendingCount,
  loadingState,
  notice,
  currentFilter,
  onChangeFilter,
  onOpenRequest,
  onOpenTimeline,
  onOpenInbox,
  onOpenBookings,
  onOpenMenu,
  onOpenCapture,
}: MobileBookingsViewProps) {
  const [referenceTime] = useState(() => Date.now());
  const [displayFilter, setDisplayFilter] = useState<DisplayFilter>(() => mapServerFilterToDisplay(currentFilter));

  const visibleRequests = useMemo(() => {
    if (displayFilter === "canceled") return [];
    return requests;
  }, [displayFilter, requests]);

  const summary = useMemo(() => buildWeekSummary(visibleRequests), [visibleRequests]);
  const groups = useMemo(() => groupForDisplay(visibleRequests, displayFilter, referenceTime), [visibleRequests, displayFilter, referenceTime]);
  const segmentItems: Array<{ value: DisplayFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "completed", label: "Completed" },
    { value: "canceled", label: "Canceled" },
  ];

  return (
    <MobileAppShell
      user={user}
      active="bookings"
      inboxCount={pendingCount}
      onOpenTimeline={onOpenTimeline}
      onOpenInbox={onOpenInbox}
      onOpenBookings={onOpenBookings}
      onOpenMenu={onOpenMenu}
      onOpenCapture={onOpenCapture}
      header={
        <MobilePageIntro
          title="Bookings"
          subtitle="Toats booked through your handle page"
          count={displayFilter === "canceled" ? 0 : requests.length}
          controls={
            <MobileSegmentedControl
              value={displayFilter}
              items={segmentItems}
              onChange={(next) => changeDisplayFilter(next, onChangeFilter, setDisplayFilter)}
            />
          }
        />
      }
    >
      <section style={styles.section}>
        {notice ? <div style={styles.notice}>{notice}</div> : null}

        {!loadingState && displayFilter !== "canceled" && summary ? (
          <div style={styles.summary}>
            <div style={styles.summaryIcon}><CalendarIcon size={28} /></div>
            <div>
              <h2 style={styles.summaryTitle}>This week: {summary.count} booking{summary.count === 1 ? "" : "s"}</h2>
              <p style={styles.summaryBody}>{summary.rangeLabel}</p>
            </div>
            <ChevronRightIcon size={22} />
          </div>
        ) : null}

        {loadingState ? (
          <MobileEmptyState icon={<CalendarIcon size={24} />} title="Loading bookings" body="Checking everything booked through your handle page." />
        ) : null}

        {!loadingState && groups.length === 0 ? (
          <MobileEmptyState
            icon={<CalendarIcon size={24} />}
            title={displayFilter === "canceled" ? "No canceled bookings" : "No bookings here"}
            body={displayFilter === "canceled" ? "Canceled bookings will live here once that state is available." : "Accepted booking requests from your handle page will collect here so your upcoming time stays easy to scan."}
            actions={[
              { label: "Handle settings", onClick: onOpenMenu },
              { label: "Open Inbox", onClick: onOpenInbox, variant: "secondary" },
            ]}
          />
        ) : null}

        {groups.map((group) => (
          <section key={group.label} style={styles.section}>
            <p style={styles.sectionLabel}>{group.label}</p>
            <div style={styles.list}>
              {group.items.map((request) => <BookingCard key={request.id} request={request} onOpen={() => onOpenRequest(request)} referenceTime={referenceTime} />)}
            </div>
          </section>
        ))}
      </section>
    </MobileAppShell>
  );
}

function BookingCard({ request, onOpen, referenceTime }: { request: BookingRequestItem; onOpen: () => void; referenceTime: number }) {
  const future = new Date(request.slotStart).getTime() >= referenceTime;
  const icon = chooseBookingIcon(request);

  return (
    <article style={styles.card}>
      <div style={styles.cardTop}>
        <div style={{ ...styles.iconPanel, background: icon.background, color: icon.color }}>
          <CalendarIcon size={30} />
        </div>
        <div style={styles.cardCopy}>
          <h2 style={styles.title}>{request.message || request.title}</h2>
          <p style={styles.body}>Booked by {request.name}</p>
        </div>
        <span style={{ ...styles.tag, background: future ? "rgba(124,58,237,0.1)" : "rgba(34,197,94,0.12)", color: future ? "#6d28d9" : "#15803d" }}>
          {future ? "Upcoming" : "Completed"}
        </span>
      </div>

      <div style={styles.meta}>
        <span style={styles.metaItem}><ClockIcon size={16} /> {formatDateLabel(request.slotStart)} · {formatClock(request.slotStart).time} {formatClock(request.slotStart).period}</span>
        <span style={styles.metaItem}><MessageIcon size={16} /> {request.email || request.phone || "via Toatre Link"}</span>
      </div>

      <button type="button" onClick={onOpen} style={styles.actionButton}>
        View
      </button>
    </article>
  );
}

function changeDisplayFilter(
  displayFilter: DisplayFilter,
  onChangeFilter: (filter: ServerFilter) => void,
  setDisplayFilter: (filter: DisplayFilter) => void,
) {
  setDisplayFilter(displayFilter);
  if (displayFilter === "completed") onChangeFilter("past");
  else if (displayFilter === "all") onChangeFilter("all");
  else onChangeFilter("upcoming");
}

function mapServerFilterToDisplay(filter: ServerFilter): DisplayFilter {
  if (filter === "past") return "completed";
  return filter;
}

function buildWeekSummary(requests: BookingRequestItem[]) {
  if (requests.length === 0) return null;

  const [first] = [...requests].sort((a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime());
  const start = new Date(first.slotStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    count: requests.filter((request) => isWithinWeek(new Date(request.slotStart), start, end)).length,
    rangeLabel: `${formatDateLabel(start.toISOString())} - ${formatDateLabel(end.toISOString())}`,
  };
}

function groupForDisplay(requests: BookingRequestItem[], filter: DisplayFilter, referenceTime: number) {
  if (filter === "canceled") return [] as Array<{ label: string; items: BookingRequestItem[] }>;
  if (filter === "completed") return requests.length ? [{ label: "Earlier", items: requests }] : [];
  if (filter === "upcoming") return requests.length ? [{ label: "Upcoming", items: requests }] : [];

  const upcoming = requests.filter((request) => new Date(request.slotStart).getTime() >= referenceTime);
  const earlier = requests.filter((request) => new Date(request.slotStart).getTime() < referenceTime);
  return [
    ...(upcoming.length ? [{ label: "Upcoming", items: upcoming }] : []),
    ...(earlier.length ? [{ label: "Earlier", items: earlier }] : []),
  ];
}

function isWithinWeek(date: Date, start: Date, end: Date) {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function chooseBookingIcon(request: BookingRequestItem) {
  const text = `${request.title} ${request.message ?? ""}`.toLowerCase();
  if (text.includes("coffee")) return { background: "#efe9ff", color: "#5b2dff" };
  if (text.includes("flight")) return { background: "#e6f8ef", color: "#16a36a" };
  if (text.includes("dinner")) return { background: "#fff0db", color: "#c76a00" };
  if (text.includes("pick up") || text.includes("pickup")) return { background: "#eaf1ff", color: "#3365ff" };
  return { background: "#efe9ff", color: "#5b2dff" };
}