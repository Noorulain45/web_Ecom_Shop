"use client";
import { useEffect, useState } from "react";
import NotificationToast from "./NotificationToast";

export default function NotificationProvider() {
  const [role, setRole] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setRole(data?.role);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <NotificationToast userRole={role} />;
}
