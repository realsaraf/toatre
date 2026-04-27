import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import {
  createDefaultUserSettings,
  normalizeNotificationPreferences,
} from "@/lib/settings/defaults";

function isTimeValue(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function serializeSettings(userDoc: Record<string, unknown>, settingsDoc: Record<string, unknown> | null) {
  const defaults = createDefaultUserSettings(
    typeof userDoc.timezone === "string" && userDoc.timezone ? userDoc.timezone : "UTC",
  );

  const timezone =
    settingsDoc && typeof settingsDoc.timezone === "string" && settingsDoc.timezone
      ? settingsDoc.timezone
      : defaults.timezone;

  const reminderPhone =
    settingsDoc && typeof settingsDoc.reminderPhone === "string" && settingsDoc.reminderPhone
      ? settingsDoc.reminderPhone
      : null;

  const pendingPhone =
    settingsDoc && typeof settingsDoc.pendingPhone === "string" && settingsDoc.pendingPhone
      ? settingsDoc.pendingPhone
      : null;

  const phoneVerifiedAt =
    settingsDoc && settingsDoc.phoneVerifiedAt instanceof Date
      ? settingsDoc.phoneVerifiedAt.toISOString()
      : settingsDoc && typeof settingsDoc.phoneVerifiedAt === "string"
        ? settingsDoc.phoneVerifiedAt
        : null;

  return {
    profile: {
      displayName: typeof userDoc.displayName === "string" ? userDoc.displayName : null,
      email: typeof userDoc.email === "string" ? userDoc.email : null,
      handle: typeof userDoc.handle === "string" ? userDoc.handle : null,
      photoUrl: typeof userDoc.photoUrl === "string" ? userDoc.photoUrl : null,
    },
    settings: {
      timezone,
      voiceRetention:
        settingsDoc && typeof settingsDoc.voiceRetention === "boolean"
          ? settingsDoc.voiceRetention
          : defaults.voiceRetention,
      smsEnabled:
        settingsDoc && typeof settingsDoc.smsEnabled === "boolean"
          ? settingsDoc.smsEnabled
          : defaults.smsEnabled,
      reminderPhone,
      pendingPhone,
      phoneVerified: Boolean(phoneVerifiedAt && reminderPhone),
      phoneVerifiedAt,
      workStart:
        settingsDoc && typeof settingsDoc.workStart === "string" && isTimeValue(settingsDoc.workStart)
          ? settingsDoc.workStart
          : defaults.workStart,
      workEnd:
        settingsDoc && typeof settingsDoc.workEnd === "string" && isTimeValue(settingsDoc.workEnd)
          ? settingsDoc.workEnd
          : defaults.workEnd,
      notificationPreferences: normalizeNotificationPreferences(settingsDoc?.notificationPreferences),
    },
  };
}

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  const { users, settings } = await getCollections();
  const userDoc = await users.findOne({ _id: new ObjectId(user.mongoId) });

  if (!userDoc) {
    return NextResponse.json({ error: "Account profile not found." }, { status: 404 });
  }

  const settingsDoc = await settings.findOne({ userId: user.mongoId });
  return NextResponse.json(serializeSettings(userDoc, settingsDoc));
}

export async function PATCH(request: NextRequest) {
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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const { users, settings } = await getCollections();
  const userDoc = await users.findOne({ _id: new ObjectId(user.mongoId) });

  if (!userDoc) {
    return NextResponse.json({ error: "Account profile not found." }, { status: 404 });
  }

  const currentSettings = await settings.findOne({ userId: user.mongoId });
  const current = serializeSettings(userDoc, currentSettings).settings;

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if ("timezone" in payload) {
    const timezone = typeof payload.timezone === "string" ? payload.timezone.trim() : "";
    if (!timezone) {
      return NextResponse.json({ error: "Timezone is required." }, { status: 400 });
    }

    updates.timezone = timezone;
  }

  if ("voiceRetention" in payload) {
    if (typeof payload.voiceRetention !== "boolean") {
      return NextResponse.json({ error: "Voice retention must be true or false." }, { status: 400 });
    }

    updates.voiceRetention = payload.voiceRetention;
  }

  if ("workStart" in payload) {
    if (typeof payload.workStart !== "string" || !isTimeValue(payload.workStart)) {
      return NextResponse.json({ error: "Work start must use HH:MM format." }, { status: 400 });
    }

    updates.workStart = payload.workStart;
  }

  if ("workEnd" in payload) {
    if (typeof payload.workEnd !== "string" || !isTimeValue(payload.workEnd)) {
      return NextResponse.json({ error: "Work end must use HH:MM format." }, { status: 400 });
    }

    updates.workEnd = payload.workEnd;
  }

  if ("smsEnabled" in payload) {
    if (typeof payload.smsEnabled !== "boolean") {
      return NextResponse.json({ error: "SMS setting must be true or false." }, { status: 400 });
    }

    if (payload.smsEnabled && !current.reminderPhone) {
      return NextResponse.json({ error: "Verify a phone number before enabling SMS Pings." }, { status: 400 });
    }

    updates.smsEnabled = payload.smsEnabled;
  }

  if ("notificationPreferences" in payload) {
    updates.notificationPreferences = normalizeNotificationPreferences(payload.notificationPreferences);
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "No settings changes provided." }, { status: 400 });
  }

  const defaults = createDefaultUserSettings(
    typeof userDoc.timezone === "string" && userDoc.timezone ? userDoc.timezone : "UTC",
  );

  const insertDefaults = Object.fromEntries(
    Object.entries(defaults).filter(([key]) => !(key in updates)),
  );

  await settings.updateOne(
    { userId: user.mongoId },
    {
      $set: updates,
      $setOnInsert: {
        userId: user.mongoId,
        ...insertDefaults,
      },
    },
    { upsert: true },
  );

  if (typeof updates.timezone === "string") {
    await users.updateOne(
      { _id: new ObjectId(user.mongoId) },
      { $set: { timezone: updates.timezone, updatedAt: new Date() } },
    );
  }

  const updatedUserDoc = await users.findOne({ _id: new ObjectId(user.mongoId) });
  const updatedSettings = await settings.findOne({ userId: user.mongoId });

  if (!updatedUserDoc) {
    return NextResponse.json({ error: "Account profile not found." }, { status: 404 });
  }

  return NextResponse.json(serializeSettings(updatedUserDoc, updatedSettings));
}
