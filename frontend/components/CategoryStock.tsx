"use client";
import { useEffect, useState } from "react";

interface CategoryStockItem {
  category: string;
  stock: number;
}

const categoryIcons: Record<string, string> = {
  "t-shirts": "👕",
  "tshirts": "👕",
  "shirts": "👔",
  "jeans": "👖",
  "shorts": "🩳",
  "jackets": "🧥",
  "hoodies": "🧥",
  "dresses": "👗",
  "shoes": "👟",
  "accessories": "🧣",
};

function getIcon(category: string) {
  return categoryIcons[category.toLowerCase()] ?? "🏷️";
}

export default function CategoryStock() {
  const [items, setItems] = useState<CategoryStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.categoryStock) ? d.categoryStock : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const total = items.reduce((s, i) => s + i.stock, 0);

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Stock by Category</h2>

      {loading && <p className="text-xs text-gray-400 text-center py-4">Loading...</p>}
      {!loading && items.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">No products found.</p>
      )}

      <div className="flex flex-col gap-3">
        {items.map(({ category, stock }) => {
          const pct = total > 0 ? Math.round((stock / total) * 100) : 0;
          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{getIcon(category)}</span>
                  <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{stock} units</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-[#1a3a5c] h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {!loading && total > 0 && (
        <p className="text-xs text-gray-400 mt-4">Total stock: {total} units</p>
      )}
    </div>
  );
}
