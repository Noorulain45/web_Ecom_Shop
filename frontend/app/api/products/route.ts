import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import { verifyToken } from "@/lib/auth";

const DRESS_STYLES = ["casual", "formal", "party", "gym"];

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let query: Record<string, unknown> = {};

  if (category) {
    const lower = category.toLowerCase();
    if (DRESS_STYLES.includes(lower)) {
      query = { style: { $regex: new RegExp("^" + category + "$", "i") } };
    } else {
      query = { category: { $regex: new RegExp("^" + category + "$", "i") } };
    }
  }

  const products = await Product.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  if (!["admin", "superadmin"].includes(session.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await req.json();
  const {
    name, category, price, description, stock, images, colors, sizes,
    isNewArrival, isTopSelling, loyaltyOnly, hybrid,
    originalPrice, discountPercent, style, colorImages,
  } = body;

  if (!name || !category || price === undefined)
    return NextResponse.json({ error: "name, category and price are required." }, { status: 400 });

  await connectDB();
  const product = await Product.create({
    name,
    category,
    style: style || "",
    price: Number(price),
    description: description || "",
    stock: Number(stock) || 0,
    images: images || [],
    colors: colors || [],
    sizes: sizes || [],
    colorImages: colorImages || {},
    isNewArrival: !!isNewArrival,
    isTopSelling: !!isTopSelling,
    loyaltyOnly: !!loyaltyOnly,
    hybrid: !!hybrid,
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    discountPercent: discountPercent ? Number(discountPercent) : 0,
  });

  return NextResponse.json(product, { status: 201 });
}
