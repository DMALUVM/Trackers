"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2, Dumbbell, Brain, Settings, TrendingUp,
  Footprints, Home, Flame, Heart, Moon, Pill, Droplets, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { getUserSettings, getUserSettingsSync } from "@/lib/supabaseData";
import { hapticLight } from "@/lib/haptics";

const allItems = [
  { key: "today", href: "/app/today", label: "Today", Icon: Home },
  { key: "routines", href: "/app/routines", label: "Routines", Icon: CalendarCheck2 },
  { key: "progress", href: "/app/routines/progress", label: "Progress", Icon: TrendingUp },
  { key: "fitness", href: "/app/fitness", label: "Fitness", Icon: Dumbbell },
  { key: "cardio", href: "/app/cardio", label: "Cardio", Icon: Footprints },
  { key: "recovery", href: "/app/recovery", label: "Recovery", Icon: Flame },
  { key: "mindfulness", href: "/app/mindfulness", label: "Mindful", Icon: Heart },
  { key: "sleep", href: "/app/sleep", label: "Sleep", Icon: Moon },
  { key: "supplements", href: "/app/supplements", label: "Supps", Icon: Pill },
  { key: "hydration", href: "/app/hydration", label: "Water", Icon: Droplets },
  { key: "journal", href: "/app/journal", label: "Journal", Icon: BookOpen },
  { key: "rowing", href: "/app/rowing", label: "Rowing", Icon: Dumbbell },
  { key: "neuro", href: "/app/neuro", label: "Neuro", Icon: Brain },
  { key: "settings", href: "/app/settings", label: "Settings", Icon: Settings },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Instant render from localStorage, then async refresh
  const [enabled, setEnabled] = useState<string[] | null>(() => {
    const cached = getUserSettingsSync();
    return cached?.enabled_modules ?? null;
  });

  useEffect(() => {
    const run = async () => {
      try { const s = await getUserSettings(); setEnabled(s.enabled_modules); }
      catch { setEnabled((prev) => prev ?? ["progress", "settings"]); }
    };
    void run();
    const onSettings = () => void run();
    window.addEventListener("routines365:userSettingsChanged", onSettings);
    return () => window.removeEventListener("routines365:userSettingsChanged", onSettings);
  }, []);

  const items = useMemo(() => {
    const enabledSet = new Set(["today", "routines", ...(enabled ?? [])]);
    const filtered = allItems.filter((i) => enabledSet.has(i.key));
    const pinned = ["today", "routines"];
    const ordered = [
      ...pinned.map((k) => filtered.find((i) => i.key === k)).filter(Boolean),
      ...filtered.filter((i) => !pinned.includes(i.key) && i.key !== "settings"),
      filtered.find((i) => i.key === "settings"),
    ].filter(Boolean) as unknown as Array<(typeof allItems)[number]>;
    return ordered.slice(0, 5);
  }, [enabled]);

  useEffect(() => {
    for (const it of items) { try { router.prefetch(it.href); } catch { /* ignore */ } }
  }, [items, router]);

  return (
    <nav className="sticky bottom-0 nav-bar safe-bottom">
      <div className={cn(
        "mx-auto grid max-w-md py-1.5 px-1",
        items.length === 5 ? "grid-cols-5" : items.length === 3 ? "grid-cols-3" : items.length === 2 ? "grid-cols-2" : "grid-cols-4"
      )}>
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/app/today" && pathname?.startsWith(href));
          return (
            <Link key={href} href={href} prefetch
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 transition-all duration-150"
              style={{ color: active ? "var(--accent-green)" : "var(--text-muted)" }}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => hapticLight()}>
              <div className="relative flex items-center justify-center" style={{ width: 24, height: 24 }}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {active && (
                  <div className="absolute -bottom-1.5 h-1 w-1 rounded-full" style={{ background: "var(--accent-green)" }} />
                )}
              </div>
              <span className="text-[10px] font-semibold leading-tight mt-0.5"
                style={{ color: active ? "var(--accent-green)" : "var(--text-faint)" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
