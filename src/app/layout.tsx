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
        {/* Inline loading screen — shows INSTANTLY before JS hydrates.
            Removed by client JS once the app mounts. */}
        <div id="startup-loader" style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#0a0a0a",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: "16px",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 800, color: "#000",
            fontFamily: "system-ui, sans-serif",
          }}>R</div>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: "0.06em" }}>ROUTINES365</p>
            <p style={{ color: "#525252", fontSize: 12, marginTop: 6 }}>Stack your days. Change your life.</p>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes pulse-dot { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
            .startup-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.4); }
          ` }} />
          <div style={{ display: "flex", gap: 8 }}>
            <div className="startup-dot" style={{ animation: "pulse-dot 1s infinite" }} />
            <div className="startup-dot" style={{ animation: "pulse-dot 1s infinite 0.15s" }} />
            <div className="startup-dot" style={{ animation: "pulse-dot 1s infinite 0.3s" }} />
          </div>
        </div>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Remove startup loader once the page is interactive
              function removeLoader() {
                var el = document.getElementById('startup-loader');
                if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.2s'; setTimeout(function() { el.remove(); }, 250); }
              }
              // Remove on DOMContentLoaded (fastest) or after timeout (fallback)
              if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setTimeout(removeLoader, 100);
              } else {
                document.addEventListener('DOMContentLoaded', function() { setTimeout(removeLoader, 100); });
              }
              // Safety fallback — never show loader for more than 4 seconds
              setTimeout(removeLoader, 4000);

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
