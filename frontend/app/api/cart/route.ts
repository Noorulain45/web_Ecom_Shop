import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/api/cart");
}

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/api/cart");
}

export async function PATCH(req: NextRequest) {
  return proxyToBackend(req, "/api/cart");
}

export async function DELETE(req: NextRequest) {
  return proxyToBackend(req, "/api/cart");
}
