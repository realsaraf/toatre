import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/auth/access-policy";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getCollections } from "@/lib/mongo/collections";

type ApprovalDoc = {
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
};

function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = normalizeEmail(value);
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireAdminUser(request);
  if (errorResponse) return errorResponse;

  const { approvedUsers } = await getCollections();
  const rows = await approvedUsers
    .find({}, { projection: { _id: 0, email: 1, isActive: 1, createdAt: 1, updatedAt: 1, updatedBy: 1 } })
    .sort({ email: 1 })
    .toArray();

  const users: ApprovalDoc[] = rows
    .map((row) => ({
      email: typeof row.email === "string" ? row.email : "",
      isActive: row.isActive === true,
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(0),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(0),
      updatedBy: typeof row.updatedBy === "string" ? row.updatedBy : "admin",
    }))
    .filter((row) => row.email.length > 0);

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireAdminUser(request);
  if (errorResponse) return errorResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = parseEmail((body as { email?: unknown }).email);
  if (!email) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const now = new Date();
  const { approvedUsers } = await getCollections();
  await approvedUsers.updateOne(
    { email },
    {
      $set: {
        email,
        isActive: true,
        updatedAt: now,
        updatedBy: user.email ?? "admin",
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, email, isActive: true });
}

export async function PATCH(request: NextRequest) {
  const { user, errorResponse } = await requireAdminUser(request);
  if (errorResponse) return errorResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as { email?: unknown; isActive?: unknown };
  const email = parseEmail(payload.email);
  if (!email) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (typeof payload.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be true or false." }, { status: 400 });
  }

  const now = new Date();
  const { approvedUsers } = await getCollections();
  const result = await approvedUsers.updateOne(
    { email },
    {
      $set: {
        isActive: payload.isActive,
        updatedAt: now,
        updatedBy: user.email ?? "admin",
      },
      $setOnInsert: {
        email,
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return NextResponse.json({
    ok: true,
    email,
    isActive: payload.isActive,
    matched: result.matchedCount,
  });
}

export async function DELETE(request: NextRequest) {
  const { errorResponse } = await requireAdminUser(request);
  if (errorResponse) return errorResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = parseEmail((body as { email?: unknown }).email);
  if (!email) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const { approvedUsers } = await getCollections();
  await approvedUsers.deleteOne({ email });

  return NextResponse.json({ ok: true, email });
}
