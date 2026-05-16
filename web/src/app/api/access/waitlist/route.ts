import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/auth/access-policy";
import { getCollections } from "@/lib/mongo/collections";

function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = normalizeEmail(value);
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = parseEmail((body as { email?: unknown }).email);
  if (!email) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const now = new Date();
  const { waitlist } = await getCollections();
  const existing = await waitlist.findOne({ email });

  if (existing) {
    return NextResponse.json({ ok: true, alreadyJoined: true });
  }

  await waitlist.insertOne({
    email,
    source: "invite-preview",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, alreadyJoined: false });
}
