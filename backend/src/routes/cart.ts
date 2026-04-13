import { Router, Request, Response } from "express";
import { connectDB } from "../lib/db";
import Cart from "../models/Cart";
import Product from "../models/Product";
import { getSession } from "../lib/auth";

const router = Router();

function isAdmin(role: string) {
  return role === "admin" || role === "superadmin";
}

// GET /api/cart
router.get("/", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });

  await connectDB();
  const cart = await Cart.findOne({ user: session.userId }).populate("items.product").lean();
  return res.json(cart || { items: [] });
});

// POST /api/cart
router.post("/", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });
  if (isAdmin(session.role)) return res.status(403).json({ error: "Admins cannot use the cart." });

  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: "productId required." });

  await connectDB();
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "Product not found." });

  let cart = await Cart.findOne({ user: session.userId });
  if (!cart) {
    cart = await Cart.create({ user: session.userId, items: [{ product: productId, quantity, price: product.price }] });
  } else {
    const existing = cart.items.find((i) => i.product.toString() === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, price: product.price });
    }
    await cart.save();
  }

  return res.json({ message: "Added to cart." });
});

// PATCH /api/cart
router.patch("/", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });
  if (isAdmin(session.role)) return res.status(403).json({ error: "Admins cannot use the cart." });

  const { productId, quantity } = req.body;
  if (!productId || quantity == null)
    return res.status(400).json({ error: "productId and quantity required." });

  await connectDB();
  const cart = await Cart.findOne({ user: session.userId });
  if (!cart) return res.status(404).json({ error: "Cart not found." });

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) return res.status(404).json({ error: "Item not in cart." });

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  } else {
    item.quantity = quantity;
  }
  await cart.save();
  return res.json({ message: "Cart updated." });
});

// DELETE /api/cart
router.delete("/", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });
  if (isAdmin(session.role)) return res.status(403).json({ error: "Admins cannot use the cart." });

  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: "productId required." });

  await connectDB();
  const cart = await Cart.findOne({ user: session.userId });
  if (!cart) return res.status(404).json({ error: "Cart not found." });

  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();
  return res.json({ message: "Item removed." });
});

export default router;
