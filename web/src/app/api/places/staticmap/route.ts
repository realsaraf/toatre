import { NextRequest, NextResponse } from "next/server";

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
  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
