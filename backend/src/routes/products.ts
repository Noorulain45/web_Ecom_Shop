import { Router, Request, Response } from "express";
import { connectDB } from "../lib/db";
import Product from "../models/Product";
import { getSession } from "../lib/auth";

const router = Router();
const DRESS_STYLES = ["casual", "formal", "party", "gym"];

// GET /api/products
router.get("/", async (req: Request, res: Response) => {
  await connectDB();
  const category = req.query.category as string | undefined;
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
  return res.json(products);
});

// POST /api/products
router.post("/", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthenticated." });
  if (!["admin", "superadmin"].includes(session.role))
    return res.status(403).json({ error: "Forbidden." });

  const {
    name, category, price, description, stock, images, colors, sizes,
    isNewArrival, isTopSelling, loyaltyOnly, hybrid,
    originalPrice, discountPercent, style, colorImages,
  } = req.body;

  if (!name || !category || price === undefined)
    return res.status(400).json({ error: "name, category and price are required." });

  await connectDB();
  const product = await Product.create({
    name, category,
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

  return res.status(201).json(product);
});

// GET /api/products/:id
router.get("/:id", async (req: Request, res: Response) => {
  await connectDB();
  const product = await Product.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ error: "Not found." });
  return res.json(product);
});

// PATCH /api/products/:id
router.patch("/:id", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session || !["admin", "superadmin"].includes(session.role))
    return res.status(403).json({ error: "Forbidden." });

  await connectDB();
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!product) return res.status(404).json({ error: "Not found." });
  return res.json(product);
});

// DELETE /api/products/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session || !["admin", "superadmin"].includes(session.role))
    return res.status(403).json({ error: "Forbidden." });

  await connectDB();
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Not found." });
  return res.json({ message: "Deleted." });
});

export default router;
