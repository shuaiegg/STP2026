import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import "./globals.css";

// Configure fonts if needed, or rely on CSS imports in globals.css
// Keeping it simple as per legacy migration

export const metadata: Metadata = {
  title: "ScaletoTop | Digital Marketing Engineering",
  description: "Digital Marketing Engineering Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans">
      <body className="antialiased text-brand-text-primary bg-brand-background">
        {children}
      </body>
    </html>
  );
}
