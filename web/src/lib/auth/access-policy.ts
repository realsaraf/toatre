import { getCollections } from "@/lib/mongo/collections";

export const ADMIN_EMAIL = "realsaraf@gmail.com";

export type AccessLevel = "blocked" | "approved" | "admin";

export function normalizeEmail(input: string | null | undefined): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  return email.length > 0 ? email : null;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) === ADMIN_EMAIL;
}

export async function resolveAccessLevel(email: string | null | undefined): Promise<AccessLevel> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return "blocked";
  if (isAdminEmail(normalizedEmail)) return "admin";

  const { approvedUsers } = await getCollections();
  const approved = await approvedUsers.findOne({ email: normalizedEmail, isActive: true });
  return approved ? "approved" : "blocked";
}