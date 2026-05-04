import { NextRequest, NextResponse } from "next/server";

// In-memory cache keyed by location string. Survives across requests within the
// same Node.js process. Bounded to 500 entries (≈ 500 × ~30 KB ≈ 15 MB max).
// Cache is by location string, not toat ID — no need to invalidate on delete/done.
const MAX_ENTRIES = 500;
const mapCache = new Map<string, ArrayBuffer>();

function cacheSet(key: string, value: ArrayBuffer) {
  if (mapCache.size >= MAX_ENTRIES) {
    // Evict the oldest entry (Map preserves insertion order)
    const firstKey = mapCache.keys().next().value;
    if (firstKey !== undefined) mapCache.delete(firstKey);
  }
  mapCache.set(key, value);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ error: "Missing location" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Maps not configured" }, { status: 503 });
  }

  const encoded = encodeURIComponent(q);

  // Serve from in-memory cache if available
  const cached = mapCache.get(q);
  if (cached) {
    return new NextResponse(cached, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000",
        "X-Cache": "HIT",
      },
    });
  }

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
  cacheSet(q, imageBuffer);

  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000",
      "X-Cache": "MISS",
    },
  });
}
