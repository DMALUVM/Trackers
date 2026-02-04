"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "dark" | "light";

function prefersDark() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true;
}

export function ThemeGate({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const read = () => {
      try {
        return (localStorage.getItem("routines365:theme") as Theme | null) ?? "system";
      } catch {
        return "system";
      }
    };

    const apply = () => {
      const t = read();
      const resolved = t === "system" ? (prefersDark() ? "dark" : "light") : t;
      setTheme(resolved);
    };

    apply();
    window.addEventListener("routines365:theme", apply);
    return () => window.removeEventListener("routines365:theme", apply);
  }, []);

  const isLight = theme === "light";
  const classes = isLight ? "bg-white text-black" : "bg-neutral-950 text-white";

  return (
    <div className={classes} data-theme={isLight ? "light" : "dark"}>
      {isLight ? (
        <style jsx global>{`
          /* HOTFIX: Many components still use dark-theme utility classes (text-white/bg-white/5/etc).
             Override the most common ones in light mode so the UI remains readable. */
          /* Text colors */
          [data-theme='light'] .text-white,
          [data-theme='light'] .text-neutral-50,
          [data-theme='light'] .text-neutral-100,
          [data-theme='light'] .text-neutral-200 { color: #0b1220 !important; }
          [data-theme='light'] .text-neutral-300 { color: #1f2937 !important; }
          [data-theme='light'] .text-neutral-400 { color: #374151 !important; }
          [data-theme='light'] .text-neutral-500 { color: #4b5563 !important; }
          [data-theme='light'] .text-neutral-600 { color: #6b7280 !important; }

          /* Accent text that was designed for dark backgrounds */
          [data-theme='light'] .text-emerald-200,
          [data-theme='light'] .text-emerald-300 { color: #065f46 !important; }
          [data-theme='light'] .text-emerald-400,
          [data-theme='light'] .text-emerald-500 { color: #047857 !important; }

          /* SVG icon stroke/fill (lucide) */
          [data-theme='light'] svg.text-white,
          [data-theme='light'] svg.text-neutral-400,
          [data-theme='light'] svg.text-neutral-500 { color: #0b1220 !important; }

          [data-theme='light'] .bg-black\/60 { background-color: rgba(255,255,255,0.72) !important; }
          [data-theme='light'] .bg-black\/40 { background-color: rgba(255,255,255,0.72) !important; }
          [data-theme='light'] .bg-black\/20 { background-color: rgba(255,255,255,0.72) !important; }
          [data-theme='light'] .bg-neutral-950 { background-color: #ffffff !important; }
          [data-theme='light'] .bg-neutral-950\/95 { background-color: rgba(255,255,255,0.96) !important; }

          [data-theme='light'] .bg-white\/5 { background-color: rgba(15,23,42,0.04) !important; }
          [data-theme='light'] .bg-white\/10 { background-color: rgba(15,23,42,0.08) !important; }
          [data-theme='light'] .bg-white\/15 { background-color: rgba(15,23,42,0.10) !important; }

          [data-theme='light'] .border-white\/10 { border-color: rgba(15,23,42,0.12) !important; }
          [data-theme='light'] .border-white\/15 { border-color: rgba(15,23,42,0.16) !important; }

          [data-theme='light'] .backdrop-blur { backdrop-filter: blur(10px) !important; }
        `}</style>
      ) : null}
      {children}
    </div>
  );
}
