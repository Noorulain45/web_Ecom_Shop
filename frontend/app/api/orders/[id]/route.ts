import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import { verifyToken } from "@/lib/auth";

async function getAdmin(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  return session && ["admin", "superadmin"].includes(session.role) ? session : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  await connectDB();

  const order = await Order.findById(id).populate("user", "name email").lean();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ["pending", "processing", "delivered", "cancelled", "returned"];
  if (!validStatuses.includes(status))
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  await connectDB();
  const order = await Order.findByIdAndUpdate(id, { status }, { new: true })
    .populate("user", "name email")
    .lean();

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json(order);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdmin(req);
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  await connectDB();

  const order = await Order.findByIdAndDelete(id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  return NextResponse.json({ success: true });
}
