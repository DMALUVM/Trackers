"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, Dumbbell, Brain, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/app/routines", label: "Routines", Icon: CalendarCheck2 },
  { href: "/app/rowing", label: "Rowing", Icon: Dumbbell },
  { href: "/app/neuro", label: "Neuro", Icon: Brain },
  { href: "/app/settings", label: "Settings", Icon: Settings },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 border-t border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 p-2">
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
              <Icon
                size={18}
                className={cn(active ? "text-white" : "text-neutral-400")}
              />
              <span className="leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
