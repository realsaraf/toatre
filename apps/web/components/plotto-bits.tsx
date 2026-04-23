'use client';

import Link from 'next/link';
import type { MeetingLink, PersonPill, PhoneNumber } from '@/lib/types';

const PILL_TONES: Record<string, string> = {
  coral: 'bg-coral-100 text-coral-800 border-coral-200 hover:bg-coral-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
  sky: 'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200',
  violet: 'bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200',
  rose: 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200',
  teal: 'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
};

export function PersonPills({
  people,
  linkable = true,
}: {
  people: PersonPill[] | null | undefined;
  linkable?: boolean;
}) {
  if (!people || people.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {people.map((p) => {
        const className = `inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition ${
          PILL_TONES[p.color] ?? PILL_TONES.coral
        }`;
        if (!linkable) {
          return (
            <span key={p.id} className={className}>
              {p.name}
            </span>
          );
        }
        return (
          <Link
            key={p.id}
            href={`/timeline?person=${p.id}`}
            className={className}
            onClick={(e) => e.stopPropagation()}
          >
            {p.name}
          </Link>
        );
      })}
    </div>
  );
}

function linkLabel(link: MeetingLink): string {
  if (link.label) return link.label;
  switch (link.type) {
    case 'zoom':
      return 'Join Zoom';
    case 'meet':
      return 'Join Meet';
    case 'teams':
      return 'Join Teams';
    case 'webex':
      return 'Join Webex';
    case 'phone':
      return 'Dial in';
    default:
      return 'Open link';
  }
}

export function ActionLinks({
  meetingLinks,
  phoneNumbers,
}: {
  meetingLinks: MeetingLink[] | null | undefined;
  phoneNumbers: PhoneNumber[] | null | undefined;
}) {
  const hasMeet = meetingLinks && meetingLinks.length > 0;
  const hasPhone = phoneNumbers && phoneNumbers.length > 0;
  if (!hasMeet && !hasPhone) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {hasMeet &&
        meetingLinks!.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-ink-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-ink-800"
            onClick={(e) => e.stopPropagation()}
          >
            <span aria-hidden>↗</span> {linkLabel(link)}
          </a>
        ))}
      {hasPhone &&
        phoneNumbers!.map((p) => (
          <a
            key={p.number}
            href={`tel:${p.number.replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-900 hover:border-ink-300"
            onClick={(e) => e.stopPropagation()}
          >
            <span aria-hidden>📞</span> {p.label ?? p.number}
          </a>
        ))}
    </div>
  );
}
