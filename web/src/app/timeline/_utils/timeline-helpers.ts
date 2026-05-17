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

export function getWeekRangeLabel(date: Date): string {
  const start = startOfDay(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });

  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`;
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

// ── Timeline range ────────────────────────────────────────────────────────────

export type TimelineRange =
  | { kind: "next7" }
  | { kind: "next30" }
  | { kind: "next3months" }
  | { kind: "day"; dateKey: string };

export interface MomentGroup {
  key: string;
  title: string;
  date?: string;
  icon?: string;
  color: string;
  toats: TimelineToat[];
}

export interface RangeOption {
  key: string;
  label: string;
  meta: string;
  value: TimelineRange;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function rangeEquals(left: TimelineRange, right: TimelineRange): boolean {
  return left.kind === right.kind && (left.kind !== "day" || (right.kind === "day" && left.dateKey === right.dateKey));
}

export function isToatInRange(toat: TimelineToat, range: TimelineRange, now: Date): boolean {
  const value = toatTime(toat);
  if (!value) return range.kind !== "day";
  const date = new Date(value);
  const start = startOfDay(now);
  const end = new Date(start);
  if (range.kind === "day") return dateKey(date) === range.dateKey;
  if (range.kind === "next7") end.setDate(start.getDate() + 7);
  if (range.kind === "next30") end.setDate(start.getDate() + 30);
  if (range.kind === "next3months") end.setMonth(start.getMonth() + 3);
  return date >= start && date < end;
}

export function getPreferredRange(toats: TimelineToat[], now: Date): TimelineRange {
  const dk = dateKey(now);
  const todayCount = toats.filter((toat) => {
    const value = toatTime(toat);
    return value ? dateKey(new Date(value)) === dk : false;
  }).length;
  return todayCount < 3 ? { kind: "next7" } : { kind: "day", dateKey: dk };
}

export function buildRangeOptions(now: Date): RangeOption[] {
  const start = startOfDay(now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: `day-${dateKey(date)}`,
      label: index === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      meta: date.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
      value: { kind: "day", dateKey: dateKey(date) } as TimelineRange,
    };
  });
  return [
    { key: "next7", label: "Next 7 days", meta: "Today through the week", value: { kind: "next7" } },
    { key: "next30", label: "Next 30 days", meta: "Everything coming up", value: { kind: "next30" } },
    { key: "next3months", label: "Next 3 months", meta: "Longer horizon", value: { kind: "next3months" } },
    ...days,
  ];
}

export function formatRangePillLabel(range: TimelineRange, options: RangeOption[]): string {
  if (range.kind === "day") {
    const date = new Date(`${range.dateKey}T12:00:00`);
    const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    return `${monthDay}, ${weekday}`;
  }
  return options.find((o) => o.value.kind === range.kind)?.label ?? "Next 7 days";
}

const TIME_SLOTS = [
  { slot: "morning", title: "MORNING", icon: "☼", color: "#C27A12", test: (h: number) => h < 12 },
  { slot: "afternoon", title: "AFTERNOON", icon: "☀", color: "#C27A12", test: (h: number) => h >= 12 && h < 18 },
  { slot: "evening", title: "EVENING", icon: "☾", color: "#6A35FF", test: (h: number) => h >= 18 },
] as const;

export function buildMomentGroups(toats: TimelineToat[], range: TimelineRange, now: Date): MomentGroup[] {
  const isMultiDay = range.kind !== "day";
  const todayK = dateKey(now);
  const tomorrowDate = new Date(startOfDay(now));
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowK = dateKey(tomorrowDate);
  const slotOf = (h: number) => TIME_SLOTS.find((s) => s.test(h)) ?? TIME_SLOTS[0];

  if (!isMultiDay) {
    const groups = TIME_SLOTS.map((s) => ({ key: s.slot, title: s.title, icon: s.icon, color: s.color, toats: [] as TimelineToat[] }));
    const someday: MomentGroup = { key: "someday", title: "SOMEDAY", icon: "✦", color: "#7B61FF", toats: [] };
    for (const toat of toats) {
      const t = toatTime(toat);
      if (!t) { someday.toats.push(toat); continue; }
      const g = groups.find((x) => x.key === slotOf(new Date(t).getHours()).slot)!;
      g.toats.push(toat);
    }
    return [...groups, someday].filter((g) => g.toats.length > 0).map(({ key, title, icon, color, toats: ts }) => ({ key, title, icon, color, toats: ts }));
  }

  const byKey = new Map<string, MomentGroup>();
  const someday: MomentGroup = { key: "someday", title: "SOMEDAY", icon: "✦", color: "#7B61FF", toats: [] };

  for (const toat of toats) {
    const t = toatTime(toat);
    if (!t) { someday.toats.push(toat); continue; }
    const date = new Date(t);
    const dk = dateKey(date);
    if (!byKey.has(dk)) {
      let dateLabel: string;
      if (dk === todayK) dateLabel = "Today";
      else if (dk === tomorrowK) dateLabel = "Tomorrow";
      else dateLabel = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      byKey.set(dk, { key: dk, title: dateLabel, color: "#6A35FF", toats: [] });
    }
    byKey.get(dk)!.toats.push(toat);
  }

  const sorted = [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, g]) => g);
  if (someday.toats.length > 0) sorted.push(someday);
  return sorted;
}

