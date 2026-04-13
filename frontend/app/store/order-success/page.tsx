"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function OrderSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const pointsEarned = Number(params.get("pts") ?? 0);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.loyaltyPoints !== undefined) setTotalPoints(data.loyaltyPoints); })
      .catch(() => {});
  }, []);

  const isLoyaltyMember = (totalPoints ?? 0) >= 500;
  const justUnlocked = pointsEarned > 0 && isLoyaltyMember && (totalPoints ?? 0) - pointsEarned < 500;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-black uppercase mb-3">Order Placed!</h1>
        <p className="text-gray-500 mb-2">Thank you for your purchase.</p>
        {orderId && (
          <p className="text-sm text-gray-400 mb-6">
            Order ID: <span className="font-semibold text-black">{orderId}</span>
          </p>
        )}

        {/* Points earned card */}
        {pointsEarned > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5 mb-6 text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⭐</span>
              <p className="font-bold text-amber-800 text-base">
                +{pointsEarned} Loyalty Points Earned!
              </p>
            </div>
            {totalPoints !== null && (
              <p className="text-sm text-amber-700 mb-3">
                Your total: <span className="font-bold">{totalPoints} pts</span>
              </p>
            )}

            {justUnlocked ? (
              <div className="bg-amber-400 text-white rounded-xl px-4 py-2 text-sm font-semibold text-center">
                🏆 You just unlocked Loyalty Member status!
              </div>
            ) : isLoyaltyMember ? (
              <p className="text-xs text-amber-600">
                ✓ You&apos;re a Loyalty Member — exclusive products are unlocked for you.
              </p>
            ) : totalPoints !== null ? (
              <div>
                <div className="w-full bg-amber-200 rounded-full h-2 mb-1">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((totalPoints / 500) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-amber-600">
                  {500 - totalPoints} more points to unlock Loyalty Member status
                </p>
              </div>
            ) : null}
          </div>
        )}

        <a
          href="/store"
          className="inline-block bg-black text-white rounded-full px-8 py-3 text-sm font-semibold hover:bg-gray-800 transition"
        >
          Continue Shopping
        </a>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense>
      <OrderSuccessContent />
    </Suspense>
  );
}
