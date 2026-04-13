import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

function isSuperAdmin(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  return token ? verifyToken(token) : null;
}

export async function GET(req: NextRequest) {
  const session = await isSuperAdmin(req);
  if (!session || session.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role"); // "user" | "admin" | null (all)
  const query = role ? { role } : {};

  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(users);
}
