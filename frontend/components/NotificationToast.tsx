"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";

interface ReviewNotification {
  id: string;
  productId: string;
  productName: string;
  userName: string;
  rating: number;
  reviewId: string;
  at: number;
}

interface Props {
  userRole?: string; // pass "admin" | "superadmin" | "user" | undefined
}

export default function NotificationToast({ userRole }: Props) {
  const [toasts, setToasts] = useState<ReviewNotification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
    const socket = io(BACKEND_URL, { path: "/api/socket", transports: ["websocket", "polling"], withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Register role so server can put admins in the admins room
      if (userRole) socket.emit("register_role", userRole);
    });

    socket.on("review_notification", (data: Omit<ReviewNotification, "id" | "at">) => {
      const toast: ReviewNotification = {
        ...data,
        id: Math.random().toString(36).slice(2),
        at: Date.now(),
      };
      setToasts((prev) => [...prev.slice(-4), toast]); // keep max 5

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 6000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userRole]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white border border-gray-200 rounded-2xl shadow-xl px-4 py-3 flex items-start gap-3 animate-slide-in"
        >
          {/* Icon */}
          <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center shrink-0 text-lg">
            ⭐
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              New review on{" "}
              <Link
                href={`/store/product/${toast.productId}`}
                className="underline hover:text-black"
              >
                {toast.productName}
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-medium text-gray-700">{toast.userName}</span> rated it{" "}
              {"★".repeat(toast.rating)}{"☆".repeat(5 - toast.rating)}
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
