import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";
import type { ToatLink } from "@/types/documents";

// ─── POST /api/toats/[id]/links ─────────────────────────────────────────────

const bodySchema = z.object({
  url: z.string().url("Must be a valid URL"),
  label: z.string().max(80).optional(),
});

function labelFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid toat ID" }, { status: 400 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message : "Invalid request body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { toats } = await getCollections();

  // Verify ownership
  const toatDoc = await toats.findOne({ _id: new ObjectId(id), ownerId: new ObjectId(user.mongoId) });
  if (!toatDoc) {
    return NextResponse.json({ error: "Toat not found" }, { status: 404 });
  }

  const link: ToatLink = {
    id: crypto.randomUUID(),
    url: body.url,
    label: body.label?.trim() || labelFromUrl(body.url),
    createdAt: new Date(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await toats.updateOne(
    { _id: new ObjectId(id) },
    { $push: { links: link as any }, $set: { updatedAt: new Date() } },
  );

  const serialized = {
    id: link.id,
    url: link.url,
    label: link.label,
    createdAt: link.createdAt.toISOString(),
  };

  return NextResponse.json({ link: serialized }, { status: 201 });
}
