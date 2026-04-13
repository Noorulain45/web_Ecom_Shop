"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
}

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

const DELIVERY_FEE = 15;

function buildImageUrl(img: string) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `/${img}`;
}

export default function CartClient() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401) {
        router.push("/store/login");
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateQty(productId: string, newQty: number) {
    setUpdating(productId);
    try {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: newQty }),
      });
      if (newQty <= 0) {
        setItems((prev) => prev.filter((i) => i.product._id !== productId));
      } else {
        setItems((prev) =>
          prev.map((i) => i.product._id === productId ? { ...i, quantity: newQty } : i)
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(productId: string) {
    setUpdating(productId);
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setItems((prev) => prev.filter((i) => i.product._id !== productId));
    } finally {
      setUpdating(null);
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = promoApplied ? Math.round(subtotal * 0.2) : 0;
  const total = subtotal - discount + DELIVERY_FEE;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 pb-16 pt-8 text-center text-gray-400 text-sm">
        Loading your cart...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
      <h1 className="text-3xl md:text-4xl font-black uppercase mb-6 md:mb-8">Your Cart</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cart items */}
        <div className="flex-1 border border-gray-200 rounded-2xl divide-y divide-gray-200">
          {items.length === 0 && (
            <div className="p-12 text-center text-gray-400 text-sm">
              Your cart is empty.{" "}
              <a href="/store" className="text-black underline">Continue shopping</a>
            </div>
          )}
          {items.map((item) => {
            const imgSrc = buildImageUrl(item.product.images?.[0]);
            const isUpdating = updating === item.product._id;
            return (
              <div key={item.product._id} className={`flex items-center gap-4 p-5 transition-opacity ${isUpdating ? "opacity-50" : ""}`}>
                {/* Product image */}
                <div className="w-24 h-24 bg-[#f0eeed] rounded-xl shrink-0 overflow-hidden relative">
                  {imgSrc ? (
                    <Image src={imgSrc} alt={item.product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">{item.product.name}</p>
                    <button
                      onClick={() => removeItem(item.product._id)}
                      disabled={isUpdating}
                      className="text-red-400 hover:text-red-600 shrink-0 disabled:opacity-40"
                      aria-label="Remove item"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-base">${(item.price * item.quantity).toFixed(2)}</span>
                    {/* Qty stepper */}
                    <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 gap-3">
                      <button
                        onClick={() => updateQty(item.product._id, item.quantity - 1)}
                        disabled={isUpdating}
                        className="text-lg font-bold leading-none w-5 h-5 flex items-center justify-center disabled:opacity-40"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product._id, item.quantity + 1)}
                        disabled={isUpdating}
                        className="text-lg font-bold leading-none w-5 h-5 flex items-center justify-center disabled:opacity-40"
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-bold text-lg">Order Summary</h2>

            <div className="flex flex-col gap-3 text-sm border-b border-gray-200 pb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discount {promoApplied ? "(-20%)" : ""}</span>
                <span className={promoApplied ? "font-semibold text-red-500" : "font-semibold"}>
                  {promoApplied ? `-$${discount.toFixed(2)}` : "-$0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="font-semibold">${DELIVERY_FEE}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {/* Promo code */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2.5 gap-2">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
                </svg>
                <input
                  type="text"
                  placeholder="Add promo code"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full"
                />
              </div>
              <button
                onClick={() => { if (promo.trim()) setPromoApplied(true); }}
                className="bg-black text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-gray-800 transition"
              >
                Apply
              </button>
            </div>

            <a
              href="/store/checkout"
              className="w-full bg-black text-white rounded-full py-3.5 text-sm font-semibold text-center hover:bg-gray-800 transition flex items-center justify-center gap-2"
            >
              Go to Checkout →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
