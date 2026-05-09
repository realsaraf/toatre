import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { disconnectZoom } from "@/lib/sync/zoom";

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  await disconnectZoom(user.mongoId);
  return NextResponse.json({ ok: true });
}
