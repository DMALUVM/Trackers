"use client";

import { useEffect, useState } from "react";
import { setThemePref } from "@/lib/supabaseData";
import { Toast, type ToastState } from "@/app/app/_components/ui";

type Theme = "system" | "dark" | "light";

export default function AppearancePage() {
  const [theme, setTheme] = useState<Theme>("system");
  const [toast, setToast] = useState<ToastState>("idle");

  useEffect(() => {
    try {
      const t = (localStorage.getItem("routines365:theme") as Theme | null) ?? "system";
      setTheme(t);
    } catch { /* default */ }
  }, []);

  const pick = async (t: Theme) => {
    setTheme(t);
    setToast("saving");
    try {
      localStorage.setItem("routines365:theme", t);
      window.dispatchEvent(new Event("routines365:theme"));
      await setThemePref(t);
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <Toast state={toast} />
      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Appearance</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>System follows your phone. Dark is default.</p>
      </header>
      <section className="card p-4">
        <p className="text-xs font-medium mb-3" style={{ color: "var(--text-faint)" }}>Theme</p>
        <div className="grid grid-cols-3 gap-2">
          {(["system", "dark", "light"] as const).map((t) => (
            <button key={t} type="button"
              className={theme === t ? "btn-primary text-sm" : "btn-secondary text-sm"}
              onClick={() => pick(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
