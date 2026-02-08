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
        {/* Startup loader — injected via script so it's OUTSIDE React's virtual DOM.
            This prevents the insertBefore/removeChild hydration crash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var d = document, b = d.body || d.documentElement;
                var el = d.createElement('div');
                el.id = 'startup-loader';
                el.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0a0a0a;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;';
                el.innerHTML = '<div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:#000;font-family:system-ui,sans-serif">R</div>'
                  + '<div style="text-align:center"><p style="color:#fff;font-size:18px;font-weight:700;letter-spacing:0.06em">ROUTINES365</p><p style="color:#525252;font-size:12px;margin-top:6px">Stack your days. Change your life.</p></div>'
                  + '<style>@keyframes pd{0%,100%{opacity:.3}50%{opacity:1}}.sd{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.4)}</style>'
                  + '<div style="display:flex;gap:8px"><div class="sd" style="animation:pd 1s infinite"></div><div class="sd" style="animation:pd 1s infinite .15s"></div><div class="sd" style="animation:pd 1s infinite .3s"></div></div>';
                function insert() { (d.body || d.documentElement).prepend(el); }
                if (d.body) insert(); else d.addEventListener('DOMContentLoaded', insert);
                function remove() {
                  var l = d.getElementById('startup-loader');
                  if (l) { l.style.opacity='0'; l.style.transition='opacity 0.2s'; setTimeout(function(){l.remove()},250); }
                }
                if (d.readyState==='complete'||d.readyState==='interactive') setTimeout(remove,100);
                else d.addEventListener('DOMContentLoaded',function(){setTimeout(remove,100)});
                setTimeout(remove,4000);
              })();
            `,
          }}
        />
      </head>
      <body className={`${interTight.variable} antialiased`}
        style={{ fontFamily: "var(--font-inter-tight), system-ui, sans-serif" }}
        suppressHydrationWarning>
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
