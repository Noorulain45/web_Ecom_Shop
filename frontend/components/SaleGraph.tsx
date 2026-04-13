"use client";
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

type Period = "weekly" | "monthly" | "yearly";

interface SalesPoint { name: string; sales: number; }
interface SalesData { weekly: SalesPoint[]; monthly: SalesPoint[]; yearly: SalesPoint[]; }

export default function SaleGraph() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [salesData, setSalesData] = useState<SalesData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => { if (d.salesData) setSalesData(d.salesData); })
      .catch(() => {});
  }, []);

  const current = salesData?.[period] ?? [];

  const data = {
    labels: current.map((d) => d.name),
    datasets: [
      {
        data: current.map((d) => d.sales),
        borderColor: "#1a3a5c",
        backgroundColor: "rgba(26,58,92,0.08)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => `$${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af", font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: "#f0f0f0" },
        ticks: {
          color: "#9ca3af",
          font: { size: 11 },
          callback: (v: string | number) => `$${v}`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Sale Graph</h2>
        <div className="flex gap-1">
          {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                period === p
                  ? "bg-[#1a3a5c] text-white border-[#1a3a5c]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="h-56">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}