import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Routines365 — Daily Habit Tracker with Streaks, Journaling & Breathwork",
    template: "%s | Routines365",
  },
  description: "Build daily habits that stick. Track streaks, journal with guided prompts, practice breathwork, connect Apple Health, and watch consistency compound. Free with premium.",
  applicationName: "Routines365",
  manifest: "/manifest.json",
  metadataBase: new URL("https://routines365.com"),
  alternates: {
    canonical: "https://routines365.com",
  },
  openGraph: {
    title: "Routines365 — Daily Habit Tracker with Streaks, Journaling & Breathwork",
    description: "Build daily habits that stick. Track streaks, journal with guided prompts, practice breathwork, connect Apple Health, and watch consistency compound.",
    siteName: "Routines365",
    type: "website",
    url: "https://routines365.com",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Routines365 — Stack your days. Change your life.",
    description: "Daily habit tracker with streaks, guided journal, breathwork, Apple Health, and accountability partner. 10 seconds a day.",
  },
  appleWebApp: {
    capable: true,
    title: "Routines365",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/brand/pwa/icon-192.png",
    apple: "/brand/pwa/apple-touch-icon.png",
  },
  keywords: [
    "habit tracker", "daily routine", "streak tracker", "habit journal",
    "breathwork app", "Wim Hof breathing", "box breathing",
    "Apple Health habits", "morning routine", "daily checklist",
    "accountability partner", "focus timer", "Pomodoro",
    "gratitude journal", "Qigong app", "wellness tracker",
    "HRV tracking", "sleep tracking", "habit streaks",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-itunes-app": "app-id=XXXXXXXXXX",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Routines365",
    applicationCategory: "HealthApplication",
    operatingSystem: "iOS",
    description: "Daily habit tracker with streaks, guided journal, breathwork, Apple Health integration, and accountability partner.",
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free with optional premium upgrade",
      },
      {
        "@type": "Offer",
        price: "3.99",
        priceCurrency: "USD",
        description: "Routines365 Premium Monthly",
      },
      {
        "@type": "Offer",
        price: "29.99",
        priceCurrency: "USD",
        description: "Routines365 Premium Annual",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      ratingCount: "1",
    },
  };

  return (
    <html lang="en" style={{ background: "#000" }}>
      <head>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${interTight.variable} antialiased`}
        style={{ fontFamily: "var(--font-inter-tight), system-ui, sans-serif" }}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && !window.Capacitor) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
