/**
 * Forwards a Next.js API request to the backend Express server.
 * Preserves cookies, method, body, and returns the backend response.
 */
export async function proxyToBackend(
  req: Request,
  backendPath: string
): Promise<Response> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const url = new URL(req.url);
  const targetUrl = `${backendUrl}${backendPath}${url.search}`;

  const headers = new Headers();
  // Forward content-type and cookie
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const isFormData = contentType?.includes("multipart/form-data");

  const init: RequestInit = {
    method: req.method,
    headers,
    // Don't set body for GET/HEAD
    ...(req.method !== "GET" && req.method !== "HEAD"
      ? { body: isFormData ? await req.formData() : await req.text() }
      : {}),
  };

  const backendRes = await fetch(targetUrl, init);

  // Build response, forwarding Set-Cookie headers
  const resHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    resHeaders.append(key, value);
  });

  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: resHeaders,
  });
}
