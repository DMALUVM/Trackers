import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Routines365 — Stack your days. Change your life.",
  description: "The daily habit tracker that keeps it simple. Check off your core habits, build streaks, and watch consistency compound.",
  applicationName: "Routines365",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://routines365.vercel.app"),
  openGraph: {
    title: "Routines365 — Stack your days. Change your life.",
    description: "The daily habit tracker that keeps it simple. Check off your core habits, build streaks, and watch consistency compound.",
    siteName: "Routines365",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Routines365",
    description: "Stack your days. Change your life.",
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
  other: {
    "apple-mobile-web-app-capable": "yes",
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
  return (
    <html lang="en" style={{ background: "#000" }}>
      <head>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${interTight.variable} antialiased`}
        style={{ fontFamily: "var(--font-inter-tight), system-ui, sans-serif" }}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
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
