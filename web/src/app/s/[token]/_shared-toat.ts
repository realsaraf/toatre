import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongo/collections";
import { TOAT_VISUAL, resolveVisualKey } from "@/components/toat-visual";
import { migrateTemplateData, type Enrichments } from "@/types";
import type { ToatAttachment, ToatLink } from "@/types/documents";

export interface SharedToatPageData {
  title: string;
  tier: string;
  notes: string | null;
  links: ToatLink[];
  attachments: ToatAttachment[];
  visualEmoji: string;
  visualLabel: string;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  mapsUrl: string | null;
  subtitle: string | null;
  people: string[];
}

export async function getSharedToatPageData(token: string): Promise<SharedToatPageData | null> {
  const { acl, toats } = await getCollections();

  const share = await acl.findOne({ token });
  const toatId = share?.toatId instanceof ObjectId ? share.toatId : null;
  const toat = toatId ? await toats.findOne({ _id: toatId }) : null;

  if (!share || !toat) return null;

  const enrichments: Enrichments = toat.enrichments ?? migrateTemplateData(toat);
  const title = typeof toat.title === "string" ? toat.title : "Untitled toat";
  const tier = typeof toat.tier === "string" ? toat.tier : "regular";
  const notes = typeof toat.notes === "string" && toat.notes ? toat.notes : null;
  const links: ToatLink[] = Array.isArray(toat.links) ? toat.links : [];
  const attachments: ToatAttachment[] = Array.isArray(toat.attachments) ? toat.attachments : [];

  const visualKey = resolveVisualKey(title, enrichments);
  const visual = TOAT_VISUAL[visualKey] ?? TOAT_VISUAL.task;

  const startDate = parseDate(
    enrichments.time?.at ?? enrichments.time?.startAt ?? enrichments.time?.dueAt,
  );
  const endDate = parseDate(enrichments.time?.endAt);
  const location =
    (typeof enrichments.place?.address === "string" && enrichments.place.address) ||
    (typeof enrichments.place?.placeName === "string" && enrichments.place.placeName) ||
    (typeof enrichments.event?.address === "string" && enrichments.event.address) ||
    (typeof enrichments.event?.venueName === "string" && enrichments.event.venueName) ||
    null;
  const mapsUrl = location ? `https://maps.google.com/?q=${encodeURIComponent(location)}` : null;
  const subtitle =
    (typeof enrichments.event?.venueName === "string" && enrichments.event.venueName) ||
    null;
  const people: string[] = Array.isArray(enrichments.people) ? enrichments.people : [];

  return {
    title,
    tier,
    notes,
    links,
    attachments,
    visualEmoji: visual.emoji,
    visualLabel: visual.label,
    startDate,
    endDate,
    location,
    mapsUrl,
    subtitle,
    people,
  };
}

export function buildShareDescription(sharedToat: SharedToatPageData): string {
  const notes = buildShareNotesExcerpt(sharedToat.notes, 160);
  const when = formatShareDateForMetadata(sharedToat.startDate, sharedToat.endDate);
  const detailParts = [when, sharedToat.location].filter(Boolean);

  if (notes) {
    return truncateText([notes, ...detailParts].join(" • "), 160);
  }

  const fallback = [...detailParts, "Open this shared toat in Toatre."].filter(Boolean).join(" • ");
  return truncateText(fallback || "Open this shared toat in Toatre.", 160);
}

export function buildShareNotesExcerpt(notes: string | null, maxLength: number): string | null {
  const plainText = plainTextFromMarkdown(notes);
  return plainText ? truncateText(plainText, maxLength) : null;
}

export function formatShareDateForMetadata(startDate: Date | null, endDate: Date | null): string | null {
  if (!startDate) return null;

  const date = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (!endDate) return `${date} at ${startTime}`;

  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${date} ${startTime}–${endTime}`;
  }

  const endDateText = endDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const endTime = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} ${startTime}–${endDateText} ${endTime}`;
}

export function getShareOpenGraphImage(token: string, sharedToat: SharedToatPageData): string {
  const imageAttachment = sharedToat.attachments.find(
    (attachment) => typeof attachment.mimeType === "string" && attachment.mimeType.startsWith("image/"),
  );

  if (imageAttachment?.id) {
    return `/api/share/${encodeURIComponent(token)}/attachments/${encodeURIComponent(imageAttachment.id)}`;
  }

  return `/s/${encodeURIComponent(token)}/opengraph-image`;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function plainTextFromMarkdown(value: string | null): string | null {
  if (!value) return null;

  const normalized = value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, " $1 ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, " $1 ")
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^\s*([-*+]|\d+\.)\s+/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r?\n+/g, " ");

  return compactWhitespace(normalized);
}

function compactWhitespace(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || null;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}