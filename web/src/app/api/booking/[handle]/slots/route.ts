import { NextRequest, NextResponse } from "next/server";
import { getCollections } from "@/lib/mongo/collections";
import { ObjectId } from "mongodb";

interface SlotInfo {
  start: string;   // ISO 8601
  end: string;     // ISO 8601
  blocked: boolean;
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
  const [startH, startM] = windowStart.split(":").map(Number);
  const [endH, endM] = windowEnd.split(":").map(Number);

  // Build the window using the user's timezone via Intl
  const dayStr = date.toLocaleDateString("en-CA", { timeZone: timezone }); // "YYYY-MM-DD"
  const windowStartMs = new Date(`${dayStr}T${windowStart}:00`).getTime();
  const windowEndMs = new Date(`${dayStr}T${windowEnd}:00`).getTime();

  // Fallback: if timezone parsing fails just use date in UTC
  if (Number.isNaN(windowStartMs) || Number.isNaN(windowEndMs)) {
    return [];
  }

  const step = (slotLength + bufferMinutes) * 60000;
  const slotMs = slotLength * 60000;
  const slots: Array<{ start: Date; end: Date }> = [];

  for (let t = windowStartMs; t + slotMs <= windowEndMs; t += step) {
    slots.push({ start: new Date(t), end: new Date(t + slotMs) });
  }

  void startH; void startM; void endH; void endM; // consumed via string
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

  const { users, bookingSettings, toats } = await getCollections();

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

  const timezone = (typeof bsDoc.timezone === "string" && bsDoc.timezone) || "UTC";
  const slotLength = bsDoc.slotLength === 60 ? 60 : 30;
  const bufferMinutes = typeof bsDoc.bufferMinutes === "number" ? bsDoc.bufferMinutes : 0;
  const advanceNoticeMs = ((typeof bsDoc.advanceNoticeMinutes === "number" ? bsDoc.advanceNoticeMinutes : 60)) * 60000;
  const maxDaysAhead = typeof bsDoc.maxDaysAhead === "number" ? bsDoc.maxDaysAhead : 14;
  const windowDays: number[] = Array.isArray(bsDoc.windowDays) ? (bsDoc.windowDays as number[]) : [1, 2, 3, 4, 5];

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
  const existingRequests = await (await getCollections()).bookingRequests.find({
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
    return blockedIntervals.some(({ start, end }) => ss < end && se > start);
  }

  const slots: SlotInfo[] = futureSlots.map((s) => ({
    start: s.start.toISOString(),
    end: s.end.toISOString(),
    blocked: isBlocked(s),
  }));

  return NextResponse.json({ slots, host: serializeHost(userDoc) });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeHost(userDoc: any) {
  return {
    displayName: userDoc.displayName ?? null,
    handle: userDoc.handle ?? null,
    photoUrl: userDoc.photoUrl ?? null,
  };
}
