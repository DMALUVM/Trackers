"use client";

import { useEffect, useState } from "react";
import { Check, Moon, Sun, Smartphone } from "lucide-react";
import { setThemePref } from "@/lib/supabaseData";
import { Toast, SubPageHeader, type ToastState } from "@/app/app/_components/ui";
import { hapticLight } from "@/lib/haptics";

type Theme = "system" | "dark" | "light";

const themes: Array<{ key: Theme; label: string; Icon: typeof Sun; desc: string }> = [
  { key: "system", label: "System", Icon: Smartphone, desc: "Match your device" },
  { key: "dark", label: "Dark", Icon: Moon, desc: "Easy on the eyes" },
  { key: "light", label: "Light", Icon: Sun, desc: "Bright and clean" },
];

export default function AppearancePage() {
  const [theme, setTheme] = useState<Theme>("system");
  const [toast, setToast] = useState<ToastState>("idle");

  useEffect(() => {
    try { setTheme((localStorage.getItem("routines365:theme") as Theme | null) ?? "system"); } catch { /* default */ }
  }, []);

  const pick = async (t: Theme) => {
    hapticLight();
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
    <div className="space-y-6">
      <Toast state={toast} />
      <SubPageHeader title="Appearance" subtitle="Choose how routines365 looks" backHref="/app/settings" />

      <section className="space-y-2">
        {themes.map(({ key, label, Icon, desc }) => {
          const active = theme === key;
          return (
            <button key={key} type="button" onClick={() => pick(key)}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200"
              style={{
                background: active ? "var(--accent-green-soft)" : "var(--bg-card)",
                border: `2px solid ${active ? "var(--accent-green)" : "var(--border-primary)"}`,
              }}>
              <div className="shrink-0 flex items-center justify-center rounded-xl"
                style={{ width: 40, height: 40, background: active ? "var(--accent-green)" : "var(--bg-card-hover)" }}>
                <Icon size={20} style={{ color: active ? "var(--text-inverse)" : "var(--text-muted)" }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold" style={{ color: active ? "var(--accent-green-text)" : "var(--text-primary)" }}>{label}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
              {active && (
                <div className="shrink-0 rounded-full flex items-center justify-center"
                  style={{ width: 24, height: 24, background: "var(--accent-green)" }}>
                  <Check size={14} strokeWidth={3} style={{ color: "var(--text-inverse)" }} />
                </div>
              )}
            </button>
          );
        })}
      </section>
    </div>
  );
}
