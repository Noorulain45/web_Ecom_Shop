import { Router, Request, Response } from "express";
import Stripe from "stripe";
import type { Stripe as StripeNS } from "stripe/cjs/stripe.core.js";
import { connectDB } from "../lib/db";
import { getSession } from "../lib/auth";
import Cart from "../models/Cart";
import Order from "../models/Order";
import Payment from "../models/Payment";
import User from "../models/User";

const router = Router();

// ✅ Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const DELIVERY_FEE = 15;
const POINTS_PER_DOLLAR = 10;

// ─── POST /api/payments/create-intent ────────────────────────────────────────
router.post("/create-intent", async (req: Request, res: Response) => {
  const session = await getSession(req);

  if (!session) {
    return res.status(401).json({ error: "Unauthenticated." });
  }

  if (session.role === "admin" || session.role === "superadmin") {
    return res.status(403).json({ error: "Admins cannot place orders." });
  }

  await connectDB();

  const cart = await Cart.findOne({ user: session.userId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }

  const subtotal = cart.items.reduce(
    (sum: number, i: any) => sum + i.price * i.quantity,
    0
  );

  const totalAmount = subtotal + DELIVERY_FEE;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100),
    currency: "usd",
    metadata: {
      userId: String(session.userId),
      userEmail: session.email || "",
    },
  });

  return res.json({ clientSecret: paymentIntent.client_secret });
});

// ─── POST /api/payments/confirm ───────────────────────────────────────────────
// Called by the frontend after stripe.confirmCardPayment() succeeds.
// Saves the Order + Payment to the database immediately (no webhook dependency).
router.post("/confirm", async (req: Request, res: Response) => {
  console.log("[confirm] hit — body:", req.body);

  const session = await getSession(req);
  console.log("[confirm] session:", session);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });

  const { paymentIntentId } = req.body;
  if (!paymentIntentId) {
    console.log("[confirm] missing paymentIntentId");
    return res.status(400).json({ error: "paymentIntentId is required." });
  }

  await connectDB();
  console.log("[confirm] DB connected");

  // Idempotency — don't create duplicate orders
  const existing = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
  if (existing) {
    console.log("[confirm] order already exists:", existing.orderId);
    return res.json({ success: true, orderId: existing.orderId });
  }

  // Verify the payment actually succeeded with Stripe
  let intent: StripeNS.PaymentIntent;
  try {
    intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log("[confirm] stripe intent status:", intent.status);
  } catch (err: any) {
    console.error("[confirm] stripe retrieve failed:", err.message);
    return res.status(400).json({ error: "Invalid paymentIntentId." });
  }

  if (intent.status !== "succeeded") {
    console.log("[confirm] payment not succeeded, status:", intent.status);
    return res.status(400).json({ error: "Payment has not succeeded." });
  }

  const cart = await Cart.findOne({ user: session.userId }).populate("items.product");
  console.log("[confirm] cart:", cart ? `${cart.items.length} items` : "not found");
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }

  const items = cart.items.map((item: any) => ({
    product: item.product._id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.price,
  }));

  const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  const totalAmount = subtotal + DELIVERY_FEE;
  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Save Order
  const newOrder = await Order.create({
    orderId,
    user: session.userId,
    items,
    totalAmount,
    status: "pending",
    stripePaymentIntentId: paymentIntentId,
  });
  console.log("[confirm] order saved:", newOrder.orderId);

  // Save Payment
  await Payment.create({
    user: session.userId,
    order: newOrder._id,
    stripePaymentIntentId: paymentIntentId,
    amount: totalAmount,
    currency: intent.currency || "usd",
    status: "succeeded",
  });
  console.log("[confirm] payment saved");

  // Clear cart
  cart.items = [];
  await cart.save();

  // Loyalty points
  const pointsEarned = Math.floor(subtotal * POINTS_PER_DOLLAR);
  await User.findByIdAndUpdate(session.userId, { $inc: { loyaltyPoints: pointsEarned } });

  // Notify admins via socket
  const io = (global as any).__io;
  if (io) {
    io.to("admins").emit("new_order", {
      _id: newOrder._id,
      orderId: newOrder.orderId,
      totalAmount: newOrder.totalAmount,
      status: newOrder.status,
      createdAt: newOrder.createdAt,
    });
  }

  console.log("[confirm] done — returning success");
  return res.status(201).json({ success: true, orderId: newOrder.orderId, pointsEarned });
});

// ─── POST /api/payments/webhook ───────────────────────────────────────────────
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).json({ error: "Missing Stripe signature" });
  }

  let event: StripeNS.Event;

  try {
    // ✅ IMPORTANT: req.body is RAW buffer (because of express.raw middleware)
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("[webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // ✅ Handle successful payment
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as StripeNS.PaymentIntent;
    const userId = intent.metadata?.userId;

    if (!userId) {
      return res.json({ received: true });
    }

    await connectDB();

    const existing = await Order.findOne({
      stripePaymentIntentId: intent.id,
    });

    if (existing) {
      return res.json({ received: true });
    }

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.json({ received: true });
    }

    const items = cart.items.map((item: any) => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const subtotal = items.reduce(
      (sum: number, i: any) => sum + i.price * i.quantity,
      0
    );

    const totalAmount = subtotal + DELIVERY_FEE;

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = await Order.create({
      orderId,
      user: userId,
      items,
      totalAmount,
      status: "pending",
      stripePaymentIntentId: intent.id,
    });

    // Notify all connected admins in real-time
    const io = (global as any).__io;
    if (io) {
      io.to("admins").emit("new_order", {
        _id: newOrder._id,
        orderId: newOrder.orderId,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
        createdAt: newOrder.createdAt,
      });
    }

    // ✅ Clear cart
    cart.items = [];
    await cart.save();

    // ✅ Loyalty points
    const pointsEarned = Math.floor(subtotal * POINTS_PER_DOLLAR);

    await User.findByIdAndUpdate(userId, {
      $inc: { loyaltyPoints: pointsEarned },
    });
  }

  return res.json({ received: true });
});

// ─── POST /api/payments/use-points ───────────────────────────────────────────
// Allows users with enough loyalty points to place an order without Stripe.
router.post("/use-points", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });

  if (session.role === "admin" || session.role === "superadmin") {
    return res.status(403).json({ error: "Admins cannot place orders." });
  }

  await connectDB();

  const user = await User.findById(session.userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const cart = await Cart.findOne({ user: session.userId }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }

  const items = cart.items.map((item: any) => ({
    product: item.product._id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.price,
  }));

  const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  const totalAmount = subtotal + DELIVERY_FEE;

  // Each loyalty point = $0.01 (100 points = $1)
  const POINTS_PER_DOLLAR_REDEMPTION = 100;
  const pointsRequired = Math.ceil(totalAmount * POINTS_PER_DOLLAR_REDEMPTION);

  if (user.loyaltyPoints < pointsRequired) {
    return res.status(400).json({
      error: "Not enough loyalty points.",
      pointsRequired,
      pointsAvailable: user.loyaltyPoints,
    });
  }

  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newOrder = await Order.create({
    orderId,
    user: session.userId,
    items,
    totalAmount,
    status: "pending",
    // no stripePaymentIntentId — paid via loyalty points
  });

  await Payment.create({
    user: session.userId,
    order: newOrder._id,
    amount: totalAmount,
    currency: "usd",
    status: "succeeded",
    // no stripePaymentIntentId
  });

  // Deduct points
  await User.findByIdAndUpdate(session.userId, { $inc: { loyaltyPoints: -pointsRequired } });

  // Clear cart
  cart.items = [];
  await cart.save();

  // Notify admins
  const io = (global as any).__io;
  if (io) {
    io.to("admins").emit("new_order", {
      _id: newOrder._id,
      orderId: newOrder.orderId,
      totalAmount: newOrder.totalAmount,
      status: newOrder.status,
      createdAt: newOrder.createdAt,
    });
  }

  return res.status(201).json({
    success: true,
    orderId: newOrder.orderId,
    pointsUsed: pointsRequired,
    pointsRemaining: user.loyaltyPoints - pointsRequired,
  });
});

export default router;
