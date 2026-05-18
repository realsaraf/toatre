import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollections } from "@/lib/mongo/collections";
import { migrateTemplateData, type Enrichments } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { acl, toats } = await getCollections();

  const share = await acl.findOne({ token });
  const toatId = share?.toatId instanceof ObjectId ? share.toatId : null;
  const toat = toatId ? await toats.findOne({ _id: toatId }) : null;

  if (!share || !toat) {
    return new NextResponse("Shared toat not found.", { status: 404 });
  }

  const enrichments: Enrichments = toat.enrichments ?? migrateTemplateData(toat);
  const title = typeof toat.title === "string" ? toat.title : "Untitled toat";
  const notes = typeof toat.notes === "string" && toat.notes ? toat.notes : "";

  const location =
    (typeof enrichments.place?.address === "string" && enrichments.place.address) ||
    (typeof enrichments.place?.placeName === "string" && enrichments.place.placeName) ||
    (typeof enrichments.event?.address === "string" && enrichments.event.address) ||
    (typeof enrichments.event?.venueName === "string" && enrichments.event.venueName) ||
    null;

  const startAt =
    enrichments.time?.at ?? enrichments.time?.startAt ?? enrichments.time?.dueAt;

  if (!startAt) {
    return new NextResponse("This toat has no scheduled time.", { status: 422 });
  }

  const start = new Date(startAt);
  const end = enrichments.time?.endAt
    ? new Date(enrichments.time.endAt)
    : new Date(start.getTime() + 60 * 60 * 1000); // default +1 h

  const reminderOffset =
    typeof enrichments.time?.reminderOffset === "number"
      ? enrichments.time.reminderOffset
      : 10; // default 10 min

  const uid = `${toat._id.toString()}@toatre.com`;
  const now = new Date();

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Toatre//Toatre//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(title)}`,
    ...(notes ? [`DESCRIPTION:${icsEscape(notes)}`] : []),
    ...(location ? [`LOCATION:${icsEscape(location)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${icsEscape(title)}`,
    `TRIGGER:-PT${reminderOffset}M`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const ics = lines.join("\r\n");
  const filename =
    title
      .slice(0, 40)
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || "toat";

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function icsDate(date: Date): string {
  // Format: 20260517T180000Z
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}
