"use client";

import { useEffect, useState } from "react";
import { setThemePref } from "@/lib/supabaseData";

type Theme = "system" | "dark" | "light";

export default function AppearanceSettingsPage() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const t = (localStorage.getItem("routines365:theme") as Theme | null) ?? "system";
      setTheme(t);
    } catch {
      setTheme("system");
    }
  }, []);

  const apply = (t: Theme) => {
    setTheme(t);
    try {
      localStorage.setItem("routines365:theme", t);
    } catch {
      // ignore
    }
    // Persist to DB so it survives logins/devices.
    void setThemePref(t);
    // Trigger immediate re-render styling.
    window.dispatchEvent(new Event("routines365:theme"));
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Appearance</h1>
        <p className="text-sm text-neutral-400">Choose how the app looks.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-neutral-400">Theme</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              { key: "system" as const, label: "System" },
              { key: "dark" as const, label: "Dark" },
              { key: "light" as const, label: "Light" },
            ] satisfies Array<{ key: Theme; label: string }>
          ).map((opt) => {
            const active = theme === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                className={
                  "rounded-xl px-3 py-3 text-sm font-semibold transition-colors " +
                  (active
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10")
                }
                onClick={() => apply(opt.key)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">
          System follows your phone. Dark is default.
        </p>
      </section>
    </div>
  );
}
