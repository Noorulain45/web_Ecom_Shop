"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type OrderStatus = "pending" | "processing" | "delivered" | "cancelled" | "returned";

interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderId: string;
  user: { name: string; email: string } | null;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  returned: "bg-gray-100 text-gray-600",
};

const allStatuses: OrderStatus[] = ["pending", "processing", "delivered", "cancelled", "returned"];

const TAX_RATE = 0.1;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d._id) { setOrder(d); setStatus(d.status); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function saveStatus() {
    if (!order) return;
    setSaving(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
      setStatus(updated.status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 text-gray-400 text-sm">
        Loading order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 text-gray-400 text-sm">
        Order not found.
      </div>
    );
  }

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const createdDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const updatedDate = new Date(order.updatedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const customerName = order.user?.name ?? "Guest";
  const customerEmail = order.user?.email ?? "—";

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-900">Orders Details</h1>
        <p className="text-xs text-gray-400 mt-0.5">Home &gt; Order List &gt; Order Details</p>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 flex flex-col gap-6">

        {/* Order ID + status + controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base font-bold text-gray-900">Orders ID: {order.orderId}</h2>
            <span className={`px-3 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[order.status]}`}>
              {order.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#1a3a5c] capitalize"
            >
              {allStatuses.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
            <button
              onClick={saveStatus}
              disabled={saving || status === order.status}
              className="px-4 py-1.5 bg-[#1a3a5c] text-white text-sm font-medium rounded-lg hover:bg-[#15304d] disabled:opacity-40 transition-colors min-w-[60px]"
            >
              {saving ? "..." : saved ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* Date range */}
        <p className="text-xs text-gray-400 flex items-center gap-1.5 -mt-3">
          <span>📅</span>
          {createdDate} — {updatedDate}
        </p>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Customer */}
          <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-[#1a3a5c] rounded-lg flex items-center justify-center text-white text-sm">👤</div>
              <span className="text-sm font-semibold text-gray-800">Customer</span>
            </div>
            <p className="text-xs text-gray-500">Full Name: <span className="text-gray-700 font-medium">{customerName}</span></p>
            <p className="text-xs text-gray-500">Email: <span className="text-gray-700">{customerEmail}</span></p>
            <button
              onClick={() => router.push("/dashboard/users")}
              className="mt-2 w-full bg-[#1a3a5c] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#15304d] transition-colors"
            >
              View profile
            </button>
          </div>

          {/* Order Info */}
          <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-[#1a3a5c] rounded-lg flex items-center justify-center text-white text-sm">📦</div>
              <span className="text-sm font-semibold text-gray-800">Order Info</span>
            </div>
            <p className="text-xs text-gray-500">Shipping: <span className="text-gray-700">Standard</span></p>
            <p className="text-xs text-gray-500">Payment: <span className="text-gray-700">Online</span></p>
            <p className="text-xs text-gray-500">Status: <span className="text-gray-700 capitalize">{order.status}</span></p>
            <button className="mt-2 w-full bg-[#1a3a5c] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#15304d] transition-colors">
              Download info
            </button>
          </div>

          {/* Deliver to */}
          <div className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-[#1a3a5c] rounded-lg flex items-center justify-center text-white text-sm">🏠</div>
              <span className="text-sm font-semibold text-gray-800">Deliver to</span>
            </div>
            <p className="text-xs text-gray-700">Address on file</p>
            <button className="mt-auto w-full bg-[#1a3a5c] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#15304d] transition-colors">
              View profile
            </button>
          </div>
        </div>

        {/* Payment info + Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Payment Info</p>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="text-red-500 text-base">💳</span>
              Master Card **** **** **** 6601
            </p>
            <p className="text-xs text-gray-500 mt-1">Business name: {customerName}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Note</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Type some notes..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-[#1a3a5c]"
            />
          </div>
        </div>
      </div>

      {/* Products card */}
      <div className="bg-white rounded-xl shadow-sm p-5 md:p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Products</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 pr-4 w-6"></th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-gray-500">Product Name</th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-gray-500">Order ID</th>
                <th className="pb-3 pr-4 text-left text-xs font-medium text-gray-500">Quantity</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-3 pr-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-gray-300 text-lg">👕</div>
                      <span className="text-gray-700 font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{order.orderId}</td>
                  <td className="py-3 pr-4 text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-700 font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-64 flex flex-col gap-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Discount</span>
              <span>$0</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Shipping Rate</span>
              <span>$0</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2 mt-1">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
