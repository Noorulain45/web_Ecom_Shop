import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const session = await verifyToken(token);
  if (!session || !["admin", "superadmin"].includes(session.role))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  await connectDB();

  const [allOrders, topProducts, allProducts] = await Promise.all([
    Order.find({}).lean(),
    Product.find({}).sort({ sales: -1 }).limit(3).lean(),
    Product.find({}).lean(),
  ]);

  // Stat cards
  const totalOrders = allOrders.length;
  const activeOrders = allOrders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const completedOrders = allOrders.filter((o) => o.status === "delivered").length;
  const returnedOrders = allOrders.filter((o) => o.status === "returned").length;
  const totalRevenue = allOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Sales graph — group delivered orders by month (last 6 months)
  const now = new Date();
  const months: { name: string; sales: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short" });
    const monthOrders = allOrders.filter((o) => {
      const created = new Date(o.createdAt);
      return (
        created.getFullYear() === d.getFullYear() &&
        created.getMonth() === d.getMonth()
      );
    });
    const revenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    months.push({ name: label, sales: Math.round(revenue) });
  }

  // Weekly — last 7 days
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekly: { name: string; sales: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayOrders = allOrders.filter((o) => {
      const created = new Date(o.createdAt);
      return (
        created.getFullYear() === d.getFullYear() &&
        created.getMonth() === d.getMonth() &&
        created.getDate() === d.getDate()
      );
    });
    const revenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    weekly.push({ name: days[d.getDay()], sales: Math.round(revenue) });
  }

  // Yearly — last 5 years
  const yearly: { name: string; sales: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const year = now.getFullYear() - i;
    const yearOrders = allOrders.filter((o) => new Date(o.createdAt).getFullYear() === year);
    const revenue = yearOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    yearly.push({ name: String(year), sales: Math.round(revenue) });
  }

  // Best sellers
  const bestSellers = topProducts.map((p) => ({
    _id: p._id,
    name: p.name,
    price: p.price,
    sales: p.sales,
    images: p.images,
  }));

  // Category stock breakdown
  const categoryMap: Record<string, number> = {};
  for (const p of allProducts) {
    const cat = (p.category || "Uncategorized").trim();
    categoryMap[cat] = (categoryMap[cat] ?? 0) + (p.stock ?? 0);
  }
  const categoryStock = Object.entries(categoryMap).map(([category, stock]) => ({ category, stock }));

  return NextResponse.json({
    stats: {
      totalOrders,
      activeOrders,
      completedOrders,
      returnedOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    },
    salesData: { weekly, monthly: months, yearly },
    bestSellers,
    categoryStock,
  });
}
