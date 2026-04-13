import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/lib/models/Cart";
import Product from "@/lib/models/Product";
import { verifyToken } from "@/lib/auth";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  await connectDB();
  const cart = await Cart.findOne({ user: session.userId }).populate("items.product").lean();
  return NextResponse.json(cart || { items: [] });
}

function isAdmin(role: string) {
  return role === "admin" || role === "superadmin";
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  if (isAdmin(session.role)) return NextResponse.json({ error: "Admins cannot use the cart." }, { status: 403 });

  const { productId, quantity = 1 } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required." }, { status: 400 });

  await connectDB();
  const product = await Product.findById(productId);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  let cart = await Cart.findOne({ user: session.userId });
  if (!cart) {
    cart = await Cart.create({
      user: session.userId,
      items: [{ product: productId, quantity, price: product.price }],
    });
  } else {
    const existing = cart.items.find((i) => i.product.toString() === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, price: product.price });
    }
    await cart.save();
  }

  return NextResponse.json({ message: "Added to cart." });
}

// PATCH: update quantity of a specific item
export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  if (isAdmin(session.role)) return NextResponse.json({ error: "Admins cannot use the cart." }, { status: 403 });

  const { productId, quantity } = await req.json();
  if (!productId || quantity == null) return NextResponse.json({ error: "productId and quantity required." }, { status: 400 });

  await connectDB();
  const cart = await Cart.findOne({ user: session.userId });
  if (!cart) return NextResponse.json({ error: "Cart not found." }, { status: 404 });

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) return NextResponse.json({ error: "Item not in cart." }, { status: 404 });

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  } else {
    item.quantity = quantity;
  }
  await cart.save();
  return NextResponse.json({ message: "Cart updated." });
}

// DELETE: remove a specific item from cart
export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  if (isAdmin(session.role)) return NextResponse.json({ error: "Admins cannot use the cart." }, { status: 403 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required." }, { status: 400 });

  await connectDB();
  const cart = await Cart.findOne({ user: session.userId });
  if (!cart) return NextResponse.json({ error: "Cart not found." }, { status: 404 });

  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();
  return NextResponse.json({ message: "Item removed." });
}
