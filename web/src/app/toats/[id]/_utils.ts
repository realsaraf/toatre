import type { Enrichments } from "@/types";
import {
  BulbGlyph,
  CartGlyph,
  EnvelopeGlyph,
  MessageGlyph,
  PhoneGlyph,
  TicketGlyph,
  VideoGlyph,
} from "@/components/mobile-ui";
import type { ToatDetail, DetailVisual, ActionConfig } from "./_types";

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

function _visualByTitleKeyword(toat: ToatDetail): DetailVisual | null {
  const t = toat.title.toLowerCase();
  const has = (...kws: string[]) => kws.some((k) => t.includes(k));
  if (has("grocery", "groceries", "supermarket", "market", "shopping"))
    return { kicker: "Errand", gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)", soft: "rgba(139,92,246,0.12)", accent: "#6D28D9", Icon: CartGlyph };
  if (has("call", "phone", "ring", "dial"))
    return { kicker: "Call", gradient: "linear-gradient(135deg, #F43F5E, #EC4899)", soft: "rgba(236,72,153,0.12)", accent: "#DB2777", Icon: PhoneGlyph };
  if (has("email", "send", "message", "text", "follow up", "follow-up"))
    return { kicker: "Message", gradient: "linear-gradient(135deg, #06B6D4, #0891B2)", soft: "rgba(6,182,212,0.12)", accent: "#0891B2", Icon: MessageGlyph };
  if (has("meeting", "standup", "sync", "zoom", "meet"))
    return { kicker: "Meeting", gradient: "linear-gradient(135deg, #3B82F6, #2563EB)", soft: "rgba(59,130,246,0.12)", accent: "#2563EB", Icon: VideoGlyph };
  if (has("idea", "thought", "note", "remember"))
    return { kicker: "Idea", gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)", soft: "rgba(245,158,11,0.12)", accent: "#D97706", Icon: BulbGlyph };
  if (has("buy", "pick up", "pickup", "get ", "order", "purchase"))
    return { kicker: "Errand", gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)", soft: "rgba(139,92,246,0.12)", accent: "#6D28D9", Icon: CartGlyph };
  return null;
}

export function getVisual(toat: ToatDetail): DetailVisual {
  const e = toat.enrichments;
  if (e?.communication?.channel === "call" || (e?.communication?.phone && !e?.communication?.joinUrl))
    return { kicker: "Call", gradient: "linear-gradient(135deg, #F43F5E, #EC4899)", soft: "rgba(236,72,153,0.12)", accent: "#DB2777", Icon: PhoneGlyph };
  if (e?.communication?.joinUrl)
    return { kicker: "Meeting", gradient: "linear-gradient(135deg, #3B82F6, #2563EB)", soft: "rgba(59,130,246,0.12)", accent: "#2563EB", Icon: VideoGlyph };
  if (e?.communication)
    return { kicker: "Message", gradient: "linear-gradient(135deg, #06B6D4, #0891B2)", soft: "rgba(6,182,212,0.12)", accent: "#0891B2", Icon: MessageGlyph };
  if (e?.event)
    return { kicker: "Event", gradient: "linear-gradient(135deg, #7C3AED, #5B3DF5)", soft: "rgba(124,58,237,0.12)", accent: "#6D28D9", Icon: TicketGlyph };
  if (e?.action?.type === "checklist")
    return { kicker: "Checklist", gradient: "linear-gradient(135deg, #22C55E, #16A34A)", soft: "rgba(34,197,94,0.12)", accent: "#16A34A", Icon: CartGlyph };
  if (e?.action?.type === "errand")
    return { kicker: "Errand", gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)", soft: "rgba(139,92,246,0.12)", accent: "#6D28D9", Icon: CartGlyph };
  if (e?.thought)
    return { kicker: "Idea", gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)", soft: "rgba(245,158,11,0.12)", accent: "#D97706", Icon: BulbGlyph };
  return _visualByTitleKeyword(toat) ?? { kicker: "Task", gradient: "linear-gradient(135deg, #F97316, #FB923C)", soft: "rgba(249,115,22,0.12)", accent: "#EA580C", Icon: EnvelopeGlyph };
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

export function buildReminderLines(toat: ToatDetail): Array<{ title: string; subtitle: string }> {
  const t = toatTime(toat);
  if (!t) return [];
  const start = new Date(t);
  const tenMinutesBefore = new Date(start.getTime() - 10 * 60000);
  const dayBefore = new Date(start.getTime() - 24 * 60 * 60000);
  return [
    { title: `Leave by ${formatTime(tenMinutesBefore)}`, subtitle: "10 minutes before" },
    { title: "Day before reminder", subtitle: `${formatShortDate(dayBefore)} at ${formatTime(dayBefore)}` },
  ];
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
