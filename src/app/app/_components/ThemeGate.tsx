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

const TINTS: Record<string, string> = {
  "/app/today":             "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 65%)",
  "/app/breathwork":        "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.16) 0%, transparent 65%)",
  "/app/movement":          "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.14) 0%, transparent 65%)",
  "/app/focus":             "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.14) 0%, transparent 65%)",
  "/app/biometrics":        "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.14) 0%, transparent 65%)",
  "/app/routines/progress": "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 65%)",
  "/app/routines/edit":     "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.10) 0%, transparent 60%)",
  "/app/streaks":           "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.14) 0%, transparent 65%)",
  "/app/trophies":          "radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.16) 0%, transparent 65%)",
  "/app/partner":           "radial-gradient(ellipse at 50% 0%, rgba(244,114,182,0.14) 0%, transparent 65%)",
  "/app/recovery":          "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.14) 0%, transparent 65%)",
  "/app/sleep":             "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.16) 0%, transparent 65%)",
  "/app/mindfulness":       "radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.14) 0%, transparent 65%)",
  "/app/fitness":           "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.12) 0%, transparent 65%)",
};

function getTint(pathname: string): string | null {
  if (TINTS[pathname]) return TINTS[pathname];
  for (const [route, tint] of Object.entries(TINTS)) {
    if (pathname.startsWith(route)) return tint;
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
  const tint = (isDark && tintsOn) ? getTint(pathname) : null;
  const bg = tint ? `${tint}, var(--bg-primary)` : "var(--bg-primary)";

  // 🔴 TEMPORARY DEBUG BANNER — remove after confirming tints work
  const debugInfo = `theme:${resolved} | tints:${tintsOn?"on":"off"} | path:${pathname} | tint:${tint?"YES":"NO"} | v13`;

  return (
    <div data-theme={resolved} className="theme-shell"
      style={{ background: bg, color: "var(--text-primary)" }}>
      <div style={{
        position: "fixed", bottom: 60, left: 8, right: 8, zIndex: 9999,
        background: "rgba(255,0,0,0.9)", color: "#fff",
        padding: "6px 10px", borderRadius: 8, fontSize: 10,
        fontFamily: "monospace", textAlign: "center", pointerEvents: "none",
      }}>
        {debugInfo}
      </div>
      {children}
    </div>
  );
}
