"use client";
import { useState, useEffect } from "react";

interface OrderItem {
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
  status: string;
  createdAt: string;
}

const statusStyle: Record<string, string> = {
  pending: "text-yellow-600",
  processing: "text-blue-500",
  delivered: "text-green-600",
  cancelled: "text-red-500",
  returned: "text-gray-500",
};

const statusDot: Record<string, string> = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  returned: "bg-gray-400",
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  async function deleteOrder(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) setOrders((prev) => prev.filter((o) => o._id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Recent Orders</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Product", "Order ID", "Date", "Customer", "Status", "Amount", ""].map((h, i) => (
                <th key={i} className="pb-3 pr-4 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">Loading...</td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">No orders yet.</td>
              </tr>
            )}
            {orders.map((order) => {
              const productName = order.items[0]?.name ?? "—";
              const customerName = order.user?.name ?? "Guest";
              const initials = customerName.charAt(0).toUpperCase();
              const date = new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              });
              const statusKey = order.status.toLowerCase();
              const isDeleting = deleting === order._id;
              return (
                <tr key={order._id} className={`border-b border-gray-50 hover:bg-gray-50 transition-opacity ${isDeleting ? "opacity-40" : ""}`}>
                  <td className="py-3 pr-4 text-gray-600">{productName}</td>
                  <td className="py-3 pr-4 text-gray-500">{order.orderId}</td>
                  <td className="py-3 pr-4 text-gray-500">{date}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white">
                        {initials}
                      </div>
                      <span className="text-gray-700">{customerName}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusDot[statusKey] ?? "bg-gray-400"}`}></span>
                      <span className={`text-xs font-medium capitalize ${statusStyle[statusKey] ?? "text-gray-500"}`}>{order.status}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-700 font-medium">${order.totalAmount.toFixed(2)}</td>
                  <td className="py-3">
                    <button
                      onClick={() => deleteOrder(order._id)}
                      disabled={isDeleting}
                      className="text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                      title="Delete order"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
