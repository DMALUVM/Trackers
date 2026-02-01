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
} from "lucide-react";
import { cn } from "@/lib/cn";
import { getUserSettings } from "@/lib/supabaseData";

const allItems = [
  { key: "routines", href: "/app/routines", label: "Routines", Icon: CalendarCheck2 },
  { key: "progress", href: "/app/routines/progress", label: "Progress", Icon: TrendingUp },
  { key: "rowing", href: "/app/rowing", label: "Rowing", Icon: Dumbbell },
  { key: "cardio", href: "/app/cardio", label: "Cardio", Icon: Footprints },
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
    const enabledSet = new Set(["routines", ...(enabled ?? [])]);
    const filtered = allItems.filter((i) => enabledSet.has(i.key));
    // cap at 4 visible tabs for now (luxury + thumb-friendly)
    const ordered = [
      filtered.find((i) => i.key === "routines"),
      filtered.find((i) => i.key === "progress"),
      filtered.find((i) => i.key === "rowing"),
      filtered.find((i) => i.key === "settings"),
      ...filtered.filter(
        (i) => !["routines", "progress", "rowing", "settings"].includes(i.key)
      ),
    ].filter(Boolean) as unknown as Array<(typeof allItems)[number]>;

    return ordered.slice(0, 4);
  }, [enabled]);

  return (
    <nav className="sticky bottom-0 border-t border-white/10 bg-black/60 backdrop-blur">
      <div
        className={cn(
          "mx-auto grid max-w-md gap-1 p-2",
          items.length === 3 ? "grid-cols-3" : items.length === 2 ? "grid-cols-2" : "grid-cols-4"
        )}
      >
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] text-neutral-400",
                "transition-colors",
                active && "bg-white/10 text-white"
              )}
            >
              <Icon size={18} className={cn(active ? "text-white" : "text-neutral-400")} />
              <span className="leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
