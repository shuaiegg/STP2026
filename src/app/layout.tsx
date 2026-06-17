import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Plus_Jakarta_Sans, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { CSPostHogProvider } from "@/components/providers/PostHogProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";
import { JsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com'),
  title: "ScaletoTop | Digital Marketing Engineering",
  description: "Digital Marketing Engineering Platform",
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // [locale] 段内返回 URL locale；段外（dashboard 等）回落 defaultLocale
  const locale = await getLocale();
  const htmlLang = locale === 'zh' ? 'zh-Hans' : 'en';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com';

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ScaletoTop",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo-512.png`,
      "width": 512,
      "height": 512
    },
    "sameAs": [
      "https://twitter.com/jack_scaletotop",
      "https://www.linkedin.com/company/scaletotop"
    ],
    "inLanguage": htmlLang
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ScaletoTop",
    "url": baseUrl,
    "inLanguage": htmlLang
  };

  return (
    <html lang={htmlLang} className={`${plusJakartaSans.variable} ${instrumentSans.variable} ${jetBrainsMono.variable}`}>
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body className="antialiased text-brand-text-primary bg-brand-background">
        <SessionProvider>
          <CSPostHogProvider locale={locale}>
            {children}
          </CSPostHogProvider>
        </SessionProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
