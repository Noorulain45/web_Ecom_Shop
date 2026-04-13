import type { Metadata } from "next";
import "./globals.css";
import NotificationProvider from "@/components/NotificationProvider";

export const metadata: Metadata = {
  title: "Arik Dashboard",
  description: "Admin Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
        {children}
        <NotificationProvider />
      </body>
    </html>
  );
}
