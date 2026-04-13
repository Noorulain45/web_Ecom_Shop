import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import Cart from "@/lib/models/Cart";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

const POINTS_PER_DOLLAR = 10;

async function getSession(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// POST /api/orders — place order from cart
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  if (session.role === "admin" || session.role === "superadmin")
    return NextResponse.json({ error: "Admins cannot place orders." }, { status: 403 });

  await connectDB();

  const cart = await Cart.findOne({ user: session.userId }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const items = cart.items.map((item: any) => ({
    product: item.product._id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.price,
  }));

  const totalAmount = items.reduce(
    (sum: number, i: any) => sum + i.price * i.quantity,
    0
  ) + 15; // delivery fee

  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const order = await Order.create({
    orderId,
    user: session.userId,
    items,
    totalAmount,
    status: "pending",
  });

  // Clear the cart
  cart.items = [];
  await cart.save();

  // Award loyalty points: 10 pts per $1 spent (excluding delivery fee)
  const orderTotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  const pointsEarned = Math.floor(orderTotal * POINTS_PER_DOLLAR);
  await User.findByIdAndUpdate(session.userId, { $inc: { loyaltyPoints: pointsEarned } });

  return NextResponse.json({ success: true, orderId: order.orderId, pointsEarned }, { status: 201 });
}

// GET /api/orders — fetch all orders (admin) or user's orders
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  await connectDB();

  const isAdmin = session.role === "admin" || session.role === "superadmin";
  const query = isAdmin ? {} : { user: session.userId };

  const orders = await Order.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(orders);
}
