import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/lib/models/Review";
import Product from "@/lib/models/Product";
import { getSession } from "@/lib/auth";

function getIO() {
  return (global as any).__io ?? null;
}

// POST /api/reviews — submit a review
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { productId, rating, comment } = await req.json();

  if (!productId || !rating) {
    return NextResponse.json(
      { error: "productId and rating are required" },
      { status: 400 }
    );
  }

  await connectDB();

  try {
    const existing = await Review.findOne({
      product: productId,
      user: session.userId,
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }

    const review = await Review.create({
      product: productId,
      user: session.userId,
      rating,
      comment: comment || "",
    });

    // Recalculate product rating
    const allReviews = await Review.find({ product: productId });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
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

    // Broadcast to everyone watching this product
    const io = getIO();
    if (io) {
      // Everyone on the product page sees the new review live
      io.to(`product:${productId}`).emit("new_review", payload);
      // Global notification to ALL connected clients (other pages, admins)
      io.emit("review_notification", {
        productId,
        productName: (await Product.findById(productId).select("name").lean())?.name || "a product",
        userName: session.name || "Anonymous",
        rating,
        reviewId: payload._id,
      });
    }

    return NextResponse.json(payload, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
