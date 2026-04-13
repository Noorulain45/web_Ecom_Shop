import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/lib/models/Review";
import Product from "@/lib/models/Product";
import { getSession } from "@/lib/auth";

function getIO() {
  return (global as any).__io ?? null;
}

// DELETE /api/reviews/delete
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { reviewId } = await req.json();
  if (!reviewId) {
    return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
  }

  await connectDB();

  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (review.user.toString() !== session.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const productId = review.product.toString();
    await review.deleteOne();

    // Recalculate product rating
    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.length
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviews: allReviews.length,
    });

    const io = getIO();
    if (io) {
      io.to(`product:${productId}`).emit("delete_review", { reviewId });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
