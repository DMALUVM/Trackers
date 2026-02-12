"use client";

import Link from "next/link";
import { Settings, Palette, Lock, Download, Trophy, Award, LayoutGrid, ChevronRight, HelpCircle, BookOpen, Moon, Crown, Heart, Bell, SlidersHorizontal, MessageCircle } from "lucide-react";
import { hapticLight } from "@/lib/haptics";
import { usePremium } from "@/lib/premium";

const sections = [
  {
    title: "Customize",
    items: [
      { href: "/app/settings/routines", label: "Routines", desc: "Edit habits, set Core priorities", icon: Settings },
      { href: "/app/settings/modules", label: "Modules", desc: "Choose which tabs to show", icon: LayoutGrid },
      { href: "/app/settings/customize", label: "Customize Today", desc: "Toggle sections on your Today page", icon: SlidersHorizontal },
      { href: "/app/trophies", label: "Trophies", desc: "Milestones and achievements", icon: Award },
      { href: "/app/settings/quests", label: "Quests", desc: "Weekly goals and streaks", icon: Trophy },
      { href: "/app/settings/rest-days", label: "Rest Days", desc: "Planned days off that protect your streak", icon: Moon },
      { href: "/app/settings/health", label: "Apple Health", desc: "Auto-track steps, sleep, and workouts", icon: Heart },
    ],
  },
  {
    title: "Preferences",
    items: [
      { href: "/app/settings/appearance", label: "Appearance", desc: "Theme and display", icon: Palette },
      { href: "/app/settings/notifications", label: "Notifications", desc: "Daily reminders and streak alerts", icon: Bell },
      { href: "/app/settings/security", label: "Security", desc: "Sign out, Face ID / Touch ID", icon: Lock },
    ],
  },
  {
    title: "Data",
    items: [
      { href: "/app/settings/backup", label: "Backup & Restore", desc: "Export, import, and protect your data", icon: Download },
    ],
  },
  {
    title: "Help",
    items: [
      { href: "/app/settings/knowledge", label: "Knowledge Base", desc: "The science behind your habits", icon: BookOpen },
      { href: "/app/settings/how-it-works", label: "How it works", desc: "Core vs bonus, colors, streaks, and more", icon: HelpCircle },
    ],
  },
];

export default function SettingsPage() {
  const { isPremium } = usePremium();

  return (
    <div className="space-y-6 stagger-sections">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Settings</h1>
      </header>

      {/* Premium banner */}
      {!isPremium ? (
        <Link href="/app/settings/premium" onClick={() => hapticLight()}
          className="flex items-center gap-3.5 rounded-2xl p-4 tap-btn"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.03))",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent-green), var(--accent-green-text))" }}>
            <Crown size={22} color="white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Upgrade to Pro</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Unlock deep insights, streak freezes, and more</p>
          </div>
          <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
        </Link>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl p-4"
          style={{ background: "var(--accent-green-soft)", border: "1px solid var(--accent-green)" }}>
          <Crown size={20} style={{ color: "var(--accent-green-text)" }} />
          <p className="text-sm font-bold flex-1" style={{ color: "var(--accent-green-text)" }}>Routines365 Pro</p>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "var(--accent-green)", color: "white" }}>ACTIVE</span>
        </div>
      )}

      {sections.map((section) => (
        <section key={section.title}>
          <p className="text-xs font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>
            {section.title}
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-primary)" }}>
            {section.items.map(({ href, label, desc, icon: Icon }, idx) => (
              <Link key={href} href={href}
                className="flex items-center gap-4 px-4 py-3.5 transition-all active:scale-[0.98] active:opacity-80"
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

      {/* Feedback */}
      <a href="mailto:routines365.app@gmail.com"
        className="flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98] active:opacity-80"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
        onClick={() => hapticLight()}>
        <div className="shrink-0 flex items-center justify-center rounded-xl"
          style={{ width: 36, height: 36, background: "var(--bg-card-hover)" }}>
          <MessageCircle size={18} style={{ color: "var(--text-muted)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Send Feedback</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Bugs, ideas, or just say hi</p>
        </div>
        <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
      </a>

      <footer className="text-center pt-4 pb-6 space-y-2">
        <div className="flex items-center justify-center gap-3 text-[11px]" style={{ color: "var(--text-faint)" }}>
          <a href="/terms" className="underline underline-offset-2">Terms</a>
          <span>·</span>
          <a href="/privacy" className="underline underline-offset-2">Privacy</a>
          <span>·</span>
          <a href="/support" className="underline underline-offset-2">Support</a>
        </div>
        <p className="text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>
          Routines365 · v1.0 (17)
        </p>
        <p className="text-[10px]" style={{ color: "var(--text-faint)", opacity: 0.6 }}>
          Made with ❤️ · Build better habits, one day at a time
        </p>

      </footer>
    </div>
  );
}
