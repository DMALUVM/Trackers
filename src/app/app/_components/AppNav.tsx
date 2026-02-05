"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  Dumbbell,
  Brain,
  Settings,
  TrendingUp,
  Footprints,
  Home,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { getUserSettings } from "@/lib/supabaseData";

const allItems = [
  { key: "today", href: "/app/today", label: "Today", Icon: Home },
  { key: "routines", href: "/app/routines", label: "Routines", Icon: CalendarCheck2 },
  { key: "progress", href: "/app/routines/progress", label: "Progress", Icon: TrendingUp },
  { key: "rowing", href: "/app/rowing", label: "Rowing", Icon: Dumbbell },
  { key: "cardio", href: "/app/cardio", label: "Cardio", Icon: Footprints },
  { key: "recovery", href: "/app/recovery", label: "Recovery", Icon: Flame },
  { key: "neuro", href: "/app/neuro", label: "Neuro", Icon: Brain },
  { key: "settings", href: "/app/settings", label: "Settings", Icon: Settings },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState<string[] | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const s = await getUserSettings();
        setEnabled(s.enabled_modules);
      } catch {
        // fallback: show a sane default
        setEnabled(["progress", "rowing", "settings"]);
      }
    };
    void run();
  }, []);

  const items = useMemo(() => {
    const enabledSet = new Set(["today", "routines", ...(enabled ?? [])]);
    const filtered = allItems.filter((i) => enabledSet.has(i.key));
    const ordered = [
      filtered.find((i) => i.key === "today"),
      filtered.find((i) => i.key === "routines"),
      filtered.find((i) => i.key === "progress"),
      filtered.find((i) => i.key === "rowing"),
      filtered.find((i) => i.key === "settings"),
      ...filtered.filter(
        (i) => !["today", "routines", "progress", "rowing", "settings"].includes(i.key)
      ),
    ].filter(Boolean) as unknown as Array<(typeof allItems)[number]>;

    // If the user enables more than 4 modules, show 5 tabs and drop labels (icons only).
    return ordered.slice(0, 5);
  }, [enabled]);

  return (
    <nav className="sticky bottom-0 border-t border-white/10 bg-black/60 backdrop-blur">
      <div
        className={cn(
          "mx-auto grid max-w-md gap-1 p-2",
          items.length === 5
            ? "grid-cols-5"
            : items.length === 3
              ? "grid-cols-3"
              : items.length === 2
                ? "grid-cols-2"
                : "grid-cols-4"
        )}
      >
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href;
          const showLabel = items.length !== 5;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] text-neutral-400",
                "transition-colors",
                active && "bg-white/10 text-white"
              )}
              aria-label={label}
              title={label}
            >
              <Icon size={18} className={cn(active ? "text-white" : "text-neutral-400")} />
              {showLabel ? <span className="leading-none">{label}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
