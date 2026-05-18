import { getToatVisual } from "@/components/toat-visual";
import type { ToatDetail, ActionConfig } from "./_types";

export function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatRelativeChip(toat: ToatDetail, now: Date) {
  const t = toatTime(toat);
  if (!t) return null;

  const start = new Date(t);
  const endStr = toatEndTime(toat);
  const end = endStr ? new Date(endStr) : null;
  const diffMinutes = Math.round((start.getTime() - now.getTime()) / 60000);
  const diffDays = Math.floor(
    (new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86400000,
  );

  if (end && now >= start && now <= end) return { text: "Happening now", style: "solid" as const };
  if (diffMinutes > 0 && diffMinutes <= 90) return { text: `Starting in ${diffMinutes} min`, style: "solid" as const };
  if (diffDays === 0) return { text: `Today, ${formatTime(start)}`, style: "soft" as const };
  if (diffDays === 1) return { text: `Tomorrow, ${formatTime(start)}`, style: "soft" as const };
  if (diffDays > 1 && diffDays <= 7) return { text: `In ${diffDays} days`, style: "outline" as const };
  return { text: formatShortDate(start), style: "outline" as const };
}

export function mapHref(location: string | null) {
  if (!location) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function toatTime(toat: ToatDetail): string | null {
  const t = toat.enrichments?.time;
  return t?.at ?? t?.startAt ?? t?.dueAt ?? null;
}

export function toatEndTime(toat: ToatDetail): string | null {
  return toat.enrichments?.time?.endAt ?? null;
}

export function toatLocation(toat: ToatDetail): string | null {
  return (
    toat.enrichments?.place?.address ??
    toat.enrichments?.place?.placeName ??
    toat.enrichments?.event?.address ??
    toat.enrichments?.event?.venueName ??
    null
  );
}

export function toatPeople(toat: ToatDetail): string[] {
  return toat.enrichments?.people ?? [];
}

export function getVisual(toat: ToatDetail) {
  return getToatVisual(toat.title, toat.enrichments ?? undefined);
}

export function getPrimaryAction(toat: ToatDetail): ActionConfig {
  const e = toat.enrichments;
  const loc = toatLocation(toat);
  const directions = mapHref(loc);

  if (e?.communication?.joinUrl) return { label: "Join now", href: e.communication.joinUrl, external: true };
  if (e?.communication?.channel === "call" && e.communication.phone)
    return { label: "Call", href: `tel:${e.communication.phone.replace(/\s+/g, "")}`, external: true };
  if (e?.event?.ticketUrl) return { label: "View tickets", href: e.event.ticketUrl, external: true };
  if (e?.communication?.channel === "email" && e.communication.email)
    return { label: "Email", href: `mailto:${e.communication.email}`, external: true };
  if (e?.communication?.phone)
    return { label: "Call", href: `tel:${e.communication.phone.replace(/\s+/g, "")}`, external: true };
  if (directions) return { label: "Directions", href: directions, external: true };
  return { label: "Open details", href: `/toats/${toat.id}`, external: false };
}

export function parseAgenda(notes: string | null): string[] {
  if (!notes) return [];
  return notes
    .split(/\r?\n|•|\u2022|-/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function getAgendaLines(toat: ToatDetail): string[] {
  return parseAgenda(toat.notes);
}

export function getChecklistItems(toat: ToatDetail): Array<{ id: string; text: string; done: boolean }> {
  return toat.enrichments?.action?.checklist ?? [];
}

export function formatReminderOffset(minutes: number): string {
  if (minutes < 60) return `${minutes} min before`;
  if (minutes === 60) return "1 hour before";
  if (minutes < 1440) return `${Math.round(minutes / 60)} hours before`;
  if (minutes === 1440) return "1 day before";
  return `${Math.round(minutes / 1440)} days before`;
}

export function buildReminderLines(toat: ToatDetail): Array<{ title: string; subtitle: string }> {
  const t = toatTime(toat);
  if (!t) return [];
  const start = new Date(t);
  const tenMinutesBefore = new Date(start.getTime() - 10 * 60000);
  const lines: Array<{ title: string; subtitle: string }> = [
    { title: `Leave by ${formatTime(tenMinutesBefore)}`, subtitle: "10 minutes before" },
  ];
  const stored = toat.enrichments?.time?.reminderOffset;
  if (stored && stored !== 10) {
    const at = new Date(start.getTime() - stored * 60000);
    lines.push({ title: `Ping at ${formatTime(at)}`, subtitle: formatReminderOffset(stored) });
  }
  return lines;
}

export function qrDigits(id: string): string {
  return id.replace(/[^0-9]/g, "").slice(0, 12).padEnd(12, "0");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function labelForPatch(body: Record<string, unknown>): string {
  if (body.status === "done") return "Marked done.";
  if (body.datetime) return "Time updated.";
  return "Saved.";
}
