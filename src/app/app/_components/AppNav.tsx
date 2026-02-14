"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Dumbbell, Brain, TrendingUp,
  Footprints, Home, Flame, Heart, Moon, Pill, Droplets, BookOpen,
  Trophy, Flag,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { getUserSettings, getUserSettingsSync } from "@/lib/supabaseData";
import { hapticLight } from "@/lib/haptics";

// All available module nav items (Settings excluded — it's a gear icon in the header now)
const moduleItems = [
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
  { key: "wod", href: "/app/wod", label: "WODs", Icon: Trophy },
  { key: "race", href: "/app/race", label: "Race", Icon: Flag },
] as const;

// These 2 are always visible — never removed
const fixedItems = [
  { key: "today", href: "/app/today", label: "Today", Icon: Home },
  { key: "progress", href: "/app/routines/progress", label: "Progress", Icon: TrendingUp },
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
      catch { setEnabled((prev) => prev ?? ["progress"]); }
    };
    void run();
    const onSettings = () => void run();
    window.addEventListener("routines365:userSettingsChanged", onSettings);
    return () => window.removeEventListener("routines365:userSettingsChanged", onSettings);
  }, []);

  const items = useMemo(() => {
    const enabledSet = new Set(enabled ?? []);
    // Pick up to 4 enabled modules to fill remaining slots
    const userModules = moduleItems.filter((i) => enabledSet.has(i.key)).slice(0, 4);
    return [...fixedItems, ...userModules];
  }, [enabled]);

  useEffect(() => {
    for (const it of items) { try { router.prefetch(it.href); } catch { /* ignore */ } }
  }, [items, router]);

  const colClass =
    items.length === 6 ? "grid-cols-6" :
    items.length === 5 ? "grid-cols-5" :
    items.length === 4 ? "grid-cols-4" :
    items.length === 3 ? "grid-cols-3" :
    "grid-cols-2";

  return (
    <nav className="sticky bottom-0 nav-bar safe-bottom">
      <div className={cn("mx-auto grid max-w-md py-1.5 px-1", colClass)}>
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/app/today" && pathname?.startsWith(href));
          return (
            <Link key={href} href={href} prefetch
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 transition-all duration-150 active:scale-90"
              style={{ color: active ? "var(--accent-green)" : "var(--text-muted)" }}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => hapticLight()}>
              <div className="relative flex items-center justify-center" style={{ width: 24, height: 24 }}>
                <Icon size={24} strokeWidth={active ? 2.5 : 1.8} />
                {active && (
                  <div className="absolute -bottom-1.5 h-1 w-1 rounded-full" style={{ background: "var(--accent-green)" }} />
                )}
              </div>
              <span className="text-[11px] font-semibold leading-tight mt-0.5"
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
