"use client";

export function HighlightedTranscript({ text }: { text: string }) {
  const timeRx = /\b(\d{1,2}(:\d{2})?\s?(am|pm)?|tomorrow|today|tonight|this (morning|afternoon|evening|weekend|week)|next \w+|may \d{1,2}|\d+\s?(min|hour|day|week)s?\b)/gi;
  const placeRx = /\b(zoom|google meet|teams|slack|las vegas|new york|nyc)/gi;
  const parts: React.ReactNode[] = [];
  const matches: { start: number; end: number; type: "time" | "place" }[] = [];
  let m;
  while ((m = timeRx.exec(text)) !== null) matches.push({ start: m.index, end: m.index + m[0].length, type: "time" });
  while ((m = placeRx.exec(text)) !== null) matches.push({ start: m.index, end: m.index + m[0].length, type: "place" });
  matches.sort((a, b) => a.start - b.start);
  let last = 0;
  for (const match of matches) {
    if (match.start < last) continue;
    if (match.start > last) parts.push(text.slice(last, match.start));
    parts.push(
      <span key={match.start} style={{ color: match.type === "time" ? "#7C3AED" : "#16A34A", fontWeight: 500 }}>
        {text.slice(match.start, match.end)}
      </span>,
    );
    last = match.end;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
