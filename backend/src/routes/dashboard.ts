import { Router, Request, Response } from "express";
import { connectDB } from "../lib/db";
import Order from "../models/Order";
import Product from "../models/Product";
import { getSession } from "../lib/auth";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session || !["admin", "superadmin"].includes(session.role))
    return res.status(403).json({ error: "Forbidden." });

  await connectDB();

  const [allOrders, topProducts, allProducts] = await Promise.all([
    Order.find({}).lean(),
    Product.find({}).sort({ sales: -1 }).limit(3).lean(),
    Product.find({}).lean(),
  ]);

  const totalOrders = allOrders.length;
  const activeOrders = allOrders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const completedOrders = allOrders.filter((o) => o.status === "delivered").length;
  const returnedOrders = allOrders.filter((o) => o.status === "returned").length;
  const totalRevenue = allOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const now = new Date();

  // Monthly (last 6 months)
  const months: { name: string; sales: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short" });
    const revenue = allOrders
      .filter((o) => {
        const c = new Date(o.createdAt);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);
    months.push({ name: label, sales: Math.round(revenue) });
  }

  // Weekly (last 7 days)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekly: { name: string; sales: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const revenue = allOrders
      .filter((o) => {
        const c = new Date(o.createdAt);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth() && c.getDate() === d.getDate();
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);
    weekly.push({ name: days[d.getDay()], sales: Math.round(revenue) });
  }

  // Yearly (last 5 years)
  const yearly: { name: string; sales: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const year = now.getFullYear() - i;
    const revenue = allOrders
      .filter((o) => new Date(o.createdAt).getFullYear() === year)
      .reduce((sum, o) => sum + o.totalAmount, 0);
    yearly.push({ name: String(year), sales: Math.round(revenue) });
  }

  const bestSellers = topProducts.map((p) => ({
    _id: p._id,
    name: p.name,
    price: p.price,
    sales: p.sales,
    images: p.images,
  }));

  const categoryMap: Record<string, number> = {};
  for (const p of allProducts) {
    const cat = (p.category || "Uncategorized").trim();
    categoryMap[cat] = (categoryMap[cat] ?? 0) + (p.stock ?? 0);
  }
  const categoryStock = Object.entries(categoryMap).map(([category, stock]) => ({ category, stock }));

  return res.json({
    stats: { totalOrders, activeOrders, completedOrders, returnedOrders, totalRevenue: Math.round(totalRevenue * 100) / 100 },
    salesData: { weekly, monthly: months, yearly },
    bestSellers,
    categoryStock,
  });
});

export default router;
