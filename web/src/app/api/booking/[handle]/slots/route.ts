import { NextRequest, NextResponse } from "next/server";
import { getCollections } from "@/lib/mongo/collections";
import { ObjectId } from "mongodb";

interface SlotInfo {
  start: string;   // ISO 8601
  end: string;     // ISO 8601
  blocked: boolean;
}

function formatDateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function timezoneOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return asUtc - date.getTime();
}

function makeDateInTimezone(dateKey: string, time: string, timezone: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  return new Date(utcGuess.getTime() - timezoneOffsetMs(utcGuess, timezone));
}

function isBookingSlotLength(input: unknown): input is 15 | 30 | 45 | 60 {
  return input === 15 || input === 30 || input === 45 || input === 60;
}

/** Generate all candidate slots for a day given booking settings. */
function generateDaySlots(
  date: Date,
  windowStart: string,  // "HH:mm"
  windowEnd: string,
  slotLength: number,   // minutes
  bufferMinutes: number,
  timezone: string,
): Array<{ start: Date; end: Date }> {
  const dayStr = formatDateKey(date, timezone);
  const windowStartMs = makeDateInTimezone(dayStr, windowStart, timezone).getTime();
  const windowEndMs = makeDateInTimezone(dayStr, windowEnd, timezone).getTime();

  const step = (slotLength + bufferMinutes) * 60000;
  const slotMs = slotLength * 60000;
  const slots: Array<{ start: Date; end: Date }> = [];

  for (let t = windowStartMs; t + slotMs <= windowEndMs; t += step) {
    slots.push({ start: new Date(t), end: new Date(t + slotMs) });
  }
  return slots;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const { searchParams } = new URL(request.url);

  // ?from=YYYY-MM-DD&to=YYYY-MM-DD  (defaults to today + 14 days)
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const { users, bookingSettings, toats, settings, bookingRequests } = await getCollections();

  // Resolve handle → user
  const cleanHandle = handle.replace(/^@/, '').toLowerCase();
  const userDoc = await users.findOne({ handle: cleanHandle });
  if (!userDoc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Load booking settings
  const bsDoc = await bookingSettings.findOne({ userId: userDoc._id.toString() });
  if (!bsDoc || bsDoc.enabled !== true) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const settingsDoc = await settings.findOne({ userId: userDoc._id.toString() });
  const timezone = (typeof bsDoc.timezone === "string" && bsDoc.timezone) || "UTC";
  const slotLength = isBookingSlotLength(bsDoc.slotLength) ? bsDoc.slotLength : 30;
  const bufferMinutes = typeof bsDoc.bufferMinutes === "number" ? bsDoc.bufferMinutes : 0;
  const advanceNoticeMs = ((typeof bsDoc.advanceNoticeMinutes === "number" ? bsDoc.advanceNoticeMinutes : 60)) * 60000;
  const maxDaysAhead = typeof bsDoc.maxDaysAhead === "number" ? bsDoc.maxDaysAhead : 14;
  const windowDays: number[] = Array.isArray(bsDoc.windowDays) ? (bsDoc.windowDays as number[]) : [1, 2, 3, 4, 5];
  const disableDuringOfficeHours = bsDoc.disableDuringOfficeHours === true;
  const officeStart =
    typeof settingsDoc?.workStart === "string" ? settingsDoc.workStart : null;
  const officeEnd = typeof settingsDoc?.workEnd === "string" ? settingsDoc.workEnd : null;

  const now = new Date();
  const fromDate = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const toDate = toParam ? new Date(toParam) : new Date(fromDate.getTime() + maxDaysAhead * 86400000);

  // Clamp to maxDaysAhead
  const maxEnd = new Date(now.getTime() + maxDaysAhead * 86400000);
  const effectiveEnd = toDate > maxEnd ? maxEnd : toDate;

  // Collect all candidate slots across the date range
  const allSlots: Array<{ start: Date; end: Date }> = [];
  const d = new Date(fromDate);
  while (d < effectiveEnd) {
    const dayOfWeek = d.getDay(); // 0=Sun
    if (windowDays.includes(dayOfWeek)) {
      const daySlots = generateDaySlots(
        d,
        typeof bsDoc.windowStart === "string" ? bsDoc.windowStart : "09:00",
        typeof bsDoc.windowEnd === "string" ? bsDoc.windowEnd : "17:00",
        slotLength,
        bufferMinutes,
        timezone,
      );
      allSlots.push(...daySlots);
    }
    d.setDate(d.getDate() + 1);
  }

  // Filter out slots in the past or within advanceNotice window
  const earliest = now.getTime() + advanceNoticeMs;
  const futureSlots = allSlots.filter((s) => s.start.getTime() >= earliest);

  if (futureSlots.length === 0) {
    return NextResponse.json({ slots: [], host: serializeHost(userDoc) });
  }

  const windowStart = futureSlots[0].start;
  const windowEnd = futureSlots[futureSlots.length - 1].end;

  // Fetch owner's open toats that overlap the date window (no content returned)
  const ownerId = new ObjectId(userDoc._id);
  const overlappingToats = await toats.find({
    ownerId,
    $nor: [
      { state: { $in: ["done", "archived"] } },
      { status: { $in: ["cancelled", "done"] } },
    ],
    $or: [
      {
        "enrichments.time.at": {
          $gte: windowStart.toISOString(),
          $lt: windowEnd.toISOString(),
        },
      },
      {
        "enrichments.time.startAt": {
          $gte: windowStart.toISOString(),
          $lt: windowEnd.toISOString(),
        },
      },
    ],
  }).project({ "enrichments.time": 1 }).toArray();

  // Build a set of blocked [startMs, endMs) intervals from existing toats
  const blockedIntervals: Array<{ start: number; end: number }> = [];
  for (const t of overlappingToats) {
    const timeAt: string | null =
      t.enrichments?.time?.at ?? t.enrichments?.time?.startAt ?? null;
    if (!timeAt) continue;
    const startMs = new Date(timeAt).getTime();
    const durationMs = ((t.enrichments?.time?.duration as number | undefined) ?? 60) * 60000;
    blockedIntervals.push({ start: startMs, end: startMs + durationMs });
  }

  // Also block already-booked pending/accepted request slots
  const existingRequests = await bookingRequests.find({
    ownerId,
    state: { $ne: "denied" },
    slotStart: { $gte: windowStart, $lt: windowEnd },
  }).project({ slotStart: 1, slotEnd: 1 }).toArray();

  for (const req of existingRequests) {
    if (req.slotStart && req.slotEnd) {
      blockedIntervals.push({
        start: new Date(req.slotStart as Date).getTime(),
        end: new Date(req.slotEnd as Date).getTime(),
      });
    }
  }

  function isBlocked(slot: { start: Date; end: Date }): boolean {
    const ss = slot.start.getTime();
    const se = slot.end.getTime();
    if (disableDuringOfficeHours && officeStart && officeEnd) {
      const dayKey = formatDateKey(slot.start, timezone);
      const officeWindowStart = makeDateInTimezone(dayKey, officeStart, timezone).getTime();
      const officeWindowEnd = makeDateInTimezone(dayKey, officeEnd, timezone).getTime();
      if (ss < officeWindowEnd && se > officeWindowStart) {
        return true;
      }
    }

    return blockedIntervals.some(({ start, end }) => ss < end && se > start);
  }

  const slots: SlotInfo[] = futureSlots.map((s) => ({
    start: s.start.toISOString(),
    end: s.end.toISOString(),
    blocked: isBlocked(s),
  }));

  return NextResponse.json({
    slots,
    host: serializeHost(userDoc),
    booking: {
      timezone,
      greetingMessage:
        typeof bsDoc.greetingMessage === "string" ? bsDoc.greetingMessage : "",
      pageTitle:
        typeof bsDoc.pageTitle === "string" && bsDoc.pageTitle.trim().length > 0
          ? bsDoc.pageTitle
          : "Let's find a time that works for you.",
      metaDescription:
        typeof bsDoc.metaDescription === "string" && bsDoc.metaDescription.trim().length > 0
          ? bsDoc.metaDescription
          : "Book a 1-on-1 session with me. Simple, quick and hassle-free.",
      requireReason: bsDoc.requireReason === true,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeHost(userDoc: any) {
  return {
    displayName: userDoc.displayName ?? null,
    handle: userDoc.handle ?? null,
    photoUrl: userDoc.photoUrl ?? null,
    socialLinks: Array.isArray(userDoc.socialLinks)
      ? userDoc.socialLinks.filter((link: unknown) => {
          if (!link || typeof link !== "object") return false;
          const candidate = link as { type?: unknown; url?: unknown };
          return (
            (candidate.type === "x" ||
              candidate.type === "linkedin" ||
              candidate.type === "instagram" ||
              candidate.type === "youtube") &&
            typeof candidate.url === "string" &&
            candidate.url.trim().length > 0
          );
        })
      : [],
  };
}
