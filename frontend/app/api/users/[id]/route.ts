import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

async function getSuperAdmin(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  return session?.role === "superadmin" ? session : null;
}

// PATCH — block/unblock or change role
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSuperAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  if (id === session.userId)
    return NextResponse.json({ error: "You cannot modify your own account." }, { status: 400 });

  await connectDB();
  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (typeof body.isBlocked === "boolean") update.isBlocked = body.isBlocked;

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const user = await User.findByIdAndUpdate(id, update, { new: true }).select("-password");
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  return NextResponse.json(user);
}

// DELETE — remove user/admin account
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSuperAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  if (id === session.userId)
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });

  await connectDB();
  const user = await User.findByIdAndDelete(id);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  return NextResponse.json({ success: true });
}
