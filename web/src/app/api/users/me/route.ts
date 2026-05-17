import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import { getAdminAuth } from "@/lib/firebase/admin";
import { deleteFromSpaces } from "@/lib/storage/spaces";

/**
 * DELETE /api/users/me
 *
 * Permanently deletes the authenticated user's account:
 * - All toats, captures, reminders, device tokens, settings, connections,
 *   ACL entries, people, calendar sync tokens/states, audit logs
 * - The user document itself
 * - The Firebase Auth account
 *
 * This is irreversible. The client must present a valid Bearer token.
 */
export async function DELETE(request: NextRequest) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  const mongoId = user.mongoId;
  const firebaseUid = user.uid;
  const ownerId = new ObjectId(mongoId);

  const {
    users,
    toats,
    captures,
    reminders,
    deviceTokens,
    settings,
    connections,
    acl,
    people,
    calendarSyncTokens,
    calendarSyncStates,
    reminder_policies,
    audit,
  } = await getCollections();

  // Delete all user data in parallel. Errors in individual collections are
  // tolerated — we continue and still delete the user + Firebase account.

  // First, clean up any attachments stored in DO Spaces (fire-and-forget per key).
  // We project only the attachments field to keep the query light.
  const toatsWithAttachments = await toats
    .find({ ownerId, "attachments.0": { $exists: true } }, { projection: { attachments: 1 } })
    .toArray();
  if (toatsWithAttachments.length > 0) {
    const keys: string[] = toatsWithAttachments.flatMap(
      (t) => (Array.isArray(t.attachments) ? (t.attachments as Array<{ key: string }>) : []).map((a) => a.key)
    );
    await Promise.allSettled(keys.map((key) => deleteFromSpaces(key)));
  }

  const deletions = await Promise.allSettled([
    toats.deleteMany({ ownerId }),
    captures.deleteMany({ userId: mongoId }),
    reminders.deleteMany({ userId: mongoId }),
    deviceTokens.deleteMany({ userId: mongoId }),
    settings.deleteMany({ userId: mongoId }),
    connections.deleteMany({ userId: mongoId }),
    // ACL: entries where this user is the owner or the shared-with target
    acl.deleteMany({ $or: [{ ownerId: mongoId }, { sharedWithId: mongoId }] }),
    people.deleteMany({ userId: mongoId }),
    calendarSyncTokens.deleteMany({ userId: mongoId }),
    calendarSyncStates.deleteMany({ userId: mongoId }),
    reminder_policies.deleteMany({ userId: mongoId }),
    audit.deleteMany({ userId: mongoId }),
  ]);

  // Log any collection-level failures but don't abort.
  for (const result of deletions) {
    if (result.status === "rejected") {
      console.error("[DELETE /api/users/me] collection deletion error:", result.reason);
    }
  }

  // Delete the user document itself.
  await users.deleteOne({ _id: ownerId });

  // Delete the Firebase Auth account last so the token stays valid for the
  // API calls above. If this fails we still return 200 — the app should sign
  // out and the orphaned Firebase account will be cleaned up by a future job.
  try {
    await getAdminAuth().deleteUser(firebaseUid);
  } catch (error) {
    console.error("[DELETE /api/users/me] Firebase Auth deletion error:", error);
  }

  return new NextResponse(null, { status: 204 });
}
