import { NextRequest, NextResponse } from "next/server";
import { getMapTile, putMapTile } from "@/lib/spaces/map-tiles";

// L1: in-memory cache — avoids Spaces round-trip for hot locations.
// Bounded to 200 entries; evicts oldest on overflow.
const MAX_ENTRIES = 200;
const memCache = new Map<string, ArrayBuffer>();

function memSet(key: string, value: ArrayBuffer) {
  if (memCache.size >= MAX_ENTRIES) {
    const firstKey = memCache.keys().next().value;
    if (firstKey !== undefined) memCache.delete(firstKey);
  }
  memCache.set(key, value);
}

const CACHE_HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000",
} as const;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ error: "Missing location" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Maps not configured" }, { status: 503 });
  }

  // L1: in-memory
  const mem = memCache.get(q);
  if (mem) {
    return new NextResponse(mem, { headers: { ...CACHE_HEADERS, "X-Cache": "MEM" } });
  }

  // L2: DO Spaces
  const stored = await getMapTile(q);
  if (stored) {
    memSet(q, stored);
    return new NextResponse(stored, { headers: { ...CACHE_HEADERS, "X-Cache": "SPACES" } });
  }

  // L3: Google Maps Static API
  const encoded = encodeURIComponent(q);
  const url =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${encoded}` +
    `&zoom=15` +
    `&size=600x300` +
    `&scale=2` +
    `&markers=color:0x7C3AED%7C${encoded}` +
    `&style=feature:poi|visibility:off` +
    `&style=feature:transit|visibility:off` +
    `&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Map unavailable" }, { status: 502 });
  }

  const imageBuffer = await res.arrayBuffer();

  // Store in both caches (non-blocking for Spaces write)
  memSet(q, imageBuffer);
  putMapTile(q, imageBuffer).catch(() => {
    // Spaces write failure is non-fatal — tile will be re-fetched next time
  });

  return new NextResponse(imageBuffer, {
    headers: { ...CACHE_HEADERS, "X-Cache": "GOOGLE" },
  });
}

