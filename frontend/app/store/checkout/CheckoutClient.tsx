"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// 100 loyalty points = $1
const POINTS_PER_DOLLAR_REDEMPTION = 100;

// Load Stripe outside of component render to avoid recreating on every render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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

// ─── Inner form — has access to Stripe hooks ──────────────────────────────────
function PaymentForm({
  subtotal,
  total,
  loyaltyPoints,
}: {
  subtotal: number;
  total: number;
  loyaltyPoints: number;
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const pointsRequired = Math.ceil(total * POINTS_PER_DOLLAR_REDEMPTION);
  const canUsePoints = loyaltyPoints >= pointsRequired;

  async function handlePayWithPoints() {
    setPlacing(true);
    setError("");
    try {
      const res = await fetch("/api/payments/use-points", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not place order with loyalty points.");
        return;
      }
      router.push(`/store/order-success?ref=points&orderId=${data.orderId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  async function handlePay() {
    if (!stripe || !elements) return;
    setPlacing(true);
    setError("");

    try {
      // 1. Ask our backend to create a PaymentIntent and return the client_secret
      const intentRes = await fetch("/api/payments/create-intent", {
        method: "POST",
      });
      const intentData = await intentRes.json();
      if (!intentRes.ok) {
        setError(intentData.error || "Could not initiate payment.");
        return;
      }

      // 2. Confirm the card payment directly with Stripe using the client_secret
      //    Stripe handles 3D Secure / SCA challenges automatically here
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(intentData.clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        });

      if (stripeError) {
        setError(stripeError.message || "Payment failed.");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Confirm with our backend — saves Order + Payment to DB
        const confirmRes = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
        const confirmData = await confirmRes.json();
        console.log("[checkout] confirm response:", confirmRes.status, confirmData);

        if (!confirmRes.ok) {
          setError(confirmData.error || "Payment succeeded but order could not be saved.");
          return;
        }

        router.push(`/store/order-success?ref=${paymentIntent.id}&orderId=${confirmData.orderId}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  return (
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

        {/* Loyalty points option */}
        {canUsePoints ? (
          <div className="flex flex-col gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
              <p className="font-semibold text-amber-800">🎉 You have {loyaltyPoints.toLocaleString()} loyalty points</p>
              <p className="text-amber-700 mt-0.5">
                That covers this order ({pointsRequired.toLocaleString()} pts needed). Pay instantly — no card required.
              </p>
            </div>
            <button
              onClick={handlePayWithPoints}
              disabled={placing}
              className="w-full bg-amber-500 text-white rounded-full py-3.5 text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {placing ? "Placing order..." : `Use ${pointsRequired.toLocaleString()} Loyalty Points →`}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="flex-1 h-px bg-gray-200" />
              <span>or pay with card</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </div>
        ) : loyaltyPoints > 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
            You have {loyaltyPoints.toLocaleString()} pts — need {pointsRequired.toLocaleString()} pts to cover this order.
          </div>
        ) : null}

        {/* Stripe card input */}
        <div className="border border-gray-200 rounded-xl px-4 py-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#111",
                  "::placeholder": { color: "#9ca3af" },
                },
                invalid: { color: "#ef4444" },
              },
            }}
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          onClick={handlePay}
          disabled={placing || !stripe}
          className="w-full bg-black text-white rounded-full py-3.5 text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {placing ? "Processing..." : `Pay $${total.toFixed(2)} →`}
        </button>

        <a
          href="/store/cart"
          className="text-center text-sm text-gray-500 hover:text-black underline"
        >
          ← Back to Cart
        </a>
      </div>
    </div>
  );
}

// ─── Outer component — wraps everything in <Elements> ─────────────────────────
export default function CheckoutClient() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/cart").then((r) => {
        if (r.status === 401) { router.push("/store/login"); return null; }
        return r.json();
      }),
      fetch("/api/auth/me").then((r) => r.ok ? r.json() : null),
    ])
      .then(([cartData, meData]) => {
        if (cartData) setItems(cartData.items || []);
        if (meData?.loyaltyPoints) setLoyaltyPoints(meData.loyaltyPoints);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 pb-16 pt-8 text-center text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-8 pb-16 pt-8 text-center text-gray-400 text-sm">
        Your cart is empty.{" "}
        <a href="/store" className="text-black underline">
          Continue shopping
        </a>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <h1 className="text-3xl md:text-4xl font-black uppercase mb-8">
          Checkout
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Order items */}
          <div className="flex-1">
            <h2 className="font-bold text-lg mb-4">Order Summary</h2>
            <div className="border border-gray-200 rounded-2xl divide-y divide-gray-200">
              {items.map((item) => {
                const imgSrc = buildImageUrl(item.product.images?.[0]);
                return (
                  <div
                    key={item.product._id}
                    className="flex items-center gap-4 p-5"
                  >
                    <div className="w-20 h-20 bg-[#f0eeed] rounded-xl shrink-0 overflow-hidden relative">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {item.product.name}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-sm">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment form */}
          <PaymentForm subtotal={subtotal} total={total} loyaltyPoints={loyaltyPoints} />
        </div>
      </div>
    </Elements>
  );
}
