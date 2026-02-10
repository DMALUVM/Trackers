"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { clearSessionCookies } from "@/lib/sessionCookie";
import { BrandIcon } from "@/app/app/_components/BrandIcon";
import { hapticLight, hapticMedium } from "@/lib/haptics";

type AuthState = "checking" | "signed-in" | "signed-out";

function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("r365_sb.flag=");
}
function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error - Capacitor global
  return !!window.Capacitor;
}

/* ────────────────────────────────────────────
   Scroll-reveal
   ──────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible: v };
}
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────
   Phone Frame (shared wrapper)
   ──────────────────────────────────────────── */
function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-[36px] p-2" style={{ background: "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
        <div className="rounded-[28px] overflow-hidden relative" style={{ background: "#0a0a0a", width: 240 }}>
          {/* Notch */}
          <div className="flex justify-center pt-1.5 pb-0.5">
            <div className="w-20 h-5 rounded-full" style={{ background: "#000" }} />
          </div>
          <div className="px-3 pb-3">{children}</div>
          {/* Bottom nav */}
          <div className="flex justify-around items-center py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.5)" }}>
            {[
              { icon: "🏠", l: "Today" },
              { icon: "📈", l: "Progress" },
              { icon: "🧠", l: "Neuro" },
            ].map(({ icon, l }) => (
              <div key={l} className="flex flex-col items-center gap-0.5">
                <span style={{ fontSize: 11 }}>{icon}</span>
                <span className="text-[7px] font-semibold" style={{ color: l === label ? "#10b981" : "rgba(255,255,255,0.3)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
    </div>
  );
}

/* ────────────────────────────────────────────
   Mockup 1 — Today Page
   ──────────────────────────────────────────── */
function MockToday() {
  const coreHabits = [
    { emoji: "💊", label: "Nattokinase", done: true },
    { emoji: "🏋️", label: "Workout", done: true },
    { emoji: "🧃", label: "Creatine", done: true },
    { emoji: "🦴", label: "Collagen", done: true },
    { emoji: "🌀", label: "Lymphatic flow", done: true },
    { emoji: "🍷", label: "No alcohol", done: true },
  ];
  const bonusHabits = [
    { emoji: "📓", label: "Journal", done: true },
    { emoji: "🧊", label: "Cold exposure", done: false },
    { emoji: "📚", label: "Read (10 min)", done: false },
  ];
  const weekDays = [
    { d: "W", n: "5", c: "green" }, { d: "T", n: "6", c: "green" }, { d: "F", n: "7", c: "green" },
    { d: "S", n: "8", c: "green" }, { d: "S", n: "9", c: "green" }, { d: "M", n: "10", c: "green" },
    { d: "T", n: "11", c: "today" },
  ];
  const coreDone = coreHabits.filter(h => h.done).length;

  return (
    <PhoneFrame label="Today">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>Good morning 👋</p>
            <p className="text-[11px] font-bold text-white">Tuesday <span className="text-[8px] font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>Feb 11</span></p>
          </div>
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}><span style={{ fontSize: 8 }}>🏆</span></div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}><span className="text-white" style={{ fontSize: 7 }}>•••</span></div>
          </div>
        </div>

        {/* Score card */}
        <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
              <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray={`${2*Math.PI*18}`} strokeDashoffset={`${2*Math.PI*18*(1-1)}`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: "#10b981" }}>✓</span>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-semibold" style={{ color: "#10b981" }}>Green Day! 🎉</p>
              <p className="text-[7px]" style={{ color: "rgba(255,255,255,0.4)" }}>{coreDone}/{coreHabits.length} core · +1 bonus</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span style={{ fontSize: 9 }}>🔥</span>
                <span className="text-[9px] font-bold text-white">7</span>
                <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.35)" }}>day streak · best 7</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-2 px-0.5">
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-[6px] font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>{d.d}</span>
                <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[7px] font-bold"
                  style={{
                    background: d.c === "green" ? "#10b981" : d.c === "today" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                    border: d.c === "today" ? "1.5px solid #10b981" : "none",
                    color: d.c === "green" ? "#000" : "rgba(255,255,255,0.5)",
                    transform: d.c === "today" ? "scale(1.1)" : "none",
                  }}>{d.n}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[7px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span>Next: ⚡ One Week</span><span style={{ color: "#10b981" }}>🎉 Today!</span>
          </div>
        </div>

        {/* Green Day celebration */}
        <div className="rounded-xl p-2 text-center" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <span style={{ fontSize: 14 }}>🎉</span>
          <p className="text-[8px] font-bold" style={{ color: "#10b981" }}>7-day streak! You&apos;re built different.</p>
        </div>

        {/* Core habits */}
        <div>
          <div className="flex justify-between mb-1"><span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>Core</span><span className="text-[7px] font-semibold" style={{ color: "#10b981" }}>{coreDone}/{coreHabits.length}</span></div>
          <div className="space-y-[3px]">
            {coreHabits.map(h => (
              <div key={h.label} className="flex items-center gap-1.5 rounded-lg px-2 py-[5px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0" style={{ background: "#10b981" }}><span className="text-[7px] text-black font-bold">✓</span></div>
                <span className="text-[7px]">{h.emoji}</span>
                <span className="text-[8px] line-through" style={{ color: "rgba(255,255,255,0.3)" }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bonus habits */}
        <div>
          <div className="flex justify-between mb-1"><span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>Bonus</span><span className="text-[7px]" style={{ color: "rgba(255,255,255,0.2)" }}>1/{bonusHabits.length}</span></div>
          <div className="space-y-[3px]">
            {bonusHabits.map(h => (
              <div key={h.label} className="flex items-center gap-1.5 rounded-lg px-2 py-[4px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0" style={{ background: h.done ? "#10b981" : "transparent", border: h.done ? "none" : "1.5px solid rgba(255,255,255,0.12)" }}>{h.done && <span className="text-[6px] text-black font-bold">✓</span>}</div>
                <span className="text-[7px]">{h.emoji}</span>
                <span className={`text-[8px] ${h.done ? "line-through" : ""}`} style={{ color: h.done ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.55)" }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ────────────────────────────────────────────
   Mockup 2 — Progress Calendar
   ──────────────────────────────────────────── */
function MockProgress() {
  // Feb 2026 calendar mock — mostly green with a few yellows
  const days = [
    // prev month filler
    ...Array.from({ length: 6 }, (_, i) => ({ n: 26 + i, c: "faded" })),
    // Feb 1–28
    { n: 1, c: "green" }, { n: 2, c: "green" }, { n: 3, c: "green" }, { n: 4, c: "yellow" },
    { n: 5, c: "green" }, { n: 6, c: "green" }, { n: 7, c: "green" }, { n: 8, c: "green" },
    { n: 9, c: "green" }, { n: 10, c: "green" }, { n: 11, c: "today" },
    ...Array.from({ length: 17 }, (_, i) => ({ n: 12 + i, c: "future" })),
  ];

  return (
    <PhoneFrame label="Progress">
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-bold text-white">Progress</p>
          <p className="text-[7px]" style={{ color: "rgba(255,255,255,0.35)" }}>Tap any day to review</p>
        </div>

        {/* Calendar */}
        <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.3)" }}>‹</span>
            <span className="text-[9px] font-bold text-white">February 2026</span>
            <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.3)" }}>›</span>
          </div>
          <div className="grid grid-cols-7 gap-[3px] text-center">
            {["M","T","W","T","F","S","S"].map((d,i) => (
              <span key={i} className="text-[6px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{d}</span>
            ))}
            {days.map((d, i) => {
              const bg = d.c === "green" ? "#10b981" : d.c === "yellow" ? "#eab308" : d.c === "red" ? "#ef4444" : d.c === "today" ? "rgba(16,185,129,0.15)" : "transparent";
              const border = d.c === "today" ? "1.5px solid #10b981" : "none";
              const textColor = d.c === "green" ? "#000" : d.c === "yellow" ? "#000" : d.c === "faded" ? "rgba(255,255,255,0.1)" : d.c === "future" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)";
              return (
                <div key={i} className="flex items-center justify-center rounded-full text-[7px] font-bold"
                  style={{ width: 22, height: 22, background: bg, border, color: textColor, margin: "0 auto" }}>
                  {d.n}
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-2 justify-center">
            {[{ c: "#10b981", l: "All core" }, { c: "#eab308", l: "Missed 1" }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} /><span className="text-[6px]" style={{ color: "rgba(255,255,255,0.35)" }}>{l}</span></div>
            ))}
          </div>
        </div>

        {/* Streak stats */}
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "CURRENT", value: "10", sub: "consecutive green days" },
            { label: "BEST", value: "10", sub: "all-time record" },
            { label: "CORE HIT-RATE", value: "91%", sub: "this week" },
            { label: "GREEN DAYS", value: "10", sub: "this month" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[6px] font-bold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
              <p className="text-sm font-extrabold text-white mt-0.5">{value}</p>
              <p className="text-[6px]" style={{ color: "rgba(255,255,255,0.25)" }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ────────────────────────────────────────────
   Mockup 3 — My Streaks
   ──────────────────────────────────────────── */
function MockStreaks() {
  const habits = [
    { emoji: "💊", label: "Nattokinase", core: true, streak: 10, pct: "100%", best: "10d" },
    { emoji: "🏋️", label: "Workout", core: true, streak: 8, pct: "80%", best: "8d" },
    { emoji: "🍷", label: "No alcohol", core: true, streak: 10, pct: "100%", best: "10d" },
    { emoji: "🧃", label: "Creatine", core: true, streak: 10, pct: "100%", best: "10d" },
    { emoji: "🌀", label: "Lymphatic flow", core: true, streak: 7, pct: "70%", best: "7d" },
    { emoji: "📓", label: "Journal", core: false, streak: 5, pct: "50%", best: "5d" },
  ];

  return (
    <PhoneFrame label="Today">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-white">My Streaks</p>
            <p className="text-[7px]" style={{ color: "rgba(255,255,255,0.35)" }}>13 habits tracked</p>
          </div>
          <div className="rounded-lg px-2 py-1 flex items-center gap-1" style={{ border: "1px solid rgba(16,185,129,0.3)" }}>
            <span style={{ fontSize: 8 }}>👥</span>
            <span className="text-[7px] font-semibold" style={{ color: "#10b981" }}>Partner</span>
          </div>
        </div>

        <div className="space-y-1">
          {habits.map(h => (
            <div key={h.label} className="flex items-center gap-2 rounded-xl px-2 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-sm">{h.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-white truncate">{h.label}</span>
                  {h.core && <span className="text-[5px] font-bold px-1 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.2)", color: "#10b981" }}>CORE</span>}
                </div>
                <p className="text-[7px]" style={{ color: "rgba(255,255,255,0.3)" }}>{h.pct} · Best: {h.best}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-extrabold" style={{ color: "#10b981" }}>{h.streak}</p>
                <p className="text-[6px]" style={{ color: "rgba(255,255,255,0.3)" }}>days</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ────────────────────────────────────────────
   Mockup 4 — Sleep / Biometrics
   ──────────────────────────────────────────── */
function MockSleep() {
  const nights = [
    { d: "Tue", deep: 28, core: 40, rem: 22, total: "7h 12m" },
    { d: "Wed", deep: 22, core: 44, rem: 18, total: "6h 49m" },
    { d: "Thu", deep: 30, core: 38, rem: 24, total: "7h 31m" },
    { d: "Fri", deep: 18, core: 46, rem: 16, total: "6h 15m" },
    { d: "Sat", deep: 32, core: 36, rem: 26, total: "7h 42m" },
    { d: "Sun", deep: 24, core: 42, rem: 20, total: "6h 58m" },
    { d: "Mon", deep: 26, core: 40, rem: 22, total: "7h 8m" },
  ];

  return (
    <PhoneFrame label="Progress">
      <div className="space-y-2">
        <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-[8px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>📈 Biometric Insights</span>
        </div>

        {/* Sleep chart */}
        <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex justify-between mb-2">
            <span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>🌙 Sleep — 7 Nights</span>
            <span className="text-[7px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>avg 7h 5m</span>
          </div>
          <div className="space-y-[5px]">
            {nights.map(n => (
              <div key={n.d} className="flex items-center gap-2">
                <span className="text-[7px] w-5 text-right shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>{n.d}</span>
                <div className="flex-1 flex h-3 rounded-sm overflow-hidden">
                  <div style={{ width: `${n.deep}%`, background: "#4338ca" }} />
                  <div style={{ width: `${n.core}%`, background: "#6366f1" }} />
                  <div style={{ width: `${n.rem}%`, background: "#a78bfa" }} />
                </div>
                <span className="text-[7px] w-8 text-right shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>{n.total}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-2 justify-center">
            {[{ c: "#4338ca", l: "Deep" }, { c: "#6366f1", l: "Core" }, { c: "#a78bfa", l: "REM" }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} /><span className="text-[6px]" style={{ color: "rgba(255,255,255,0.35)" }}>{l}</span></div>
            ))}
          </div>
        </div>

        {/* HRV insight */}
        <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-[7px] font-bold tracking-wider uppercase" style={{ color: "#eab308" }}>✨ Habit × Body</p>
          <p className="text-[8px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Your HRV averages 12ms higher on days you complete cold exposure and breathwork.</p>
        </div>

        {/* Quick biometric stats */}
        <div className="grid grid-cols-2 gap-1.5">
          {[{ l: "Resting HR", v: "58 bpm", icon: "❤️" }, { l: "HRV", v: "42 ms", icon: "📊" }].map(({ l, v, icon }) => (
            <div key={l} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: 10 }}>{icon}</span>
              <p className="text-xs font-extrabold text-white mt-0.5">{v}</p>
              <p className="text-[6px]" style={{ color: "rgba(255,255,255,0.25)" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ────────────────────────────────────────────
   Feature / marketing data
   ──────────────────────────────────────────── */
const FEATURES = [
  { emoji: "✅", title: "One-tap daily checklist", desc: "Mark habits as Core or Bonus. Complete all your core habits and you earn a green day. Takes about 10 seconds." },
  { emoji: "📓", title: "Guided journal", desc: "Gratitude prompts, daily intention, and reflection — or switch to free write. Saving auto-checks your journal habit for the day." },
  { emoji: "🌬️", title: "Breathwork & Qigong", desc: "Five guided breathing techniques (Box, 4-7-8, Wim Hof, Physiological Sigh, Energizing) with Om audio cues, plus Qigong movement routines." },
  { emoji: "🔥", title: "Streaks, trophies & quests", desc: "Build daily streaks with milestones at 7, 30, 100, and 365 days. Earn trophies, complete weekly quests, and use rest days to protect your streak." },
  { emoji: "❤️", title: "Apple Health integration", desc: "See sleep, HRV, resting heart rate, steps, blood oxygen, and respiratory rate — pulled from Apple Health. Works with any wearable that syncs to HealthKit." },
  { emoji: "👥", title: "Accountability partner", desc: "Invite a friend and track each other's progress. Send cheers when they hit milestones. Stay motivated together." },
  { emoji: "🎯", title: "Focus timer", desc: "Pomodoro-style deep work sessions. Track completed focus blocks right alongside your habits." },
  { emoji: "📊", title: "Progress & insights", desc: "Beautiful progress calendar, sleep stage charts (Deep, Core, REM), day-of-week patterns, and personalized insights that get smarter over time." },
];

const PREMIUM_FEATURES = [
  "Biometric insights — HRV trends and resting heart rate analysis",
  "Sleep stage breakdown — Deep, Core, and REM with 7-night trends",
  "Health auto-complete — habits check themselves when Apple Health data hits your goals",
  "Unlimited habits, unlimited streak freezes, and detailed reports",
  "Custom themes, share cards, and per-habit analytics",
];

export default function Home() {
  const router = useRouter();
  const authRef = useRef<HTMLDivElement>(null);
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "create" | "magic" | "forgot">("signin");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  /* ── Session check ── */
  useEffect(() => {
    if (!hasSessionCookie()) setAuthState("signed-out");
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const check = async () => {
      try {
        let { data } = await supabase.auth.getSession();
        if (!data.session) { for (const delay of [0, 250, 800]) { if (delay) await sleep(delay); try { await supabase.auth.refreshSession(); } catch {} data = (await supabase.auth.getSession()).data; if (data.session) break; } }
        if (cancelled) return;
        if (data.session) { setSignedInEmail(data.session.user.email ?? null); setAuthState("signed-in"); } else setAuthState("signed-out");
      } catch { if (!cancelled) setAuthState("signed-out"); }
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (cancelled) return;
      if (session?.user.id) { const p = localStorage.getItem("routines365:userId"); if (p && p !== session.user.id) Object.keys(localStorage).filter(k => k.startsWith("routines365:") && k !== "routines365:userId").forEach(k => localStorage.removeItem(k)); localStorage.setItem("routines365:userId", session.user.id); }
      setSignedInEmail(session?.user.email ?? null); setAuthState(session ? "signed-in" : "signed-out");
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  useEffect(() => { if (authState === "signed-in") router.replace("/app/today"); }, [authState, router]);

  const getSiteUrl = useCallback(() => (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) || (typeof window !== "undefined" ? window.location.origin : ""), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return; hapticMedium(); setBusy(true); setStatus("");
    try {
      if (mode === "signin") { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; }
      else if (mode === "create") { const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${getSiteUrl()}/` } }); if (error) throw error; if (data.session) { setAuthState("signed-in"); return; } setStatus("Account created! Check your inbox to confirm."); }
      else if (mode === "magic") { const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${getSiteUrl()}/` } }); if (error) throw error; setStatus("Check your email for the sign-in link ✓"); }
      else if (mode === "forgot") { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${getSiteUrl()}/reset` }); if (error) throw error; setStatus("Check your email for the reset link ✓"); }
    } catch (err: unknown) { setStatus(err instanceof Error ? err.message : String(err)); } finally { setBusy(false); }
  };

  const signOut = async () => { hapticLight(); setBusy(true); try { await supabase.auth.signOut(); clearSessionCookies(); setSignedInEmail(null); setAuthState("signed-out"); window.location.href = "/"; } catch { setBusy(false); } };
  const scrollToAuth = () => authRef.current?.scrollIntoView({ behavior: "smooth" });

  /* ── SPLASH ── */
  if (authState === "checking" || authState === "signed-in") {
    return (
      <main className="min-h-dvh bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-5 animate-fade-in">
          <div className="mx-auto" style={{ width: 72 }}><BrandIcon size={72} /></div>
          <p className="text-xl font-semibold uppercase" style={{ letterSpacing: "0.06em" }}>ROUTINES365</p>
          <p className="text-xs text-neutral-500">Stack your days. Change your life.</p>
          <div className="flex items-center justify-center gap-2">
            {[0, 0.15, 0.3].map(d => <div key={d} className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: `${d}s` }} />)}
          </div>
        </div>
      </main>
    );
  }

  /* ── NATIVE: minimal auth ── */
  if (isNative()) {
    return (
      <main className="min-h-dvh bg-black text-white">
        <div className="mx-auto w-full max-w-md px-6 py-8" style={{ paddingTop: "max(env(safe-area-inset-top, 32px), 32px)" }}>
          <header className="space-y-4 text-center">
            <div className="mx-auto" style={{ width: 72 }}><BrandIcon size={72} /></div>
            <h1 className="text-2xl font-semibold uppercase" style={{ letterSpacing: "0.06em" }}>ROUTINES365</h1>
            <p className="text-sm font-medium text-emerald-400">Stack your days. Change your life.</p>
          </header>
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">{renderAuthForm()}</section>
        </div>
      </main>
    );
  }

  function renderAuthForm() {
    if (signedInEmail) {
      return (<div><p className="text-sm text-neutral-200">Signed in as <span className="font-semibold">{signedInEmail}</span></p><div className="mt-4 flex gap-2"><a href="/app/today" className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black">Open app →</a><button type="button" disabled={busy} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" onClick={signOut}>Sign out</button></div></div>);
    }
    return (
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold">{mode === "signin" ? "Sign in" : mode === "create" ? "Create account" : mode === "magic" ? "Magic link" : "Reset password"}</h2>
        <label className="mt-4 block text-sm font-medium text-neutral-400">Email</label>
        <input className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" required />
        {(mode === "signin" || mode === "create") && (<><label className="mt-3 block text-sm font-medium text-neutral-400">Password</label><div className="relative mt-1.5"><input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-12 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === "create" ? "new-password" : "current-password"} required minLength={mode === "create" ? 8 : undefined} /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500 px-1 py-1" onClick={() => { hapticLight(); setShowPassword(!showPassword); }} tabIndex={-1}>{showPassword ? "Hide" : "Show"}</button></div></>)}
        <button type="submit" disabled={busy} className="mt-4 w-full rounded-xl bg-white px-4 py-3.5 text-base font-bold text-black disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2">{busy ? (<><span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />{mode === "signin" ? "Signing in…" : mode === "create" ? "Creating…" : "Sending…"}</>) : (mode === "signin" ? "Sign in" : mode === "create" ? "Create account" : mode === "magic" ? "Send magic link" : "Send reset link")}</button>
        {status && <p className={`mt-3 text-xs ${status.startsWith("Check") || status.startsWith("Account") ? "text-emerald-400" : "text-red-400"}`}>{status}</p>}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
          {mode !== "signin" && <button type="button" className="underline-offset-2 underline" onClick={() => { hapticLight(); setMode("signin"); setStatus(""); setShowPassword(false); }}>Sign in</button>}
          {mode !== "create" && <button type="button" className="underline-offset-2 underline" onClick={() => { hapticLight(); setMode("create"); setStatus(""); setShowPassword(false); }}>Create account</button>}
          {mode !== "magic" && <button type="button" className="underline-offset-2 underline" onClick={() => { hapticLight(); setMode("magic"); setStatus(""); setShowPassword(false); }}>Magic link</button>}
          {mode === "signin" && <button type="button" className="underline-offset-2 underline" onClick={() => { hapticLight(); setMode("forgot"); setStatus(""); setShowPassword(false); }}>Forgot password?</button>}
        </div>
      </form>
    );
  }

  /* ──────────────────────────────────────
     MARKETING WEBSITE
     ────────────────────────────────────── */
  return (
    <main className="min-h-dvh bg-black text-white overflow-x-hidden">

      {/* Sticky nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5"><BrandIcon size={28} /><span className="text-sm font-bold tracking-wide uppercase">Routines365</span></div>
          <button type="button" onClick={scrollToAuth} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">Get started free</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }} />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Copy */}
            <div className="flex-1 text-center lg:text-left max-w-xl">
              <Reveal>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08]">
                  Habits, journal,<br />breathwork, streaks<br />
                  <span className="text-emerald-400">— one app, 10 seconds</span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 text-lg text-neutral-400 leading-relaxed">
                  Stop juggling five apps for your morning routine. Routines365 puts habit tracking, guided journaling, breathwork sessions, Apple Health insights, and accountability into one beautiful daily checklist. Check in once, and watch consistency compound.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
                  <button type="button" onClick={scrollToAuth} className="w-full sm:w-auto rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-black transition hover:bg-emerald-400 active:scale-[0.98]">Start for free →</button>
                  {/* <a href="https://apps.apple.com/app/routines365/id..."><img src="/app-store-badge.svg" alt="Download on the App Store" className="h-12" /></a> */}
                </div>
                <p className="mt-4 text-xs text-neutral-600 lg:text-left text-center">Free plan available · Premium from $3.99/mo · 76 built-in habits</p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mt-10 flex justify-center lg:justify-start gap-10">
                  {[{ v: "76", l: "Built-in habits" }, { v: "10s", l: "Daily check-in" }, { v: "365", l: "Day streaks" }].map(({ v, l }) => (
                    <div key={l}><div className="text-3xl font-extrabold text-emerald-400">{v}</div><div className="mt-0.5 text-xs text-neutral-500 font-medium">{l}</div></div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Phone mockup - Today */}
            <Reveal delay={0.15} className="shrink-0">
              <MockToday />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Device bar ── */}
      <Reveal>
        <section className="border-y border-white/5 py-5 px-6">
          <div className="mx-auto max-w-3xl flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-neutral-500">
            <span>📱 iOS App</span>
            <span className="text-neutral-700">·</span>
            <span>🍎 Apple Health</span>
            <span className="text-neutral-700">·</span>
            <span>⌚ Syncs with any HealthKit-connected wearable</span>
          </div>
        </section>
      </Reveal>

      {/* ── PHONE SHOWCASE (horizontal scroll on mobile) ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">See the app in action</h2>
              <p className="mt-3 text-neutral-500 max-w-lg mx-auto">Track habits, review progress, build streaks, and understand your health — all from your pocket.</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar justify-start lg:justify-center">
              <div className="snap-center shrink-0"><MockToday /></div>
              <div className="snap-center shrink-0"><MockProgress /></div>
              <div className="snap-center shrink-0"><MockStreaks /></div>
              <div className="snap-center shrink-0"><MockSleep /></div>
            </div>
            <p className="text-center text-xs text-neutral-600 mt-4 lg:hidden">← Swipe to see more screens →</p>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-6" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Replace five apps<br />with one daily ritual</h2>
              <p className="mt-4 text-neutral-500 max-w-lg mx-auto">Habit tracker, journal, breathwork guide, health dashboard, and accountability partner — built into one app that takes 10 seconds a day.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ emoji, title, desc }, i) => (
              <Reveal key={title} delay={0.05 * i}>
                <div className="group rounded-2xl border border-white/[0.06] p-6 transition-colors hover:border-white/[0.12] hover:bg-white/[0.02] h-full">
                  <span className="text-2xl">{emoji}</span>
                  <h3 className="mt-3 text-base font-bold text-neutral-100">{title}</h3>
                  <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6" style={{ background: "rgba(16,185,129,0.03)" }}>
        <div className="mx-auto max-w-3xl">
          <Reveal><h2 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight mb-14">How it works</h2></Reveal>
          <div className="space-y-8">
            {[
              { n: "1", t: "Pick your habits", d: "Choose from 76 built-in habits across morning routines, fitness, nutrition, recovery, and mindfulness — or create your own." },
              { n: "2", t: "Mark your Core", d: "Tag your non-negotiable habits. Complete all of them and you earn a green day." },
              { n: "3", t: "Check in daily", d: "One tap per habit. Log activities, write in your journal, practice breathwork. Quick check-in takes 10 seconds." },
              { n: "4", t: "Watch consistency compound", d: "Build streaks, earn trophies, fill your calendar with green. Biometric insights reveal how your habits affect your body." },
            ].map(({ n, t, d }, i) => (
              <Reveal key={n} delay={0.08 * i}>
                <div className="flex gap-5">
                  <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>{n}</div>
                  <div><h3 className="text-lg font-bold text-neutral-100">{t}</h3><p className="mt-1 text-sm text-neutral-500 leading-relaxed">{d}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREMIUM ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <div className="rounded-3xl border border-emerald-800/40 p-8 sm:p-10" style={{ background: "linear-gradient(180deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 100%)" }}>
              <div className="text-center">
                <p className="text-xs font-bold tracking-wider uppercase text-emerald-400 mb-2">Premium</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Go deeper with insights</h2>
                <p className="mt-3 text-neutral-500 text-sm">7-day free trial · $3.99/month or $29.99/year (37% off)</p>
              </div>
              <div className="mt-8 space-y-3.5">
                {PREMIUM_FEATURES.map(p => (<div key={p} className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 shrink-0">✦</span><span className="text-sm text-neutral-300 leading-relaxed">{p}</span></div>))}
              </div>
              <div className="mt-8 text-center"><button type="button" onClick={scrollToAuth} className="rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-black transition hover:bg-emerald-400">Try Premium free for 7 days</button></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA + AUTH ── */}
      <section ref={authRef} className="py-20 px-6 border-t border-white/5" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="mx-auto max-w-md text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">Start your first green day</h2>
            <p className="text-neutral-500 text-sm mb-8">Free plan available. No credit card required.</p>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">{renderAuthForm()}</div>
          </Reveal>
        </div>
      </section>

      {/* ── SEO ── */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="mx-auto max-w-3xl space-y-4 text-xs text-neutral-600 leading-relaxed">
          <p>Routines365 is a daily habit tracker designed for people who want to build consistent morning routines, track fitness goals, practice breathwork, and journal with guided gratitude prompts. Whether you&apos;re building a Wim Hof breathing practice, tracking health metrics via Apple Health, or simply checking off your daily habits, Routines365 makes consistency simple.</p>
          <p>Features include streak tracking with milestones at 7, 14, 30, 50, 100, and 365 days; a guided journal with gratitude, intention, and reflection prompts; five breathwork techniques with audio cues; Qigong movement routines; Apple Health integration for sleep, HRV, heart rate, and steps; an accountability partner system; Pomodoro focus timer; activity logging for workouts and recovery; and a beautiful progress calendar that shows your consistency at a glance.</p>
          <p>Available as a native iOS app. Free to start with optional premium upgrade for biometric insights, sleep stage analysis, health auto-complete, unlimited habits, and custom themes. 76 built-in habits across morning, fitness, nutrition, recovery, mindfulness, and more.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5"><BrandIcon size={20} /><span className="text-xs font-bold tracking-wide uppercase text-neutral-500">Routines365</span></div>
          <p className="text-xs text-neutral-600">Stack your days. Change your life.</p>
          <div className="flex items-center gap-4 text-xs text-neutral-600">
            <a className="hover:text-neutral-400 transition-colors" href="/privacy">Privacy</a>
            <a className="hover:text-neutral-400 transition-colors" href="/terms">Terms</a>
            <a className="hover:text-neutral-400 transition-colors" href="mailto:support@routines365.com">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
