/**
 * Ensure all MongoDB indexes exist.
 * Called on application boot (imported in layout.tsx server component).
 * Safe to run multiple times — createIndex is idempotent.
 */
import { getCollections } from "./collections";

let ensured = false;

export async function ensureIndexes(): Promise<void> {
  if (ensured) return;
  ensured = true;

  const { users, toats, captures, people, acl, settings, reminders } =
    await getCollections();

  // users
  await users.createIndex({ firebaseUid: 1 }, { unique: true });
  await users.createIndex({ handle: 1 }, { unique: true, sparse: true });
  await users.createIndex({ email: 1 }, { sparse: true });

  // toats
  await toats.createIndex({ userId: 1, scheduledAt: 1 });
  await toats.createIndex({ userId: 1, status: 1, scheduledAt: 1 });
  await toats.createIndex({ userId: 1, kind: 1 });
  await toats.createIndex({ userId: 1, tier: 1 });
  await toats.createIndex({ captureId: 1 }, { sparse: true });
  await toats.createIndex({ createdAt: 1 });

  // captures
  await captures.createIndex({ userId: 1, createdAt: -1 });
  await captures.createIndex({ userId: 1, source: 1 });

  // people
  await people.createIndex({ userId: 1 });
  await people.createIndex({ userId: 1, handle: 1 }, { sparse: true });

  // acl (share tokens)
  await acl.createIndex({ toatId: 1 });
  await acl.createIndex({ token: 1 }, { unique: true });
  await acl.createIndex({ ownerId: 1 });

  // settings
  await settings.createIndex({ userId: 1 }, { unique: true });

  // reminders
  await reminders.createIndex({ userId: 1, dueAt: 1 });
  await reminders.createIndex({ userId: 1, toatId: 1 });
  await reminders.createIndex({ dueAt: 1, sentAt: 1 }); // cron query
  await reminders.createIndex({ toatId: 1 });
}
