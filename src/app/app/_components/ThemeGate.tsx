"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getUserSettings, getUserSettingsSync } from "@/lib/supabaseData";

type Theme = "system" | "dark" | "light";

function prefersDark() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true;
}

function resolveTheme(t: Theme): "dark" | "light" {
  return t === "system" ? (prefersDark() ? "dark" : "light") : t;
}

// Solid tinted backgrounds — dark mode only
// Derived from each screen's accent color in the App Store mockups
// Toggle OFF = pure black #0a0a0a
const PAGE_BG: Record<string, string> = {
  "/app/today":             "#0a2e1c", // from mockup green (#10b981)
  "/app/breathwork":        "#082c3a", // from mockup cyan (#06b6d4)
  "/app/movement":          "#0a2e1c", // from mockup green (#10b981)
  "/app/focus":             "#2c2208", // from amber (#f59e0b)
  "/app/biometrics":        "#1a1038", // from mockup purple (#a855f7)
  "/app/routines/progress": "#0c1a38", // from mockup blue (#3b82f6)
  "/app/routines/edit":     "#0c1a38", // from mockup blue
  "/app/streaks":           "#2c2808", // from mockup gold (#eab308)
  "/app/trophies":          "#2c2808", // from mockup gold
  "/app/partner":           "#380e2e", // from pink (#f472b6)
  "/app/recovery":          "#082c28", // from teal (#14b8a6)
  "/app/sleep":             "#101240", // from indigo (#6366f1)
  "/app/mindfulness":       "#082c28", // from teal
  "/app/fitness":           "#2c0e0e", // from red (#ef4444)
  "/app/journal":           "#1e1a08", // warm parchment
  "/app/settings":          "#0a0a0a", // stays pure black
};

function getPageBg(pathname: string): string | null {
  if (PAGE_BG[pathname]) return PAGE_BG[pathname];
  for (const [route, bg] of Object.entries(PAGE_BG)) {
    if (pathname.startsWith(route)) return bg;
  }
  return null;
}

export function ThemeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [resolved, setResolved] = useState<"dark" | "light">(() => {
    try {
      const local = localStorage.getItem("routines365:theme") as Theme | null;
      if (local) return resolveTheme(local);
    } catch { /* ignore */ }
    const cached = getUserSettingsSync();
    if (cached?.theme) return resolveTheme(cached.theme as Theme);
    return "dark";
  });

  const [tintsOn, setTintsOn] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const readLocal = (): Theme | null => {
      try {
        return (localStorage.getItem("routines365:theme") as Theme | null) ?? null;
      } catch { return null; }
    };

    const apply = async () => {
      const local = readLocal();
      if (local) {
        if (!cancelled) setResolved(resolveTheme(local));
        return;
      }
      try {
        const s = await getUserSettings();
        if (cancelled) return;
        const t = (s.theme as Theme | undefined) ?? "system";
        try { localStorage.setItem("routines365:theme", t); } catch { /* ignore */ }
        setResolved(resolveTheme(t));
      } catch {
        if (!cancelled) setResolved(resolveTheme("system"));
      }
    };

    const checkTints = () => {
      try { setTintsOn(localStorage.getItem("routines365:pageTints") !== "off"); }
      catch { setTintsOn(true); }
    };

    void apply();
    checkTints();

    const onTheme = () => void apply();
    const onTints = () => checkTints();
    window.addEventListener("routines365:theme", onTheme);
    window.addEventListener("routines365:pageTints", onTints);

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const local = readLocal();
      if (!local || local === "system") {
        setResolved(prefersDark() ? "dark" : "light");
      }
    };
    mq?.addEventListener?.("change", onSystemChange);

    return () => {
      cancelled = true;
      window.removeEventListener("routines365:theme", onTheme);
      window.removeEventListener("routines365:pageTints", onTints);
      mq?.removeEventListener?.("change", onSystemChange);
    };
  }, []);

  const isDark = resolved === "dark";
  const pageBg = (isDark && tintsOn) ? getPageBg(pathname) : null;
  const bg = pageBg ?? "var(--bg-primary)";

  return (
    <div data-theme={resolved} className="theme-shell"
      style={{ backgroundColor: bg, color: "var(--text-primary)", transition: "background-color 0.4s ease" }}>
      {children}
    </div>
  );
}
