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
// Bold enough to clearly see on OLED. Toggle OFF = pure black.
const PAGE_BG: Record<string, string> = {
  "/app/today":             "#0b3020", // emerald
  "/app/breathwork":        "#0a3040", // teal-cyan
  "/app/movement":          "#0b3020", // emerald
  "/app/focus":             "#352a0a", // warm amber
  "/app/biometrics":        "#221240", // purple
  "/app/routines/progress": "#102040", // blue
  "/app/routines/edit":     "#102040", // blue
  "/app/streaks":           "#353008", // gold
  "/app/trophies":          "#353008", // gold
  "/app/partner":           "#3a1230", // pink
  "/app/recovery":          "#0a3530", // teal
  "/app/sleep":             "#161845", // indigo
  "/app/mindfulness":       "#0a3530", // teal
  "/app/fitness":           "#351010", // red
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
