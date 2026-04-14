import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

export async function PATCH(req: NextRequest) {
  return proxyToBackend(req, "/api/users/me");
}
