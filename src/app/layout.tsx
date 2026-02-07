import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "routines365 — Stack your days. Change your life.",
  description: "The daily habit tracker that keeps it simple. Check off your core habits, build streaks, and watch consistency compound.",
  applicationName: "routines365",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://routines365.vercel.app"),
  openGraph: {
    title: "routines365 — Stack your days. Change your life.",
    description: "The daily habit tracker that keeps it simple. Check off your core habits, build streaks, and watch consistency compound.",
    siteName: "routines365",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "routines365",
    description: "Stack your days. Change your life.",
  },
  appleWebApp: {
    capable: true,
    title: "routines365",
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
        {/* Apple splash: black background prevents white flash on PWA launch */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
