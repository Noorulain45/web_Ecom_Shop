"use client";
import { useState, useEffect } from "react";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  user?: { name?: string };
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 mb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-sm ${i < count ? "text-yellow-400" : "text-gray-300"}`}>★</span>
      ))}
    </div>
  );
}

export default function HappyCustomers() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [start, setStart] = useState(0);

  useEffect(() => {
    fetch("/api/reviews?limit=20")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReviews(data);
      })
      .catch(() => {});
  }, []);

  if (reviews.length === 0) return null;

  const visible = reviews.slice(start, start + 3);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black uppercase">Our Happy Customers</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setStart(Math.max(0, start - 1))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
            aria-label="Previous"
          >‹</button>
          <button
            onClick={() => setStart(Math.min(reviews.length - 3, start + 1))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
            aria-label="Next"
          >›</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 overflow-hidden">
        {visible.map((r) => (
          <div key={r._id} className="border border-gray-200 rounded-2xl p-5 md:p-6">
            <Stars count={r.rating} />
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-sm">{r.user?.name || "Customer"}</span>
              <span className="text-green-500 text-xs">✔</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">{r.comment}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
