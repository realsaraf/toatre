import type { SerializedToat as TimelineToat } from "@/types";

export type { TimelineToat };

export interface DayGroup {
  key: string;
  title: string;
  subtitle: string;
  toats: TimelineToat[];
}

export interface ToatAction {
  label: string;
  href: string;
  external: boolean;
}

// ── Date utils ────────────────────────────────────────────────────────────────

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function relativeDayLabel(date: Date, now: Date): string {
  const today = startOfDay(now).getTime();
  const target = startOfDay(date).getTime();
  const diffDays = Math.round((target - today) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatSlotRange(start: string, end: string): string {
  return `${formatTime(new Date(start))} – ${formatTime(new Date(end))}`;
}

export function formatRailTime(date: Date): { time: string; period: string } {
  const text = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const [time, period] = text.split(" ");
  return { time, period: period ?? "" };
}

export function formatSecondaryDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatMinutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

// ── Toat field accessors ──────────────────────────────────────────────────────

export function toatTime(toat: TimelineToat): string | null {
  const t = toat.enrichments?.time;
  return t?.at ?? t?.startAt ?? t?.dueAt ?? null;
}

export function toatEndTime(toat: TimelineToat): string | null {
  return toat.enrichments?.time?.endAt ?? null;
}

export function toatLocation(toat: TimelineToat): string | null {
  return (
    toat.enrichments?.place?.address ??
    toat.enrichments?.place?.placeName ??
    toat.enrichments?.event?.address ??
    toat.enrichments?.event?.venueName ??
    null
  );
}

export function toatPeople(toat: TimelineToat): string[] {
  return toat.enrichments?.people ?? [];
}

export function mapHref(location: string | null): string | null {
  if (!location) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

// ── Sorting + grouping ────────────────────────────────────────────────────────

export function sortToats(left: TimelineToat, right: TimelineToat): number {
  const leftTime = toatTime(left);
  const rightTime = toatTime(right);
  if (leftTime && rightTime) {
    return new Date(leftTime).getTime() - new Date(rightTime).getTime();
  }
  if (leftTime) return -1;
  if (rightTime) return 1;
  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
}

export function buildDayGroups(toats: TimelineToat[], now: Date): DayGroup[] {
  const buckets = new Map<string, TimelineToat[]>();
  const today = startOfDay(now);

  for (const toat of toats) {
    const t = toatTime(toat);
    let key: string;
    if (!t) {
      key = "undated";
    } else {
      const dayStart = startOfDay(new Date(t));
      if (dayStart < today) {
        key = "overdue";
      } else {
        key = dayStart.toISOString();
      }
    }
    const existing = buckets.get(key) ?? [];
    existing.push(toat);
    buckets.set(key, existing);
  }

  return Array.from(buckets.entries())
    .sort(([leftKey], [rightKey]) => {
      if (leftKey === "undated") return 1;
      if (rightKey === "undated") return -1;
      if (leftKey === "overdue") return -1;
      if (rightKey === "overdue") return 1;
      return new Date(leftKey).getTime() - new Date(rightKey).getTime();
    })
    .map(([key, groupToats]) => {
      const sorted = [...groupToats].sort(sortToats);
      if (key === "overdue") {
        return { key, title: "Overdue", subtitle: "Past toats", toats: sorted };
      }
      if (key === "undated") {
        return { key, title: "Someday", subtitle: "No date yet", toats: sorted };
      }
      const date = new Date(key);
      return {
        key,
        title: relativeDayLabel(date, now),
        subtitle: formatSecondaryDate(date),
        toats: sorted,
      };
    });
}

// ── Action helpers ────────────────────────────────────────────────────────────

export function getPrimaryAction(toat: TimelineToat): ToatAction | null {
  const enrichments = toat.enrichments;
  const location = toatLocation(toat);
  const directions = mapHref(location);

  if (enrichments?.communication?.channel === "call" && enrichments.communication.phone) {
    return {
      label: "Call",
      href: `tel:${enrichments.communication.phone.replace(/\s+/g, "")}`,
      external: true,
    };
  }
  if (enrichments?.communication?.channel === "email" && enrichments.communication.email) {
    return { label: "Email", href: `mailto:${enrichments.communication.email}`, external: true };
  }
  if (enrichments?.communication?.joinUrl) {
    return { label: "Join", href: enrichments.communication.joinUrl, external: true };
  }
  if (enrichments?.event?.ticketUrl) {
    return { label: "Tickets", href: enrichments.event.ticketUrl, external: true };
  }
  if (directions) {
    return { label: "Directions", href: directions, external: true };
  }
  return null;
}

export function getCountdownLabel(toat: TimelineToat, now: Date): string {
  const start = toatTime(toat);
  if (!start) return "Any time";
  const diffMinutes = Math.round((new Date(start).getTime() - now.getTime()) / 60000);
  if (diffMinutes <= -60) return "Started earlier";
  if (diffMinutes < 0) return "Happening now";
  if (diffMinutes < 60) return `Starts in ${diffMinutes} min`;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (diffMinutes < 24 * 60) {
    return minutes > 0 ? `Starts in ${hours}h ${minutes}m` : `Starts in ${hours}h`;
  }
  return `Starts ${relativeDayLabel(new Date(start), now)} at ${formatTime(new Date(start))}`;
}

export function getToatDescription(toat: TimelineToat, now: Date): string {
  const pieces: string[] = [];
  const start = toatTime(toat);
  const end = toatEndTime(toat);
  const location = toatLocation(toat);
  const people = toatPeople(toat);

  if (start && end) {
    pieces.push(formatSlotRange(start, end));
  } else if (start) {
    pieces.push(`${relativeDayLabel(new Date(start), now)} at ${formatTime(new Date(start))}`);
  }
  if (location) pieces.push(location);
  if (people.length > 0) pieces.push(people.join(", "));
  if (pieces.length === 0 && toat.notes) pieces.push(toat.notes);
  return pieces[0] ?? "No extra details";
}

export function getUpNext(toats: TimelineToat[], now: Date): TimelineToat | null {
  const upcomingTimed = toats.filter((toat) => {
    const start = toatTime(toat);
    return start ? new Date(start).getTime() >= now.getTime() - 30 * 60000 : false;
  });
  if (upcomingTimed.length > 0) {
    return [...upcomingTimed].sort(sortToats)[0] ?? null;
  }
  return toats[0] ?? null;
}
