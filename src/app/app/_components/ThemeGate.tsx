"use client";

import { useEffect, useState } from "react";
import { getUserSettings, getUserSettingsSync } from "@/lib/supabaseData";

type Theme = "system" | "dark" | "light";

function prefersDark() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true;
}

function resolveTheme(t: Theme): "dark" | "light" {
  return t === "system" ? (prefersDark() ? "dark" : "light") : t;
}

export function ThemeGate({ children }: { children: React.ReactNode }) {
  // Instant theme from localStorage — no flash, no async wait
  const [resolved, setResolved] = useState<"dark" | "light">(() => {
    // 1. Check localStorage cache (instant)
    try {
      const local = localStorage.getItem("routines365:theme") as Theme | null;
      if (local) return resolveTheme(local);
    } catch { /* ignore */ }

    // 2. Check cached settings from supabaseData
    const cached = getUserSettingsSync();
    if (cached?.theme) return resolveTheme(cached.theme as Theme);

    // 3. Default
    return "dark";
  });

  useEffect(() => {
    let cancelled = false;

    const readLocal = (): Theme | null => {
      try {
        return (localStorage.getItem("routines365:theme") as Theme | null) ?? null;
      } catch {
        return null;
      }
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
        try {
          localStorage.setItem("routines365:theme", t);
        } catch { /* ignore */ }
        setResolved(resolveTheme(t));
      } catch {
        if (!cancelled) setResolved(resolveTheme("system"));
      }
    };

    void apply();

    const onTheme = () => void apply();
    window.addEventListener("routines365:theme", onTheme);

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
      mq?.removeEventListener?.("change", onSystemChange);
    };
  }, []);

  return (
    <div data-theme={resolved} className="theme-shell" style={{ color: "var(--text-primary)" }}>
      {children}
    </div>
  );
}
