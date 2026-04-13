"use client";
import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import SaleGraph from "@/components/SaleGraph";
import BestSellers from "@/components/BestSellers";
import RecentOrders from "@/components/RecentOrders";
import CategoryStock from "@/components/CategoryStock";

interface Stats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  returnedOrders: number;
  totalRevenue: number;
}

const statConfig = [
  { key: "totalOrders" as const, title: "Total Orders", icon: "📦" },
  { key: "activeOrders" as const, title: "Active Orders", icon: "🔄" },
  { key: "completedOrders" as const, title: "Completed Orders", icon: "✅" },
  { key: "returnedOrders" as const, title: "Return Orders", icon: "↩️" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => { if (d.stats) setStats(d.stats); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-5 overflow-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Home &gt; Dashboard</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statConfig.map((c) => (
          <StatCard
            key={c.key}
            title={c.title}
            icon={c.icon}
            value={stats ? stats[c.key] : "—"}
          />
        ))}
      </div>

      {/* Revenue card */}
      <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 bg-[#1a3a5c] rounded-lg flex items-center justify-center text-white text-lg">💰</div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
          <p className="text-xl font-bold text-gray-900">
            {stats ? `$${stats.totalRevenue.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      {/* Graph + Best Sellers */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <SaleGraph />
        </div>
        <div className="w-full lg:w-72 shrink-0">
          <BestSellers />
        </div>
      </div>

      {/* Category Stock + Recent Orders */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-80 shrink-0">
          <CategoryStock />
        </div>
        <div className="flex-1 min-w-0">
          <RecentOrders />
        </div>
      </div>
    </div>
  );
}
