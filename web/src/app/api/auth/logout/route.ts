import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("toatre_session");
  cookieStore.delete("toatre_access");
  return NextResponse.json({ ok: true });
}
