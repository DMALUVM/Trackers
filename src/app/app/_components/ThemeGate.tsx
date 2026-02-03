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

  const classes =
    theme === "light"
      ? "bg-white text-black"
      : "bg-neutral-950 text-white";

  return <div className={classes}>{children}</div>;
}
