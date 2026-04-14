"use client";
import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe() {
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="bg-black text-white rounded-2xl px-6 md:px-10 py-8 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <h2 className="text-xl md:text-2xl font-black uppercase leading-tight text-center md:text-left md:max-w-xs">
          Stay Upto Date About Our Latest Offers
        </h2>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {subscribed ? (
            <div className="flex items-center gap-2 bg-green-500 text-white rounded-full px-4 py-2.5 text-sm font-semibold justify-center">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Successfully subscribed to our newsletter!
            </div>
          ) : (
            <>
              <div className="flex items-center bg-white rounded-full px-4 py-2.5 gap-2">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                  className="bg-transparent text-black text-sm outline-none w-full"
                />
              </div>
              <button
                onClick={handleSubscribe}
                className="bg-white text-black rounded-full py-2.5 text-sm font-semibold hover:bg-gray-100 transition"
              >
                Subscribe to Newsletter
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
