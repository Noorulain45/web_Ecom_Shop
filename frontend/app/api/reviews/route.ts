import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/api/reviews");
}

export async function DELETE(req: NextRequest) {
  return proxyToBackend(req, "/api/reviews");
}
