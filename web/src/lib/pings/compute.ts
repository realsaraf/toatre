import { ObjectId } from "mongodb";

import { getCollections } from "@/lib/mongo/collections";
import {
  createDefaultNotificationPreferences,
  normalizeNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/settings/defaults";

type GenericDoc = Record<string, unknown>;

interface ReminderMoment {
  key: string;
  dueAt: Date;
  title: string;
  subtitle: string;
}

function asRecord(value: unknown): GenericDoc | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as GenericDoc)
    : null;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string" || !value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function idString(value: unknown): string | null {
  if (value instanceof ObjectId) {
    return value.toHexString();
  }

  if (typeof value === "string" && value) {
    return value;
  }

  return null;
}

function toatTimeRecord(toat: GenericDoc): GenericDoc | null {
  return asRecord(asRecord(toat.enrichments)?.time);
}

function eventRecord(toat: GenericDoc): GenericDoc | null {
  return asRecord(asRecord(toat.enrichments)?.event);
}

function actionRecord(toat: GenericDoc): GenericDoc | null {
  return asRecord(asRecord(toat.enrichments)?.action);
}

function communicationRecord(toat: GenericDoc): GenericDoc | null {
  return asRecord(asRecord(toat.enrichments)?.communication);
}

function thoughtRecord(toat: GenericDoc): GenericDoc | null {
  return asRecord(asRecord(toat.enrichments)?.thought);
}

function toatPrimaryDateTime(toat: GenericDoc): Date | null {
  const time = toatTimeRecord(toat);
  return (
    parseDate(time?.at) ??
    parseDate(time?.startAt) ??
    parseDate(time?.dueAt) ??
    parseDate(toat.datetime)
  );
}

function toatReminderAt(toat: GenericDoc): Date | null {
  return parseDate(toatTimeRecord(toat)?.reminderAt);
}

function isOpenToat(toat: GenericDoc): boolean {
  const state = typeof toat.state === "string" ? toat.state : null;
  const status = typeof toat.status === "string" ? toat.status : null;

  if (state) {
    return state === "open";
  }

  if (status) {
    return status === "active" || status === "open";
  }

  return true;
}

function notificationKindForToat(toat: GenericDoc): string {
  if (
    typeof toat.kind === "string" &&
    ["task", "event", "meeting", "idea", "errand", "deadline"].includes(
      toat.kind,
    )
  ) {
    return toat.kind;
  }

  const communication = communicationRecord(toat);
  if (typeof communication?.joinUrl === "string" && communication.joinUrl) {
    return "meeting";
  }

  if (eventRecord(toat)) {
    return "event";
  }

  if (actionRecord(toat)?.type === "errand") {
    return "errand";
  }

  if (thoughtRecord(toat)) {
    return "idea";
  }

  const time = toatTimeRecord(toat);
  if (
    typeof time?.dueAt === "string" &&
    !time.at &&
    !time.startAt &&
    !toat.datetime
  ) {
    return "deadline";
  }

  const title = typeof toat.title === "string" ? toat.title.toLowerCase() : "";
  const hasAny = (terms: string[]) => terms.some((term) => title.includes(term));

  if (hasAny(["deadline", "due", "submit", "submission"])) {
    return "deadline";
  }
  if (hasAny(["meeting", "standup", "sync", "zoom", "meet "])) {
    return "meeting";
  }
  if (
    hasAny([
      "party",
      "wedding",
      "concert",
      "ceremony",
      "festival",
      "birthday",
      "graduation",
      "game",
      "match",
      "tournament",
    ])
  ) {
    return "event";
  }
  if (
    hasAny([
      "grocery",
      "groceries",
      "supermarket",
      "market",
      "shopping",
      "buy ",
      "pick up",
      "pickup",
      "drop off",
      "drive to",
      "errand",
    ])
  ) {
    return "errand";
  }
  if (hasAny(["idea", "thought", "note", "remember"])) {
    return "idea";
  }

  return "task";
}

function buildReminderMoments(
  toat: GenericDoc,
  now: Date = new Date(),
): ReminderMoment[] {
  if (!isOpenToat(toat)) {
    return [];
  }

  const primaryDateTime = toatPrimaryDateTime(toat);
  const reminderAt = toatReminderAt(toat);

  if (!primaryDateTime && !reminderAt) {
    return [];
  }

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const candidates: ReminderMoment[] = [];

  if (reminderAt) {
    candidates.push({
      key: "custom",
      dueAt: reminderAt,
      title: "Reminder",
      subtitle: `${dateFormatter.format(reminderAt)} at ${timeFormatter.format(reminderAt)}`,
    });
  }

  if (primaryDateTime) {
    const offset = typeof toatTimeRecord(toat)?.reminderOffset === 'number'
      ? (toatTimeRecord(toat)!.reminderOffset as number)
      : 10; // default: 10 min before
    const offsetMs = offset * 60 * 1000;
    const offsetBefore = new Date(primaryDateTime.getTime() - offsetMs);
    const dayBefore = new Date(primaryDateTime.getTime() - 24 * 60 * 60 * 1000);
    candidates.push({
      key: "leave-by",
      dueAt: offsetBefore,
      title: offset < 60
        ? `${offset} min before`
        : offset === 60
          ? `1 hour before`
          : `${Math.floor(offset / 60)}h ${offset % 60 > 0 ? `${offset % 60}m ` : ''}before`,
      subtitle: `Reminder for ${timeFormatter.format(primaryDateTime)}`,
    });
    // Day-before reminder (skip if offset is already >= 18 hours to avoid near-duplicate)
    if (offset < 18 * 60) {
      candidates.push({
        key: "day-before",
        dueAt: dayBefore,
        title: "Day before reminder",
        subtitle: `${dateFormatter.format(dayBefore)} at ${timeFormatter.format(dayBefore)}`,
      });
    }
  }

  const seenMinutes = new Set<number>();
  return candidates
    .sort((left, right) => left.dueAt.getTime() - right.dueAt.getTime())
    .filter((moment) => {
      if (moment.dueAt.getTime() <= now.getTime()) {
        return false;
      }

      const minuteKey = Math.floor(moment.dueAt.getTime() / 60000);
      if (seenMinutes.has(minuteKey)) {
        return false;
      }

      seenMinutes.add(minuteKey);
      return true;
    });
}

function buildReminderDocs(
  toat: GenericDoc,
  preferences: NotificationPreferences,
  now: Date = new Date(),
) {
  const userId = idString(toat.ownerId);
  const toatId = idString(toat._id);

  if (!userId || !toatId) {
    return [];
  }

  const kind = notificationKindForToat(toat);
  if (!preferences[kind]?.push) {
    return [];
  }

  const heading = typeof toat.title === "string" && toat.title
    ? toat.title
    : "Toatre Ping";

  return buildReminderMoments(toat, now).map((moment) => ({
    userId,
    toatId,
    channel: "push",
    kind,
    momentKey: moment.key,
    title: heading,
    body: moment.title,
    subtitle: moment.subtitle,
    payload: `toat:${toatId}:${moment.key}`,
    dueAt: moment.dueAt,
    sentAt: null,
    createdAt: now,
    updatedAt: now,
  }));
}

async function loadNotificationPreferences(
  userId: string,
  providedSettingsDoc?: GenericDoc | null,
): Promise<NotificationPreferences> {
  if (providedSettingsDoc) {
    return normalizeNotificationPreferences(providedSettingsDoc.notificationPreferences);
  }

  const { settings } = await getCollections();
  const settingsDoc = await settings.findOne({ userId });
  return settingsDoc
    ? normalizeNotificationPreferences(settingsDoc.notificationPreferences)
    : createDefaultNotificationPreferences();
}

export async function deleteToatPushReminders(input: {
  userId: string;
  toatId: string;
}) {
  const { reminders } = await getCollections();
  await reminders.deleteMany({
    userId: input.userId,
    toatId: input.toatId,
    channel: "push",
  });
}

export async function syncToatPushReminders(
  toat: GenericDoc,
  settingsDoc?: GenericDoc | null,
) {
  const userId = idString(toat.ownerId);
  const toatId = idString(toat._id);

  if (!userId || !toatId) {
    return;
  }

  const preferences = await loadNotificationPreferences(userId, settingsDoc);
  const docs = buildReminderDocs(toat, preferences);
  const { reminders } = await getCollections();

  await reminders.deleteMany({
    userId,
    toatId,
    channel: "push",
    sentAt: null,
  });

  if (docs.length > 0) {
    await reminders.insertMany(docs);
  }
}

export async function syncUserPushReminders(
  userId: string,
  settingsDoc?: GenericDoc | null,
) {
  const ownerId = new ObjectId(userId);
  const preferences = await loadNotificationPreferences(userId, settingsDoc);
  const { reminders, toats } = await getCollections();

  await reminders.deleteMany({ userId, channel: "push", sentAt: null });

  const docs = await toats.find({ ownerId }).toArray();
  const nextReminderDocs = docs.flatMap((toat) => buildReminderDocs(toat, preferences));

  if (nextReminderDocs.length > 0) {
    await reminders.insertMany(nextReminderDocs);
  }
}