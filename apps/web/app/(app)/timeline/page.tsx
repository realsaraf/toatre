import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import type { EventRow } from '@/lib/types';
import TimelineList from './timeline-list';

export const metadata = { title: 'Timeline · Plotto' };
export const dynamic = 'force-dynamic';

export default async function TimelinePage() {
  const supabase = await supabaseServer();
  const { data: events, error } = await supabase
    .from('events')
    .select(
      'id, title, description, starts_at, ends_at, location, all_day, importance, reminder_strategy, confidence, status',
    )
    .in('status', ['active', 'snoozed'])
    .order('starts_at', { ascending: true })
    .limit(200)
    .returns<EventRow[]>();

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        Could not load timeline: {error.message}
      </div>
    );
  }

  const all = events ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your timeline</h1>
          <p className="mt-1 text-sm text-ink-500">
            {all.length} upcoming — ordered by what matters next.
          </p>
        </div>
        <Link
          href="/capture"
          className="rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-coral-600"
        >
          + New capture
        </Link>
      </div>

      {all.length === 0 ? <EmptyState /> : <TimelineList events={all} />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white/60 p-10 text-center">
      <div className="mx-auto mb-4 h-1.5 w-8 rounded-full bg-coral-500" />
      <h2 className="text-lg font-semibold text-ink-900">Nothing plotted yet</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">
        Paste an email, describe an appointment, or drop any text — Plotto
        will pull out the details.
      </p>
      <Link
        href="/capture"
        className="mt-5 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-coral-600"
      >
        Make your first capture
      </Link>
    </div>
  );
}
