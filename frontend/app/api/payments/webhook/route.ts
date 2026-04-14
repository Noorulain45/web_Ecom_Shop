import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

// Stripe webhook MUST forward the raw body bytes + stripe-signature header
// Using proxyToBackend (which calls req.text()) can corrupt the raw buffer
// and cause Stripe signature verification to fail on the backend.
export async function POST(req: Request) {
  const rawBody = await req.arrayBuffer();
  const stripeSignature = req.headers.get("stripe-signature");

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/payments/webhook`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(stripeSignature ? { "stripe-signature": stripeSignature } : {}),
      },
      body: rawBody,
    });

    const resHeaders = new Headers();
    backendRes.headers.forEach((value, key) => resHeaders.append(key, value));

    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error("[webhook proxy] Cannot reach backend:", err?.message);
    return NextResponse.json({ error: "Backend unavailable." }, { status: 503 });
  }
}
