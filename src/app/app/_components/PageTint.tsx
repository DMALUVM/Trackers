"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Subtle per-page ambient gradient tint.
 * Adapts to light/dark mode automatically.
 */

type TintConfig = { dark: string; light: string };

const ROUTE_TINTS: Record<string, TintConfig> = {
  "/app/breathwork": {
    dark: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.06) 0%, transparent 70%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.06) 0%, transparent 70%)",
  },
  "/app/movement": {
    dark: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.05) 0%, transparent 70%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.05) 0%, transparent 70%)",
  },
  "/app/focus": {
    dark: "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.05) 0%, transparent 70%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.04) 0%, transparent 70%)",
  },
  "/app/biometrics": {
    dark: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 70%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.04) 0%, transparent 70%)",
  },
  "/app/routines/progress": {
    dark: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.04) 0%, transparent 70%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.04) 0%, transparent 70%)",
  },
  "/app/streaks": {
    dark: "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.05) 0%, transparent 70%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.04) 0%, transparent 70%)",
  },
  "/app/trophies": {
    dark: "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.06) 0%, transparent 70%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.05) 0%, transparent 70%)",
  },
  "/app/partner": {
    dark: "radial-gradient(ellipse at 50% 0%, rgba(244,114,182,0.05) 0%, transparent 70%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(244,114,182,0.04) 0%, transparent 70%)",
  },
  "/app/recovery": {
    dark: "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.05) 0%, transparent 70%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.04) 0%, transparent 70%)",
  },
  "/app/sleep": {
    dark: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.04) 0%, transparent 70%)",
  },
  "/app/mindfulness": {
    dark: "radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.05) 0%, transparent 70%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.04) 0%, transparent 70%)",
  },
};

function getTint(pathname: string, isDark: boolean): string | null {
  // Exact match first
  const config = ROUTE_TINTS[pathname];
  if (config) return isDark ? config.dark : config.light;
  // Prefix match
  for (const [route, cfg] of Object.entries(ROUTE_TINTS)) {
    if (pathname.startsWith(route)) return isDark ? cfg.dark : cfg.light;
  }
  return null;
}

export function PageTint() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const check = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDark(theme !== "light");
    };
    check();
    // Watch for theme changes
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const tint = getTint(pathname, isDark);
  if (!tint) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        background: tint,
        transition: "background 0.6s ease-out",
      }}
    />
  );
}
