import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Maps not configured" }, { status: 503 });
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${apiKey}&types=geocode|establishment`;
  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ predictions: [] });
  }
  const data = (await res.json()) as { predictions?: unknown[] };
  return NextResponse.json({ predictions: data.predictions ?? [] });
}
