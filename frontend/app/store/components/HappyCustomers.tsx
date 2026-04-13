"use client";
import { useState } from "react";

const reviews = [
  {
    name: "Sarah M.",
    rating: 5,
    text: "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations.",
  },
  {
    name: "Alex K.",
    rating: 5,
    text: "Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable.",
  },
  {
    name: "James L.",
    rating: 5,
    text: "As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends.",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 mb-2">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-yellow-400 text-sm">★</span>
      ))}
    </div>
  );
}

export default function HappyCustomers() {
  const [start, setStart] = useState(0);

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
            onClick={() => setStart(Math.min(reviews.length - 1, start + 1))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
            aria-label="Next"
          >›</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 overflow-hidden">
        {reviews.slice(start, start + 3).map((r) => (
          <div key={r.name} className="border border-gray-200 rounded-2xl p-5 md:p-6">
            <Stars count={r.rating} />
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-sm">{r.name}</span>
              <span className="text-green-500 text-xs">✔</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
