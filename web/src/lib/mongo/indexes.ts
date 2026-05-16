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

  const { users, toats, captures, people, connections, acl, settings, reminders, deviceTokens, calendarSyncTokens, calendarSyncStates, bookingSettings, bookingRequests, approvedUsers, waitlist } =
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
  await toats.createIndex({ ownerId: 1, externalProvider: 1, externalEventId: 1 }, { sparse: true });
  await toats.createIndex({ ownerId: 1, syncOrigin: 1, datetime: 1 }, { sparse: true });

  // captures
  await captures.createIndex({ userId: 1, createdAt: -1 });
  await captures.createIndex({ userId: 1, source: 1 });

  // people
  await people.createIndex({ userId: 1 });
  await people.createIndex({ userId: 1, handle: 1 }, { sparse: true });

  // connections
  await connections.createIndex({ ownerId: 1, relationship: 1 });
  await connections.createIndex({ ownerId: 1, name: 1 });
  await connections.createIndex({ ownerId: 1, handle: 1 }, { sparse: true });

  // acl (share tokens)
  await acl.createIndex({ toatId: 1 });
  await acl.createIndex({ token: 1 }, { unique: true });
  await acl.createIndex({ ownerId: 1 });
  await acl.createIndex({ ownerId: 1, connectionId: 1 }, { sparse: true });

  // settings
  await settings.createIndex({ userId: 1 }, { unique: true });

  // calendar sync
  await calendarSyncTokens.createIndex({ userId: 1, provider: 1 }, { unique: true });
  await calendarSyncTokens.createIndex({ provider: 1, connected: 1 });
  await calendarSyncStates.createIndex({ stateHash: 1 }, { unique: true });
  await calendarSyncStates.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  // reminders
  await reminders.createIndex({ userId: 1, dueAt: 1 });
  await reminders.createIndex({ userId: 1, toatId: 1 });
  await reminders.createIndex({ dueAt: 1, sentAt: 1 }); // cron query
  await reminders.createIndex({ toatId: 1 });

  // device tokens
  await deviceTokens.createIndex({ token: 1 }, { unique: true });
  await deviceTokens.createIndex({ userId: 1, updatedAt: -1 });

  // booking
  await bookingSettings.createIndex({ userId: 1 }, { unique: true });
  await bookingRequests.createIndex({ ownerId: 1, slotStart: 1 });
  await bookingRequests.createIndex({ ownerId: 1, state: 1 });
  await bookingRequests.createIndex({ bookerUserId: 1, state: 1 }, { sparse: true });
  await bookingRequests.createIndex({ slotStart: 1, slotEnd: 1 });

  // pre-launch access control
  await approvedUsers.createIndex({ email: 1 }, { unique: true });
  await approvedUsers.createIndex({ isActive: 1, updatedAt: -1 });
  await waitlist.createIndex({ email: 1 }, { unique: true });
  await waitlist.createIndex({ createdAt: -1 });
}
