"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type SessionUser = { name: string; email: string; role: string; loyaltyPoints?: number; avatar?: string } | null;

export default function Navbar() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<SessionUser>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));

    fetch("/api/cart")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.items) {
          setCartCount(data.items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0));
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    setMobileOpen(false);
    router.refresh();
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-black text-white text-center text-xs py-2 px-4">
        Get 20% off on your first order.{" "}
        <a href="#" className="underline font-semibold">Shop Now</a>
      </div>

      {/* Main nav */}
      <nav className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-gray-200 relative">
        {/* Hamburger (mobile) */}
        <button
          className="md:hidden text-gray-700 mr-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        <span className="text-xl font-extrabold tracking-tight">SHOP.CO</span>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <a href="#" className="hover:text-black">Men's</a>
          <a href="#" className="hover:text-black">Women's</a>
          <a href="#" className="hover:text-black">New Arrivals</a>
          <a href="#" className="hover:text-black">Sale</a>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop search */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-40 lg:w-48"
            />
          </div>

          {/* Cart */}
          <button aria-label="Cart" className="relative" onClick={() => router.push("/store/cart")}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M10 21a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm7 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {/* Account */}
          <div className="relative">
            <button aria-label="Account" onClick={() => user ? setMenuOpen(!menuOpen) : router.push("/store/login")}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1 1 18.88 17.804M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                </svg>
              )}
            </button>
            {user && menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                <p className="px-4 py-1 text-xs text-gray-400 truncate">{user.name}</p>
                <p className="px-4 pb-1 text-xs text-gray-400 truncate">{user.role}</p>
                {user.role === "user" && (
                  <p className="px-4 pb-2 text-xs font-semibold text-amber-600 border-b border-gray-100">
                    ⭐ {user.loyaltyPoints ?? 0} pts
                    {(user.loyaltyPoints ?? 0) < 500 && (
                      <span className="text-gray-400 font-normal"> · {500 - (user.loyaltyPoints ?? 0)} to unlock loyalty</span>
                    )}
                  </p>
                )}
                {["admin", "superadmin"].includes(user.role) && (
                  <button onClick={() => { router.push("/dashboard"); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                    Dashboard
                  </button>
                )}
                <button onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pb-4 flex flex-col gap-3">
          {/* Mobile search */}
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2 mt-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full"
            />
          </div>
          {["Men's", "Women's", "New Arrivals", "Sale"].map((link) => (
            <a key={link} href="#" className="text-sm font-medium text-gray-700 hover:text-black py-1"
              onClick={() => setMobileOpen(false)}>
              {link}
            </a>
          ))}
          {user ? (
            <>
              <p className="text-xs text-gray-400 border-t border-gray-100 pt-2">{user.name} · {user.role}</p>
              {user.role === "user" && (
                <p className="text-xs font-semibold text-amber-600">
                  ⭐ {user.loyaltyPoints ?? 0} pts
                  {(user.loyaltyPoints ?? 0) < 500 && ` · ${500 - (user.loyaltyPoints ?? 0)} to unlock loyalty`}
                </p>
              )}
              {["admin", "superadmin"].includes(user.role) && (
                <button onClick={() => { router.push("/dashboard"); setMobileOpen(false); }}
                  className="text-left text-sm text-gray-700 hover:text-black">Dashboard</button>
              )}
              <button onClick={handleLogout} className="text-left text-sm text-red-500">Sign Out</button>
            </>
          ) : (
            <a href="/store/login" className="text-sm font-medium text-black underline"
              onClick={() => setMobileOpen(false)}>Sign In</a>
          )}
        </div>
      )}
    </>
  );
}
