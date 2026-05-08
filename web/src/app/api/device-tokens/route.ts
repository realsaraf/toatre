import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";

const DeviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

const DeviceTokenDeleteSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = DeviceTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid device token payload.", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { deviceTokens } = await getCollections();
  const now = new Date();

  await deviceTokens.updateOne(
    { token: parsed.data.token },
    {
      $set: {
        userId: user.mongoId,
        platform: parsed.data.platform,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = DeviceTokenDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid device token payload.", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { deviceTokens } = await getCollections();
  await deviceTokens.deleteOne({ userId: user.mongoId, token: parsed.data.token });

  return NextResponse.json({ ok: true });
}