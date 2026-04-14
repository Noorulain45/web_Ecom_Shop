"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "profile" | "orders" | "account";

type OrderItem = { name: string; quantity: number; price: number };
type Order = {
  _id: string;
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
};

type User = {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  loyaltyPoints?: number;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-gray-100 text-gray-600",
};

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Edit profile state
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { router.push("/store/login"); return; }
        if (data.role === "admin" || data.role === "superadmin") { router.push("/dashboard"); return; }
        setUser(data);
        setName(data.name || "");
        setAvatar(data.avatar || "");
      })
      .catch(() => router.push("/store/login"));
  }, [router]);

  useEffect(() => {
    if (tab === "orders" && orders.length === 0) {
      setLoadingOrders(true);
      fetch("/api/orders")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setOrders(Array.isArray(data) ? data : []))
        .catch(() => setOrders([]))
        .finally(() => setLoadingOrders(false));
    }
  }, [tab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveMsg(data.error || "Failed to save."); return; }
      setUser((prev) => prev ? { ...prev, name: data.name, avatar: data.avatar } : prev);
      setSaveMsg("Profile updated successfully.");
    } catch {
      setSaveMsg("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f0f1] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-black">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-6">
          {(["profile", "orders", "account"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-black text-white" : "text-gray-500 hover:text-black"
              }`}
            >
              {t === "profile" ? "Edit Profile" : t === "orders" ? "Order History" : "Account"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {tab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
                  placeholder="https://example.com/avatar.jpg"
                />
                {avatar && (
                  <img src={avatar} alt="Preview" className="mt-3 w-16 h-16 rounded-full object-cover border border-gray-200" />
                )}
              </div>

              {saveMsg && (
                <p className={`text-sm ${saveMsg.includes("success") ? "text-green-600" : "text-red-500"}`}>
                  {saveMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-black text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {tab === "orders" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Order History</h2>
              {loadingOrders ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-4 border-black border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold">{order.orderId}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric", month: "short", day: "numeric",
                            })}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm text-gray-600">
                            <span>{item.name} × {item.quantity}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                        <span className="text-xs text-gray-400">Total (incl. delivery)</span>
                        <span className="text-sm font-bold">${order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "account" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold mb-4">Account Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Name" value={user.name} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Role" value={user.role} />
                <InfoRow label="Loyalty Points" value={`⭐ ${user.loyaltyPoints ?? 0} pts`} />
              </div>

              {(user.loyaltyPoints ?? 0) < 500 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
                  You need <strong>{500 - (user.loyaltyPoints ?? 0)} more points</strong> to unlock loyalty rewards. Keep shopping!
                </div>
              )}

              {(user.loyaltyPoints ?? 0) >= 500 && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-700">
                  🎉 You've unlocked loyalty rewards! Enjoy exclusive discounts.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
