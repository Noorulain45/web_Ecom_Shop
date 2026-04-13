"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Link from "next/link";

interface ReviewNotif {
  productId: string;
  productName: string;
  userName: string;
  rating: number;
  reviewId: string;
}

export default function Topbar() {
  const router = useRouter();
  const [adminOpen, setAdminOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<ReviewNotif[]>([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io({ path: "/api/socket", transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register_role", "admin");
    });

    socket.on("review_notification", (data: ReviewNotif) => {
      setNotifications((prev) => [data, ...prev].slice(0, 20));
      setUnread((n) => n + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const openBell = () => {
    setBellOpen((v) => !v);
    setUnread(0);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-4 md:px-6 gap-4 pl-16 md:pl-6 relative">
      {/* Search */}
      <button className="text-gray-500 hover:text-gray-800">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
      </button>

      {/* Notification bell */}
      <div className="relative">
        <button
          onClick={openBell}
          className="relative text-gray-500 hover:text-gray-800"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Dropdown panel */}
        {bellOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Review Notifications</span>
              {notifications.length > 0 && (
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No notifications yet</p>
              ) : (
                notifications.map((n, i) => (
                  <Link
                    key={i}
                    href={`/store/product/${n.productId}`}
                    onClick={() => setBellOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0 text-base">
                      ⭐
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {n.userName} reviewed {n.productName}
                      </p>
                      <p className="text-xs text-yellow-500 mt-0.5">
                        {"★".repeat(n.rating)}{"☆".repeat(5 - n.rating)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin dropdown */}
      <div className="relative">
        <button
          onClick={() => setAdminOpen(!adminOpen)}
          className="flex items-center gap-2 border border-gray-300 rounded px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ADMIN
          <span className={`transition-transform text-xs ${adminOpen ? "rotate-180" : ""}`}>▾</span>
        </button>
        {adminOpen && (
          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded shadow-md z-50">
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</button>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100">Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}
