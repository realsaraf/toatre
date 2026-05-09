import { getAdminMessaging } from "@/lib/firebase/admin";
import { getCollections } from "@/lib/mongo/collections";
import { sendReminderEmail } from "@/lib/email/reminder";

type GenericDoc = Record<string, unknown>;

function failureMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Ping dispatch failed.";
}

export async function dispatchDuePings(now: Date = new Date()) {
  const { reminders, deviceTokens } = await getCollections();
  const dueReminders = await reminders
    .find({
      channel: "push",
      dueAt: { $lte: now },
      sentAt: null,
    })
    .sort({ dueAt: 1 })
    .limit(100)
    .toArray();

  let fired = 0;
  let errors = 0;

  for (const reminder of dueReminders as GenericDoc[]) {
    const reminderId = reminder._id;
    if (!reminderId) {
      continue;
    }

    const claimedReminder = await reminders.findOneAndUpdate(
      {
        _id: reminderId,
        sentAt: null,
        lockedAt: { $exists: false },
      } as Record<string, unknown>,
      {
        $set: {
          lockedAt: now,
          lastAttemptAt: now,
          updatedAt: now,
        },
        $unset: { lastError: "" },
      },
      { returnDocument: "after" },
    );

    if (!claimedReminder) {
      continue;
    }

    const tokens = await deviceTokens
      .find({ userId: claimedReminder.userId })
      .toArray();
    const registrationTokens = tokens
      .map((tokenDoc) => (typeof tokenDoc.token === "string" ? tokenDoc.token : null))
      .filter((token): token is string => Boolean(token));

    if (registrationTokens.length === 0) {
      await reminders.updateOne(
        { _id: claimedReminder._id },
        {
          $unset: { lockedAt: "" },
          $set: {
            lastError: "No registered device tokens for push delivery.",
            updatedAt: new Date(),
          },
        },
      );
      continue;
    }

    try {
      const response = await getAdminMessaging().sendEachForMulticast({
        tokens: registrationTokens,
        notification: {
          title:
            typeof claimedReminder.title === "string" && claimedReminder.title
              ? claimedReminder.title
              : "Toatre Ping",
          body:
            typeof claimedReminder.body === "string" && claimedReminder.body
              ? claimedReminder.body
              : "Reminder",
        },
        data: {
          payload:
            typeof claimedReminder.payload === "string"
              ? claimedReminder.payload
              : `toat:${claimedReminder.toatId}:${claimedReminder.momentKey ?? "push"}`,
          toatId:
            typeof claimedReminder.toatId === "string"
              ? claimedReminder.toatId
              : "",
          momentKey:
            typeof claimedReminder.momentKey === "string"
              ? claimedReminder.momentKey
              : "push",
          title:
            typeof claimedReminder.title === "string"
              ? claimedReminder.title
              : "Toatre Ping",
          body:
            typeof claimedReminder.body === "string"
              ? claimedReminder.body
              : "Reminder",
        },
        android: {
          priority: "high",
          notification: {
            channelId: "toatre_pings",
            sound: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
            },
          },
        },
      });

      const invalidTokens = response.responses
        .map((result, index) => ({ result, token: registrationTokens[index] }))
        .filter(({ result }) => {
          const code = result.error?.code;
          return (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          );
        })
        .map(({ token }) => token);

      if (invalidTokens.length > 0) {
        await deviceTokens.deleteMany({ token: { $in: invalidTokens } });
      }

      if (response.successCount > 0) {
        fired += 1;
        await reminders.updateOne(
          { _id: claimedReminder._id },
          {
            $set: {
              sentAt: new Date(),
              updatedAt: new Date(),
            },
            $unset: { lockedAt: "", lastError: "" },
          },
        );
        continue;
      }

      errors += 1;
      await reminders.updateOne(
        { _id: claimedReminder._id },
        {
          $unset: { lockedAt: "" },
          $set: {
            lastError: response.responses[0]?.error?.message ?? "Push delivery failed.",
            updatedAt: new Date(),
          },
        },
      );
    } catch (error) {
      errors += 1;
      await reminders.updateOne(
        { _id: claimedReminder._id },
        {
          $unset: { lockedAt: "" },
          $set: {
            lastError: failureMessage(error),
            updatedAt: new Date(),
          },
        },
      );
    }
  }

  // ── Email channel ──────────────────────────────────────────────────
  const dueEmailReminders = await reminders
    .find({
      channel: "email",
      dueAt: { $lte: now },
      sentAt: null,
    })
    .sort({ dueAt: 1 })
    .limit(100)
    .toArray();

  for (const reminder of dueEmailReminders as GenericDoc[]) {
    const reminderId = reminder._id;
    if (!reminderId) continue;

    const claimed = await reminders.findOneAndUpdate(
      { _id: reminderId, sentAt: null, lockedAt: { $exists: false } } as Record<string, unknown>,
      {
        $set: { lockedAt: now, lastAttemptAt: now, updatedAt: now },
        $unset: { lastError: "" },
      },
      { returnDocument: "after" },
    );

    if (!claimed) continue;

    try {
      const { users } = await getCollections();
      const userDoc = await users.findOne(
        { _id: new (await import("mongodb")).ObjectId(claimed.userId as string) },
        { projection: { email: 1 } },
      );
      const toEmail = typeof userDoc?.email === "string" ? userDoc.email : null;

      if (!toEmail) {
        await reminders.updateOne(
          { _id: claimed._id },
          {
            $unset: { lockedAt: "" },
            $set: { lastError: "No email on user record.", updatedAt: new Date() },
          },
        );
        continue;
      }

      await sendReminderEmail({
        toEmail,
        toatTitle: typeof claimed.title === "string" ? claimed.title : "Toatre Ping",
        reminderLabel: typeof claimed.body === "string" ? claimed.body : "Reminder",
        subtitle: typeof claimed.subtitle === "string" ? claimed.subtitle : "",
      });

      fired += 1;
      await reminders.updateOne(
        { _id: claimed._id },
        {
          $set: { sentAt: new Date(), updatedAt: new Date() },
          $unset: { lockedAt: "", lastError: "" },
        },
      );
    } catch (error) {
      errors += 1;
      await reminders.updateOne(
        { _id: claimed._id },
        {
          $unset: { lockedAt: "" },
          $set: { lastError: failureMessage(error), updatedAt: new Date() },
        },
      );
    }
  }

  return { fired, errors };
}