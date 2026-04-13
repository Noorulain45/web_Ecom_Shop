"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const baseNavItems = [
  { label: "Dashboard", icon: "▦", href: "/dashboard" },
  { label: "All Products", icon: "🛍", href: "/dashboard/products" },
  { label: "Order List", icon: "📋", href: "/dashboard/orders" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.role ?? null))
      .catch(() => {});
  }, []);

  const navItems = [
    ...baseNavItems,
    ...(role === "superadmin"
      ? [{ label: "Users", icon: "👥", href: "/dashboard/users" }]
      : []),
  ];

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 bg-[#1a3a5c] px-4 shrink-0">
        <Image src="/logo.png" alt="Arik Logo" width={100} height={36} className="object-contain" />
      </div>

      {/* Nav */}
      <nav className="flex flex-col mt-2 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
              pathname === item.href ? "bg-[#1a3a5c] text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white border border-gray-200 rounded-lg p-2 shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed top-0 left-0 h-full w-52 bg-white flex flex-col border-r border-gray-200 z-50 transition-transform duration-200 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 min-h-screen bg-white flex-col border-r border-gray-200 shrink-0">
        {navContent}
      </aside>
    </>
  );
}
