"use client";
import { useState, useEffect, useCallback } from "react";
import AddProductModal from "@/components/AddProductModal";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  images: string[];
  isNewArrival: boolean;
  isTopSelling: boolean;
}

export default function AllProductsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-5">
      {showModal && (
        <AddProductModal onClose={() => setShowModal(false)} onSuccess={fetchProducts} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">All Products</h1>
          <p className="text-xs text-gray-400 mt-0.5">Home &gt; All Products</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-black text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Add New Product
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <p className="text-sm">No products yet.</p>
          <p className="text-xs">Click "Add New Product" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              onClick={() => router.push(`/dashboard/products/${product._id}`)}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square bg-gray-100">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0].replace("/upload/", "/upload/w_400,q_auto,f_auto/")}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm text-gray-800 truncate">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-sm">${product.price}</span>
                  <span className="text-xs text-gray-400">Stock: {product.stock}</span>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {product.isNewArrival && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">New</span>
                  )}
                  {product.isTopSelling && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Top</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
