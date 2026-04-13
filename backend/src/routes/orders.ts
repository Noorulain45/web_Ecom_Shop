import { Router, Request, Response } from "express";
import { connectDB } from "../lib/db";
import Order from "../models/Order";
import Cart from "../models/Cart";
import User from "../models/User";
import { getSession } from "../lib/auth";

const router = Router();
const POINTS_PER_DOLLAR = 10;

// POST /api/orders
router.post("/", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });
  if (session.role === "admin" || session.role === "superadmin")
    return res.status(403).json({ error: "Admins cannot place orders." });

  await connectDB();
  const cart = await Cart.findOne({ user: session.userId }).populate("items.product");
  if (!cart || cart.items.length === 0)
    return res.status(400).json({ error: "Cart is empty." });

  const items = cart.items.map((item: any) => ({
    product: item.product._id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.price,
  }));

  const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  const totalAmount = subtotal + 15; // delivery fee
  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const order = await Order.create({ orderId, user: session.userId, items, totalAmount, status: "pending" });

  cart.items = [];
  await cart.save();

  const pointsEarned = Math.floor(subtotal * POINTS_PER_DOLLAR);
  await User.findByIdAndUpdate(session.userId, { $inc: { loyaltyPoints: pointsEarned } });

  return res.status(201).json({ success: true, orderId: order.orderId, pointsEarned });
});

// GET /api/orders
router.get("/", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });

  await connectDB();
  const isAdmin = session.role === "admin" || session.role === "superadmin";
  const query = isAdmin ? {} : { user: session.userId };

  const orders = await Order.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return res.json(orders);
});

// GET /api/orders/:id
router.get("/:id", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session || !["admin", "superadmin"].includes(session.role))
    return res.status(403).json({ error: "Forbidden." });

  await connectDB();
  const order = await Order.findById(req.params.id).populate("user", "name email").lean();
  if (!order) return res.status(404).json({ error: "Order not found." });
  return res.json(order);
});

// PATCH /api/orders/:id
router.patch("/:id", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session || !["admin", "superadmin"].includes(session.role))
    return res.status(403).json({ error: "Forbidden." });

  const { status } = req.body;
  const validStatuses = ["pending", "processing", "delivered", "cancelled", "returned"];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: "Invalid status." });

  await connectDB();
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate("user", "name email")
    .lean();
  if (!order) return res.status(404).json({ error: "Order not found." });
  return res.json(order);
});

// DELETE /api/orders/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session || !["admin", "superadmin"].includes(session.role))
    return res.status(403).json({ error: "Forbidden." });

  await connectDB();
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  return res.json({ success: true });
});

export default router;
