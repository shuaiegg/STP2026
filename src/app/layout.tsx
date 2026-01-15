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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased text-brand-text-primary bg-brand-background">
        {children}
      </body>
    </html>
  );
}
