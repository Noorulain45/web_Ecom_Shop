import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/**
 * Forwards a Next.js API request to the backend Express server.
 * Returns a graceful 503 if the backend is unreachable.
 */
export async function proxyToBackend(
  req: Request,
  backendPath: string
): Promise<Response> {
  const url = new URL(req.url);
  const targetUrl = `${BACKEND_URL}${backendPath}${url.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const isFormData = contentType?.includes("multipart/form-data");

  const init: RequestInit = {
    method: req.method,
    headers,
    ...(req.method !== "GET" && req.method !== "HEAD"
      ? { body: isFormData ? await req.formData() : await req.text() }
      : {}),
  };

  try {
    const backendRes = await fetch(targetUrl, init);

    const resHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      resHeaders.append(key, value);
    });

    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    // Backend is down or unreachable
    console.error(`[proxy] Cannot reach backend at ${targetUrl}:`, err?.cause?.code ?? err?.message);
    return NextResponse.json(
      { error: "Backend service unavailable. Please ensure the backend is running on port 4000." },
      { status: 503 }
    );
  }
}
