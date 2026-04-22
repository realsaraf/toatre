'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { format, isToday, isTomorrow, isThisWeek, isPast, isThisYear } from 'date-fns';
import type { EventRow } from '@/lib/types';
import EventStatusControls from './event-status-controls';

function formatWhen(startsAt: string, allDay: boolean): string {
  const d = new Date(startsAt);
  if (isToday(d)) return allDay ? 'Today' : `Today · ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return allDay ? 'Tomorrow' : `Tom · ${format(d, 'h:mm a')}`;
  if (isThisWeek(d, { weekStartsOn: 1 })) return allDay ? format(d, 'EEE') : format(d, 'EEE h:mm a');
  if (isThisYear(d)) return allDay ? format(d, 'MMM d') : format(d, 'MMM d · h:mm a');
  return format(d, 'MMM d, yyyy');
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

export default function TimelineList({ events }: { events: EventRow[] }) {
  // Defer bucketing + time formatting to client so we use the browser's
  // timezone, not the server's (UTC on Vercel).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const grouped = useMemo(() => bucketize(events), [events]);

  if (!mounted) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {['Today', 'This week', 'Upcoming'].map((t) => (
          <section key={t}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">{t}</h2>
            <div className="rounded-xl border border-dashed border-ink-200 bg-white/50 p-4 text-center text-xs text-ink-400">
              Loading…
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <Bucket title="Today" items={grouped.today} />
        <Bucket title="This week" items={grouped.thisWeek} />
        <Bucket title="Upcoming" items={grouped.upcoming} />
      </div>
      {grouped.past.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
            Past (still active)
          </h2>
          <div className="space-y-2">
            {grouped.past.map((e) => (
              <EventCard key={e.id} event={e} muted />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Bucket({ title, items }: { title: string; items: EventRow[] }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 bg-white/50 p-4 text-center text-xs text-ink-400">
          Nothing here.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </section>
  );
}

function EventCard({ event, muted = false }: { event: EventRow; muted?: boolean }) {
  const accent =
    event.importance === 'hard_block'
      ? 'bg-coral-500'
      : event.importance === 'soft_block'
        ? 'bg-coral-300'
        : 'bg-ink-200';
  return (
    <div
      className={`group rounded-xl border border-ink-100 bg-white p-4 transition hover:border-ink-200 ${muted ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${accent}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-ink-900">{event.title}</h3>
            <span className="shrink-0 text-xs tabular-nums text-ink-500">
              {formatWhen(event.starts_at, event.all_day)}
            </span>
          </div>
          {event.location && <p className="mt-0.5 text-xs text-ink-500">📍 {event.location}</p>}
          {event.description && <p className="mt-1.5 text-sm text-ink-600">{event.description}</p>}
          <div className="mt-2 flex items-center justify-between">
            <Link
              href={`/event/${event.id}`}
              className="text-xs font-medium text-ink-500 hover:text-coral-600"
            >
              Edit →
            </Link>
            <EventStatusControls eventId={event.id} status={event.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
