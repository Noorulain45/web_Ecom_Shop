"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

interface BestSeller {
  _id: string;
  name: string;
  price: number;
  sales: number;
  images: string[];
}

export default function BestSellers() {
  const [items, setItems] = useState<BestSeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.bestSellers) ? d.bestSellers : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Best Sellers</h2>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {loading && <p className="text-xs text-gray-400 text-center py-4">Loading...</p>}
        {!loading && items.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No data yet.</p>
        )}
        {items.map((item) => (
          <div key={item._id} className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-md flex-shrink-0 relative overflow-hidden">
              {item.images?.[0] ? (
                <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">👕</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
              <p className="text-xs text-gray-400">{item.sales} sales</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800">${item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
