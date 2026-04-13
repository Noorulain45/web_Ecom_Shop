import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return proxyToBackend(req, `/api/reviews/${productId}`);
}
