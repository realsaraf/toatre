import { redirect } from "next/navigation";

/**
 * Legacy /j/[token] route — redirects to the canonical /s/[token] page.
 * Keeps old shared links working.
 */
export default async function LegacyShareRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/s/${token}`);
}