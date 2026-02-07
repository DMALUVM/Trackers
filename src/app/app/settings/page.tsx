"use client";

import Link from "next/link";
import { Settings, Palette, Lock, Download, Trophy, Award, LayoutGrid, ChevronRight } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

const sections = [
  {
    title: "Customize",
    items: [
      { href: "/app/settings/routines", label: "Routines", desc: "Edit habits, set Core priorities", icon: Settings },
      { href: "/app/settings/modules", label: "Modules", desc: "Choose which tabs to show", icon: LayoutGrid },
      { href: "/app/trophies", label: "Trophies", desc: "Milestones and achievements", icon: Award },
      { href: "/app/settings/quests", label: "Quests", desc: "Weekly goals and streaks", icon: Trophy },
    ],
  },
  {
    title: "Preferences",
    items: [
      { href: "/app/settings/appearance", label: "Appearance", desc: "Theme and display", icon: Palette },
      { href: "/app/settings/security", label: "Security", desc: "Sign out, Face ID / Touch ID", icon: Lock },
    ],
  },
  {
    title: "Data",
    items: [
      { href: "/app/settings/backup", label: "Backup", desc: "Export your data", icon: Download },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Settings</h1>
      </header>

      {sections.map((section) => (
        <section key={section.title}>
          <p className="text-xs font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>
            {section.title}
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-primary)" }}>
            {section.items.map(({ href, label, desc, icon: Icon }, idx) => (
              <Link key={href} href={href}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors"
                style={{
                  background: "var(--bg-card)",
                  borderTop: idx > 0 ? "1px solid var(--border-secondary)" : undefined,
                }}
                onClick={() => hapticLight()}>
                <div className="shrink-0 flex items-center justify-center rounded-xl"
                  style={{ width: 36, height: 36, background: "var(--bg-card-hover)" }}>
                  <Icon size={18} style={{ color: "var(--text-muted)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{desc}</p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
              </Link>
            ))}
          </div>
        </section>
      ))}

      <footer className="text-center pt-4 pb-6 space-y-1">
        <p className="text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>
          Routines365 · v1.0.0
        </p>
        <p className="text-[10px]" style={{ color: "var(--text-faint)", opacity: 0.6 }}>
          Made with ❤️ · Build better habits, one day at a time
        </p>
      </footer>
    </div>
  );
}
