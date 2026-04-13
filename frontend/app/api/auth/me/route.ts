import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.userId).select("loyaltyPoints").lean();
  const loyaltyPoints = (user as { loyaltyPoints?: number } | null)?.loyaltyPoints ?? 0;

  return NextResponse.json({ ...session, loyaltyPoints });
}
