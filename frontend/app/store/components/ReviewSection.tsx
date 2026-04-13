"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Stars } from "./ProductCard";

interface Review {
  _id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Props {
  productId: string;
  currentUserId?: string;
  currentUserName?: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="text-2xl transition"
          aria-label={`${star} star`}
        >
          <span className={(hovered || value) >= star ? "text-yellow-400" : "text-gray-300"}>★</span>
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ productId, currentUserId, currentUserName }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Fetch initial reviews from Next.js API
  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews/${productId}`)
      .then((r) => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        setReviews(
          data.map((r) => ({
            _id: r._id,
            userId: r.user?._id || r.userId || "",
            userName: r.user?.name || r.userName || "Anonymous",
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  // Socket.io — connects to the same Next.js server via /api/socket path
  useEffect(() => {
    const socket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      socket.emit("join_product", productId);
      console.log("[socket] connected, joined product:", productId);
    };

    const onDisconnect = () => {
      setConnected(false);
      console.log("[socket] disconnected");
    };

    const onNewReview = (review: Review) => {
      console.log("[socket] new_review received:", review);
      setReviews((prev) => {
        if (prev.find((r) => r._id === review._id)) return prev;
        return [review, ...prev];
      });
    };

    const onDeleteReview = ({ reviewId }: { reviewId: string }) => {
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_review", onNewReview);
    socket.on("delete_review", onDeleteReview);

    if (socket.connected) onConnect();

    return () => {
      socket.emit("leave_product", productId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_review", onNewReview);
      socket.off("delete_review", onDeleteReview);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit review");
        return;
      }
      setShowForm(false);
      setComment("");
      setRating(5);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!currentUserId) return;
    await fetch("/api/reviews/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          All Reviews
          <span className="text-gray-400 font-normal text-sm">({reviews.length})</span>
          <span
            className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-gray-300"}`}
            title={connected ? "Live" : "Connecting…"}
          />
        </h3>
        {currentUserId ? (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-black text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-800 transition"
          >
            {showForm ? "Cancel" : "Write a Review"}
          </button>
        ) : (
          <a
            href="/store/login"
            className="bg-black text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-800 transition"
          >
            Login to Review
          </a>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border border-gray-200 rounded-2xl p-6 mb-8 bg-gray-50"
        >
          <p className="font-semibold text-sm mb-3">Your Rating</p>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            rows={4}
            className="mt-4 w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
          />
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 bg-black text-white rounded-full px-6 py-2 text-sm font-medium hover:bg-gray-800 transition disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-400 text-sm">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div key={review._id} className="border border-gray-200 rounded-2xl p-6 relative">
              <Stars rating={review.rating} />
              <div className="flex items-center gap-2 mt-2 mb-2">
                <span className="font-semibold text-sm">{review.userName}</span>
                <span className="text-green-500 text-xs">✔</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-3">{review.comment}</p>
              <p className="text-gray-400 text-xs">
                Posted on{" "}
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {currentUserId === review.userId && (
                <button
                  onClick={() => handleDelete(review._id)}
                  className="absolute top-4 right-4 text-xs text-red-400 hover:text-red-600 transition"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
