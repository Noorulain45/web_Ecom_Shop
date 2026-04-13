"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

export default function CheckoutClient() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => {
        if (r.status === 401) { router.push("/store/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setItems(data.items || []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [router]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  async function placeOrder() {
    setPlacing(true);
    setError("");
    try {
      const res = await fetch("/api/orders", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to place order.");
        return;
      }
      router.push(`/store/order-success?orderId=${data.orderId}&pts=${data.pointsEarned ?? 0}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-8 pb-16 pt-8 text-center text-gray-400 text-sm">Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-8 pb-16 pt-8 text-center text-gray-400 text-sm">
        Your cart is empty.{" "}
        <a href="/store" className="text-black underline">Continue shopping</a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
      <h1 className="text-3xl md:text-4xl font-black uppercase mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Order items */}
        <div className="flex-1">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <div className="border border-gray-200 rounded-2xl divide-y divide-gray-200">
            {items.map((item) => {
              const imgSrc = buildImageUrl(item.product.images?.[0]);
              return (
                <div key={item.product._id} className="flex items-center gap-4 p-5">
                  <div className="w-20 h-20 bg-[#f0eeed] rounded-xl shrink-0 overflow-hidden relative">
                    {imgSrc ? (
                      <Image src={imgSrc} alt={item.product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.product.name}</p>
                    <p className="text-gray-500 text-xs mt-1">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment summary */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-bold text-lg">Payment Details</h2>

            <div className="flex flex-col gap-3 text-sm border-b border-gray-200 pb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
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

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full bg-black text-white rounded-full py-3.5 text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {placing ? "Placing Order..." : "Place Order →"}
            </button>

            <a
              href="/store/cart"
              className="text-center text-sm text-gray-500 hover:text-black underline"
            >
              ← Back to Cart
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
