"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Per-page ambient gradient tint.
 * Instead of rendering an overlay div (which gets hidden behind ThemeGate's solid bg),
 * this injects the gradient directly onto the shell element via useEffect.
 */

type TintConfig = { dark: string; light: string };

const ROUTE_TINTS: Record<string, TintConfig> = {
  "/app/today": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 60%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 55%)",
  },
  "/app/breathwork": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.14) 0%, transparent 55%)",
  },
  "/app/movement": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 55%)",
  },
  "/app/focus": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 55%)",
  },
  "/app/biometrics": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.07) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.12) 0%, transparent 55%)",
  },
  "/app/routines/progress": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 55%)",
  },
  "/app/routines/edit": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.04) 0%, transparent 60%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 50%)",
  },
  "/app/streaks": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.06) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.12) 0%, transparent 55%)",
  },
  "/app/trophies": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.07) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.14) 0%, transparent 55%)",
  },
  "/app/partner": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(244,114,182,0.06) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(244,114,182,0.12) 0%, transparent 55%)",
  },
  "/app/recovery": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.06) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.12) 0%, transparent 55%)",
  },
  "/app/sleep": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 55%)",
  },
  "/app/mindfulness": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.06) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.12) 0%, transparent 55%)",
  },
  "/app/fitness": {
    dark:  "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.05) 0%, transparent 65%)",
    light: "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.10) 0%, transparent 55%)",
  },
};

function getTint(pathname: string, isDark: boolean): string | null {
  const config = ROUTE_TINTS[pathname];
  if (config) return isDark ? config.dark : config.light;
  for (const [route, cfg] of Object.entries(ROUTE_TINTS)) {
    if (pathname.startsWith(route)) return isDark ? cfg.dark : cfg.light;
  }
  return null;
}

export function PageTint() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const prefersDark = () =>
      typeof window !== "undefined" && (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true);

    const checkTheme = () => {
      try {
        const stored = localStorage.getItem("routines365:theme");
        if (stored === "light") setIsDark(false);
        else if (stored === "dark") setIsDark(true);
        else setIsDark(prefersDark());
      } catch { setIsDark(true); }
    };
    const checkTints = () => {
      try { setEnabled(localStorage.getItem("routines365:pageTints") !== "off"); }
      catch { setEnabled(true); }
    };

    checkTheme();
    checkTints();

    const onTheme = () => checkTheme();
    const onTints = () => checkTints();
    window.addEventListener("routines365:theme", onTheme);
    window.addEventListener("routines365:pageTints", onTints);
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystem = () => checkTheme();
    mq?.addEventListener?.("change", onSystem);

    return () => {
      window.removeEventListener("routines365:theme", onTheme);
      window.removeEventListener("routines365:pageTints", onTints);
      mq?.removeEventListener?.("change", onSystem);
    };
  }, []);

  // Apply tint directly to the shell element — avoids z-index issues entirely
  useEffect(() => {
    const el = document.getElementById("app-shell");
    if (!el) return;

    const tint = enabled ? getTint(pathname, isDark) : null;
    if (tint) {
      el.style.backgroundImage = tint;
    } else {
      el.style.backgroundImage = "none";
    }

    return () => { el.style.backgroundImage = "none"; };
  }, [pathname, isDark, enabled]);

  // This component renders nothing — it works entirely through side effects
  return null;
}
