"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

const allStatuses = ["All", "pending", "processing", "delivered", "cancelled", "returned"];
const PAGE_SIZE = 10;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter === "All"
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggle = (i: number) =>
    setSelected((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  const toggleAll = () =>
    setSelected(selected.length === paginated.length ? [] : paginated.map((_, i) => i));

  const pageNumbers: (number | string)[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1, 2, 3, "...", totalPages);
  }

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Orders List</h1>
          <p className="text-xs text-gray-400 mt-0.5">Home &gt; Order List</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] min-w-[160px] capitalize"
        >
          {allStatuses.map((s) => (
            <option key={s} value={s} className="capitalize">{s === "All" ? "All Statuses" : s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">
            Recent Purchases
            {!loading && <span className="ml-2 text-xs text-gray-400 font-normal">({filtered.length} orders)</span>}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 pr-4 text-left">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.length === paginated.length}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                {["Product", "Order ID", "Date", "Customer Name", "Status", "Amount"].map((h) => (
                  <th key={h} className="pb-3 pr-4 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 text-xs">Loading orders...</td>
                </tr>
              )}
              {!loading && paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 text-xs">No orders found.</td>
                </tr>
              )}
              {paginated.map((order, i) => {
                const productName = order.items[0]?.name ?? "—";
                const customerName = order.user?.name ?? "Guest";
                const initials = customerName.charAt(0).toUpperCase();
                const date = new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                });
                const statusKey = order.status.toLowerCase();
                return (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/orders/${order._id}`)}>
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(i)}
                        onChange={() => toggle(i)}
                        className="rounded"
                      />
                    </td>
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
                    <td className="py-3 text-gray-700 font-medium">${order.totalAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, i) => (
            <button
              key={i}
              onClick={() => typeof p === "number" && setPage(p)}
              disabled={p === "..."}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                p === page
                  ? "bg-[#1a3a5c] text-white"
                  : p === "..."
                  ? "text-gray-400 cursor-default"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 h-8 flex items-center justify-center rounded text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 ml-1 disabled:opacity-40"
          >
            NEXT »
          </button>
        </div>
      )}
    </div>
  );
}
