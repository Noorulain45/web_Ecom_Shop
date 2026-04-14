import { Router, Request, Response } from "express";
import { connectDB } from "../lib/db";
import Review from "../models/Review";
import Product from "../models/Product";
import { getSession } from "../lib/auth";

const router = Router();

function getIO() {
  return (global as any).__io ?? null;
}

// GET /api/reviews — fetch recent reviews across all products (for homepage)
router.get("/", async (req: Request, res: Response) => {
  await connectDB();
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const reviews = await Review.find({ comment: { $ne: "" } })
      .populate("user", "name")
      .populate("product", "name")
      .sort({ createdAt: -1 })
      .limit(limit);
    return res.json(reviews);
  } catch {
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// GET /api/reviews/:productId
router.get("/:productId", async (req: Request, res: Response) => {
  await connectDB();
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    return res.json(reviews);
  } catch {
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /api/reviews
router.post("/", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const { productId, rating, comment } = req.body;
  if (!productId || !rating)
    return res.status(400).json({ error: "productId and rating are required" });

  await connectDB();
  try {
    const existing = await Review.findOne({ product: productId, user: session.userId });
    if (existing)
      return res.status(409).json({ error: "You have already reviewed this product" });

    const review = await Review.create({
      product: productId,
      user: session.userId,
      rating,
      comment: comment || "",
    });

    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviews: allReviews.length,
    });

    const payload = {
      _id: review._id.toString(),
      productId,
      userId: session.userId,
      userName: session.name || "Anonymous",
      rating,
      comment: comment || "",
      createdAt: review.createdAt,
    };

    const io = getIO();
    if (io) {
      io.to(`product:${productId}`).emit("new_review", payload);
      const productDoc = await Product.findById(productId).select("name").lean();
      io.emit("review_notification", {
        productId,
        productName: (productDoc as any)?.name || "a product",
        userName: session.name || "Anonymous",
        rating,
        reviewId: payload._id,
      });
    }

    return res.status(201).json(payload);
  } catch (err: any) {
    if (err.code === 11000)
      return res.status(409).json({ error: "You have already reviewed this product" });
    return res.status(500).json({ error: "Failed to submit review" });
  }
});

// DELETE /api/reviews
router.delete("/", async (req: Request, res: Response) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const { reviewId } = req.body;
  if (!reviewId) return res.status(400).json({ error: "reviewId is required" });

  await connectDB();
  try {
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.user.toString() !== session.userId)
      return res.status(403).json({ error: "Not authorized" });

    const productId = review.product.toString();
    await review.deleteOne();

    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.length
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviews: allReviews.length,
    });

    const io = getIO();
    if (io) io.to(`product:${productId}`).emit("delete_review", { reviewId });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Failed to delete review" });
  }
});

export default router;
