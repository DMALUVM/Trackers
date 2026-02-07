"use client";

import Link from "next/link";
import { Settings, Palette, Lock, Download, Trophy, LayoutGrid } from "lucide-react";

const links = [
  { href: "/app/settings/routines", label: "Routines", desc: "Edit, reorder, set Core", icon: Settings },
  { href: "/app/settings/modules", label: "Modules", desc: "Choose which tabs to show", icon: LayoutGrid },
  { href: "/app/settings/quests", label: "Quests", desc: "Weekly goals and streaks", icon: Trophy },
  { href: "/app/settings/appearance", label: "Appearance", desc: "Theme and display", icon: Palette },
  { href: "/app/settings/security", label: "Security", desc: "Face ID / Touch ID", icon: Lock },
  { href: "/app/settings/backup", label: "Backup", desc: "Export your data", icon: Download },
];

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Settings</h1>
      </header>

      <div className="space-y-2">
        {links.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href} className="card-interactive px-4 py-3.5 flex items-center gap-4">
            <Icon size={20} style={{ color: "var(--text-muted)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
