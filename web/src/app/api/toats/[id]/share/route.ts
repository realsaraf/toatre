import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { getCollections } from "@/lib/mongo/collections";

const ShareSchema = z.object({
  connectionIds: z.array(z.string()).optional().default([]),
  permission: z.enum(["view", "edit"]).optional().default("view"),
  linkOnly: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, errorResponse } = await requireUser(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid toat id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = ShareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid share request.", details: parsed.error.flatten() }, { status: 422 });
  }

  const ownerId = new ObjectId(user.mongoId);
  const toatId = new ObjectId(id);
  const { toats, connections, acl } = await getCollections();
  const toat = await toats.findOne({ _id: toatId, ownerId });
  if (!toat) {
    return NextResponse.json({ error: "Toat not found." }, { status: 404 });
  }

  const now = new Date();
  const validConnectionIds = parsed.data.connectionIds.filter(ObjectId.isValid).map((value) => new ObjectId(value));
  const selectedConnections = validConnectionIds.length
    ? await connections.find({ _id: { $in: validConnectionIds }, ownerId }).toArray()
    : [];

  const linkToken = randomBytes(24).toString("base64url");
  const linkDoc = {
    ownerId,
    toatId,
    token: linkToken,
    role: parsed.data.permission,
    scope: parsed.data.linkOnly || selectedConnections.length === 0 ? "link" : "connections",
    createdAt: now,
    updatedAt: now,
  };
  await acl.insertOne(linkDoc);

  if (selectedConnections.length) {
    await acl.insertMany(selectedConnections.map((connection) => ({
      ownerId,
      toatId,
      token: randomBytes(24).toString("base64url"),
      role: parsed.data.permission,
      scope: "connection",
      connectionId: connection._id,
      recipientName: connection.name,
      recipientRelationship: connection.relationship,
      recipientHandle: connection.handle ?? null,
      recipientEmail: connection.email ?? null,
      recipientPhone: connection.phone ?? null,
      createdAt: now,
      updatedAt: now,
    })));
  }

  return NextResponse.json({
    shareUrl: `${appUrl()}/s/${linkToken}`,
    token: linkToken,
    sharedWith: selectedConnections.map((connection) => ({
      id: connection._id.toString(),
      name: typeof connection.name === "string" ? connection.name : "Connection",
      relationship: typeof connection.relationship === "string" ? connection.relationship : "connection",
    })),
  });
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.TOATRE_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}