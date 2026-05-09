/**
 * Sends a silent FCM data message to every registered device for a user.
 * Used to prompt the mobile app to refresh toats when a mutation happens
 * on another surface (e.g. web). Fire-and-forget — never throws.
 */

import { getAdminMessaging } from "@/lib/firebase/admin";
import { getCollections } from "@/lib/mongo/collections";

export async function notifyUserDevices(
  userId: string,
  data: Record<string, string> = {}
): Promise<void> {
  try {
    const { deviceTokens } = await getCollections();
    const docs = await deviceTokens.find({ userId }).toArray();
    const tokens = docs
      .map((d) => (typeof d.token === "string" ? d.token : null))
      .filter((t): t is string => Boolean(t));

    if (tokens.length === 0) return;

    await getAdminMessaging().sendEachForMulticast({
      tokens,
      data: { type: "toat-sync", ...data },
      // Silent background delivery — no visible alert
      apns: {
        headers: { "apns-priority": "5" },
        payload: { aps: { "content-available": 1 } },
      },
      android: { priority: "normal" },
    });
  } catch {
    // Best-effort — never propagate to caller
  }
}
