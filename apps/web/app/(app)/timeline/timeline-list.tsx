'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { format, isPast, isSameDay, isThisWeek, isThisYear, isToday, isTomorrow } from 'date-fns';
import type { EventRow } from '@/lib/types';
import EventStatusControls from './event-status-controls';
import { ActionLinks, PersonPills } from '@/components/plotto-bits';
import { EyeIcon, MapPinIcon } from '@/components/icons';

type StatusFilter = 'all' | 'active' | 'snoozed' | 'done';
type LiveStatus = EventRow['status'];

function formatTimeRange(startsAt: Date, endsAt: string | null): string {
  if (!endsAt) return format(startsAt, 'h:mm a');
  const ends = new Date(endsAt);
  if (!isSameDay(startsAt, ends)) {
    return `${format(startsAt, 'h:mm a')} → ${format(ends, 'MMM d h:mm a')}`;
  }
  const sameMeridiem = format(startsAt, 'a') === format(ends, 'a');
  const startLabel = format(startsAt, sameMeridiem ? 'h:mm' : 'h:mm a');
  return `${startLabel}–${format(ends, 'h:mm a')}`;
}

function formatWhen(startsAt: string, endsAt: string | null, allDay: boolean): string {
  const d = new Date(startsAt);
  const timeLabel = formatTimeRange(d, endsAt);
  if (isToday(d)) return allDay ? 'Today' : `Today · ${timeLabel}`;
  if (isTomorrow(d)) return allDay ? 'Tomorrow' : `Tom · ${timeLabel}`;
  if (isThisWeek(d, { weekStartsOn: 1 })) return allDay ? format(d, 'EEE') : `${format(d, 'EEE')} · ${timeLabel}`;
  if (isThisYear(d)) return allDay ? format(d, 'MMM d') : `${format(d, 'MMM d')} · ${timeLabel}`;
  return allDay ? format(d, 'MMM d, yyyy') : `${format(d, 'MMM d, yyyy')} · ${timeLabel}`;
}

function bucketize(events: EventRow[]) {
  const today: EventRow[] = [];
  const thisWeek: EventRow[] = [];
  const upcoming: EventRow[] = [];
  const past: EventRow[] = [];
  for (const e of events) {
    const d = new Date(e.starts_at);
    if (isPast(d) && !isToday(d)) past.push(e);
    else if (isToday(d)) today.push(e);
    else if (isThisWeek(d, { weekStartsOn: 1 })) thisWeek.push(e);
    else upcoming.push(e);
  }
  return { today, thisWeek, upcoming, past };
}

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'snoozed', label: 'Snoozed' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' },
];

export default function TimelineList({ events }: { events: EventRow[] }) {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('active');
  // Optimistic per-event status overrides so a click immediately
  // re-filters the list without waiting for a server refresh.
  const [overrides, setOverrides] = useState<Record<string, LiveStatus>>({});

  useEffect(() => setMounted(true), []);
  // Server has caught up — clear stale overrides for events whose
  // server-side status now matches the override (or has diverged for
  // some other reason).
  useEffect(() => {
    setOverrides((prev) => {
      const next: Record<string, LiveStatus> = {};
      for (const [id, st] of Object.entries(prev)) {
        const ev = events.find((e) => e.id === id);
        if (ev && ev.status !== st) next[id] = st;
      }
      return next;
    });
  }, [events]);

  const liveStatus = (e: EventRow): LiveStatus => overrides[e.id] ?? e.status;

  const filtered = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter((e) => liveStatus(e) === filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, filter, overrides]);

  const grouped = useMemo(() => bucketize(filtered), [filtered]);

  const counts = useMemo(() => {
    const c = { all: events.length, active: 0, snoozed: 0, done: 0 };
    for (const e of events) {
      const st = overrides[e.id] ?? e.status;
      if (st === 'active') c.active++;
      else if (st === 'snoozed') c.snoozed++;
      else if (st === 'done') c.done++;
    }
    return c;
  }, [events, overrides]);

  const onStatusChange = (id: string, next: LiveStatus) => {
    setOverrides((prev) => ({ ...prev, [id]: next }));
  };

  if (!mounted) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {['Today', 'This week', 'Upcoming'].map((t) => (
          <section key={t}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">{t}</h2>
            <div className="rounded-xl border border-dashed border-line bg-card/50 p-4 text-center text-xs text-fg-subtle">
              Loading…
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <>
      <div role="tablist" aria-label="Filter by status" className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-card p-1 text-xs">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          const count = counts[f.value];
          return (
            <button
              key={f.value}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
                active
                  ? 'bg-fg text-surface'
                  : 'text-fg-muted hover:bg-surface-sunken hover:text-fg'
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 py-px text-[10px] tabular-nums ${active ? 'bg-surface/20' : 'bg-surface-sunken text-fg-subtle'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Bucket title="Today" items={grouped.today} liveStatus={liveStatus} onStatusChange={onStatusChange} />
        <Bucket title="This week" items={grouped.thisWeek} liveStatus={liveStatus} onStatusChange={onStatusChange} />
        <Bucket title="Upcoming" items={grouped.upcoming} liveStatus={liveStatus} onStatusChange={onStatusChange} />
      </div>
      {grouped.past.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
            Past (still open)
          </h2>
          <div className="space-y-1.5">
            {grouped.past.map((e) => (
              <EventCard key={e.id} event={e} muted liveStatus={liveStatus(e)} onStatusChange={onStatusChange} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Bucket({
  title,
  items,
  liveStatus,
  onStatusChange,
}: {
  title: string;
  items: EventRow[];
  liveStatus: (e: EventRow) => LiveStatus;
  onStatusChange: (id: string, next: LiveStatus) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-card/50 p-4 text-center text-xs text-fg-subtle">
          Nothing here.
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((e) => (
            <EventCard key={e.id} event={e} liveStatus={liveStatus(e)} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </section>
  );
}

function importanceAccent(importance: EventRow['importance']) {
  if (importance === 'hard_block') return 'bg-accent';
  if (importance === 'soft_block') return 'bg-warn';
  return 'bg-line-strong';
}

function statusBadge(status: EventRow['status']) {
  switch (status) {
    case 'snoozed':
      return { label: 'Snoozed', className: 'border-warn/30 bg-warn-soft text-warn-fg' };
    case 'done':
      return { label: 'Done', className: 'border-success/30 bg-success-soft text-success' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'border-line bg-surface-sunken text-fg-subtle' };
    default:
      return null;
  }
}

function EventCard({
  event,
  muted = false,
  liveStatus,
  onStatusChange,
}: {
  event: EventRow;
  muted?: boolean;
  liveStatus: LiveStatus;
  onStatusChange: (id: string, next: LiveStatus) => void;
}) {
  const accent = importanceAccent(event.importance);
  const badge = statusBadge(liveStatus);
  const dimmed = muted || liveStatus === 'done' || liveStatus === 'cancelled';

  return (
    <article
      className={`group relative overflow-hidden rounded-xl border border-line bg-card transition hover:border-line-strong hover:shadow-sm ${
        dimmed ? 'opacity-60' : ''
      }`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${accent}`} />
      <div className="px-4 py-3 pl-5">
        {/* Row 1: title + time */}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className={`min-w-0 truncate text-sm font-medium text-fg ${liveStatus === 'done' ? 'line-through decoration-fg-subtle' : ''}`}>
            {event.title}
          </h3>
          <span className="shrink-0 text-[11px] tabular-nums text-fg-muted">
            {formatWhen(event.starts_at, event.ends_at, event.all_day)}
          </span>
        </div>

        {/* Row 2: meta line (location · status badge) */}
        {(event.location || badge) && (
          <div className="mt-1 flex items-center gap-2 text-[11px] text-fg-subtle">
            {event.location && (
              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                <MapPinIcon size={11} /> <span className="truncate">{event.location}</span>
              </span>
            )}
            {badge && (
              <span className={`pill ${badge.className}`}>{badge.label}</span>
            )}
          </div>
        )}

        {/* Row 3: people + action links — single row, wraps */}
        {((event.people?.length ?? 0) > 0 || (event.meeting_links?.length ?? 0) > 0 || (event.phone_numbers?.length ?? 0) > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <PersonPills people={event.people} />
            <ActionLinks meetingLinks={event.meeting_links} phoneNumbers={event.phone_numbers} compact />
          </div>
        )}

        {/* Row 4: action toolbar */}
        <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2">
          <Link
            href={`/event/${event.id}`}
            aria-label="View details"
            title="View details"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle transition hover:bg-surface-sunken hover:text-fg"
          >
            <EyeIcon size={14} />
          </Link>
          <EventStatusControls
            eventId={event.id}
            status={liveStatus}
            onChange={(next) => onStatusChange(event.id, next)}
          />
        </div>
      </div>
    </article>
  );
}
