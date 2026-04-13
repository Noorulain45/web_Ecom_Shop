import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const DASHBOARD_ROLES = ["admin", "superadmin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;

  // Protect /dashboard — admin & superadmin only
  if (pathname.startsWith("/dashboard")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const payload = await verifyToken(token);
    if (!payload || !DASHBOARD_ROLES.includes(payload.role))
      return NextResponse.redirect(new URL("/login", req.url));

    // Protect /dashboard/users — superadmin only
    if (pathname.startsWith("/dashboard/users") && payload.role !== "superadmin")
      return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect /store/cart and /store/checkout — any logged-in user
  if (pathname.startsWith("/store/cart") || pathname.startsWith("/store/checkout")) {
    if (!token) return NextResponse.redirect(new URL("/store/login", req.url));
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.redirect(new URL("/store/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/store/cart/:path*", "/store/checkout/:path*"],
};
