"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Per-page ambient gradient tint — dark mode only.
 * Sets the --page-tint CSS variable on .theme-shell.
 * CSS handles the layering: background: var(--page-tint, none), var(--bg-primary);
 * No z-index battles, no inline style conflicts — just a CSS variable swap.
 */

const ROUTE_TINTS: Record<string, string> = {
  "/app/today":             "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.10) 0%, transparent 65%)",
  "/app/breathwork":        "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.14) 0%, transparent 65%)",
  "/app/movement":          "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 65%)",
  "/app/focus":             "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 65%)",
  "/app/biometrics":        "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.12) 0%, transparent 65%)",
  "/app/routines/progress": "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.10) 0%, transparent 65%)",
  "/app/routines/edit":     "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)",
  "/app/streaks":           "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.12) 0%, transparent 65%)",
  "/app/trophies":          "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.14) 0%, transparent 65%)",
  "/app/partner":           "radial-gradient(ellipse at 50% 0%, rgba(244,114,182,0.12) 0%, transparent 65%)",
  "/app/recovery":          "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.12) 0%, transparent 65%)",
  "/app/sleep":             "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 65%)",
  "/app/mindfulness":       "radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.12) 0%, transparent 65%)",
  "/app/fitness":           "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.10) 0%, transparent 65%)",
};

function getTint(pathname: string): string | null {
  if (ROUTE_TINTS[pathname]) return ROUTE_TINTS[pathname];
  for (const [route, tint] of Object.entries(ROUTE_TINTS)) {
    if (pathname.startsWith(route)) return tint;
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

  // Set --page-tint CSS variable on the .theme-shell element
  useEffect(() => {
    const el = document.querySelector(".theme-shell") as HTMLElement | null;
    if (!el) return;

    const tint = (enabled && isDark) ? getTint(pathname) : null;
    if (tint) {
      el.style.setProperty("--page-tint", tint);
    } else {
      el.style.removeProperty("--page-tint");
    }

    return () => { el.style.removeProperty("--page-tint"); };
  }, [pathname, isDark, enabled]);

  return null;
}
