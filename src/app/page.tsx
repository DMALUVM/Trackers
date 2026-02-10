import { BrandIcon } from "@/app/app/_components/BrandIcon";
import { Reveal } from "@/app/_components/landing/Reveal";
import { CTAButton } from "@/app/_components/landing/CTAButton";
import { AuthBlock } from "@/app/_components/landing/AuthBlock";
import { AuthOverlay } from "@/app/_components/landing/AuthOverlay";
import {
  MockToday,
  MockProgress,
  MockStreaks,
  MockSleep,
} from "@/app/_components/landing/PhoneMockups";

/* ────────────────────────────────────────────
   Feature / marketing data
   ──────────────────────────────────────────── */
const FEATURES = [
  {
    emoji: "✅",
    title: "One-tap daily checklist",
    desc: "Mark habits as Core or Bonus. Complete all your core habits and you earn a green day. Takes about 10 seconds.",
  },
  {
    emoji: "📓",
    title: "Guided journal",
    desc: "Gratitude prompts, daily intention, and reflection — or switch to free write. Saving auto-checks your journal habit for the day.",
  },
  {
    emoji: "🌬️",
    title: "Breathwork & Qigong",
    desc: "Five guided breathing techniques (Box, 4-7-8, Wim Hof, Physiological Sigh, Energizing) with Om audio cues, plus Qigong movement routines.",
  },
  {
    emoji: "🔥",
    title: "Streaks, trophies & quests",
    desc: "Build daily streaks with milestones at 7, 30, 100, and 365 days. Earn trophies, complete weekly quests, and use rest days to protect your streak.",
  },
  {
    emoji: "❤️",
    title: "Apple Health integration",
    desc: "See sleep, HRV, resting heart rate, steps, blood oxygen, and respiratory rate — pulled from Apple Health. Works with any wearable that syncs to HealthKit.",
  },
  {
    emoji: "👥",
    title: "Accountability partner",
    desc: "Invite a friend and track each other's progress. Send cheers when they hit milestones. Stay motivated together.",
  },
  {
    emoji: "🎯",
    title: "Focus timer",
    desc: "Pomodoro-style deep work sessions. Track completed focus blocks right alongside your habits.",
  },
  {
    emoji: "📊",
    title: "Progress & insights",
    desc: "Beautiful progress calendar, sleep stage charts (Deep, Core, REM), day-of-week patterns, and personalized insights that get smarter over time.",
  },
];

const PREMIUM_FEATURES = [
  "Biometric insights — HRV trends and resting heart rate analysis",
  "Sleep stage breakdown — Deep, Core, and REM with 7-night trends",
  "Health auto-complete — habits check themselves when Apple Health data hits your goals",
  "Unlimited habits, unlimited streak freezes, and detailed reports",
  "Custom themes, share cards, and per-habit analytics",
];

/* ──────────────────────────────────────
   SERVER COMPONENT — Marketing Landing Page
   All content is server-rendered for SEO.
   Auth + animations are client components.
   ────────────────────────────────────── */
export default function Home() {
  return (
    <main className="min-h-dvh bg-black text-white overflow-x-hidden">
      {/* Splash overlay: covers page while checking auth, redirects if signed in, vanishes when signed out */}
      <AuthOverlay />

      {/* All marketing content below is server-rendered HTML for SEO */}

      {/* Sticky nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandIcon size={28} />
            <span className="text-sm font-bold tracking-wide uppercase">
              Routines365
            </span>
          </div>
          <CTAButton className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
            Get started free
          </CTAButton>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.06]"
            style={{
              background:
                "radial-gradient(circle, #10b981 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Copy */}
            <div className="flex-1 text-center lg:text-left max-w-xl">
              <Reveal>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08]">
                  Habits, journal,
                  <br />
                  breathwork, streaks
                  <br />
                  <span className="text-emerald-400">
                    — one app, 10 seconds
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 text-lg text-neutral-400 leading-relaxed">
                  Stop juggling five apps for your morning routine.
                  Routines365 puts habit tracking, guided journaling,
                  breathwork sessions, Apple Health insights, and
                  accountability into one beautiful daily checklist.
                  Check in once, and watch consistency compound.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
                  <CTAButton className="w-full sm:w-auto rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-black transition hover:bg-emerald-400 active:scale-[0.98]">
                    Start for free →
                  </CTAButton>
                  {/* <a href="https://apps.apple.com/app/routines365/id..."><img src="/app-store-badge.svg" alt="Download on the App Store" className="h-12" /></a> */}
                </div>
                <p className="mt-4 text-xs text-neutral-600 lg:text-left text-center">
                  Free plan available · Premium from $3.99/mo · 76
                  built-in habits
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mt-10 flex justify-center lg:justify-start gap-10">
                  {[
                    { v: "76", l: "Built-in habits" },
                    { v: "10s", l: "Daily check-in" },
                    { v: "365", l: "Day streaks" },
                  ].map(({ v, l }) => (
                    <div key={l}>
                      <div className="text-3xl font-extrabold text-emerald-400">
                        {v}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500 font-medium">
                        {l}
                      </div>
                    </div>
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
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                See the app in action
              </h2>
              <p className="mt-3 text-neutral-500 max-w-lg mx-auto">
                Track habits, review progress, build streaks, and
                understand your health — all from your pocket.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar justify-start lg:justify-center">
              <div className="snap-center shrink-0">
                <MockToday />
              </div>
              <div className="snap-center shrink-0">
                <MockProgress />
              </div>
              <div className="snap-center shrink-0">
                <MockStreaks />
              </div>
              <div className="snap-center shrink-0">
                <MockSleep />
              </div>
            </div>
            <p className="text-center text-xs text-neutral-600 mt-4 lg:hidden">
              ← Swipe to see more screens →
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        className="py-20 px-6"
        style={{ background: "rgba(255,255,255,0.01)" }}
      >
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Replace five apps
                <br />
                with one daily ritual
              </h2>
              <p className="mt-4 text-neutral-500 max-w-lg mx-auto">
                Habit tracker, journal, breathwork guide, health dashboard,
                and accountability partner — built into one app that takes
                10 seconds a day.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ emoji, title, desc }, i) => (
              <Reveal key={title} delay={0.05 * i}>
                <div className="group rounded-2xl border border-white/[0.06] p-6 transition-colors hover:border-white/[0.12] hover:bg-white/[0.02] h-full">
                  <span className="text-2xl">{emoji}</span>
                  <h3 className="mt-3 text-base font-bold text-neutral-100">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        className="py-20 px-6"
        style={{ background: "rgba(16,185,129,0.03)" }}
      >
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight mb-14">
              How it works
            </h2>
          </Reveal>
          <div className="space-y-8">
            {[
              {
                n: "1",
                t: "Pick your habits",
                d: "Choose from 76 built-in habits across morning routines, fitness, nutrition, recovery, and mindfulness — or create your own.",
              },
              {
                n: "2",
                t: "Mark your Core",
                d: "Tag your non-negotiable habits. Complete all of them and you earn a green day.",
              },
              {
                n: "3",
                t: "Check in daily",
                d: "One tap per habit. Log activities, write in your journal, practice breathwork. Quick check-in takes 10 seconds.",
              },
              {
                n: "4",
                t: "Watch consistency compound",
                d: "Build streaks, earn trophies, fill your calendar with green. Biometric insights reveal how your habits affect your body.",
              },
            ].map(({ n, t, d }, i) => (
              <Reveal key={n} delay={0.08 * i}>
                <div className="flex gap-5">
                  <div
                    className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold"
                    style={{
                      background: "rgba(16,185,129,0.15)",
                      color: "#10b981",
                    }}
                  >
                    {n}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-100">
                      {t}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
                      {d}
                    </p>
                  </div>
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
            <div
              className="rounded-3xl border border-emerald-800/40 p-8 sm:p-10"
              style={{
                background:
                  "linear-gradient(180deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 100%)",
              }}
            >
              <div className="text-center">
                <p className="text-xs font-bold tracking-wider uppercase text-emerald-400 mb-2">
                  Premium
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Go deeper with insights
                </h2>
                <p className="mt-3 text-neutral-500 text-sm">
                  7-day free trial · $3.99/month or $29.99/year (37% off)
                </p>
              </div>
              <div className="mt-8 space-y-3.5">
                {PREMIUM_FEATURES.map((p) => (
                  <div key={p} className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5 shrink-0">
                      ✦
                    </span>
                    <span className="text-sm text-neutral-300 leading-relaxed">
                      {p}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <CTAButton className="rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-black transition hover:bg-emerald-400">
                  Try Premium free for 7 days
                </CTAButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA + AUTH ── */}
      <section
        id="auth-section"
        className="py-20 px-6 border-t border-white/5"
        style={{ background: "rgba(255,255,255,0.01)" }}
      >
        <div className="mx-auto max-w-md text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Start your first green day
            </h2>
            <p className="text-neutral-500 text-sm mb-8">
              Free plan available. No credit card required.
            </p>
            <AuthBlock />
          </Reveal>
        </div>
      </section>

      {/* ── SEO ── */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="mx-auto max-w-3xl space-y-4 text-xs text-neutral-600 leading-relaxed">
          <p>
            Routines365 is a daily habit tracker designed for people who
            want to build consistent morning routines, track fitness goals,
            practice breathwork, and journal with guided gratitude prompts.
            Whether you&apos;re building a Wim Hof breathing practice,
            tracking health metrics via Apple Health, or simply checking off
            your daily habits, Routines365 makes consistency simple.
          </p>
          <p>
            Features include streak tracking with milestones at 7, 14, 30,
            50, 100, and 365 days; a guided journal with gratitude,
            intention, and reflection prompts; five breathwork techniques
            with audio cues; Qigong movement routines; Apple Health
            integration for sleep, HRV, heart rate, and steps; an
            accountability partner system; Pomodoro focus timer; activity
            logging for workouts and recovery; and a beautiful progress
            calendar that shows your consistency at a glance.
          </p>
          <p>
            Available as a native iOS app. Free to start with optional
            premium upgrade for biometric insights, sleep stage analysis,
            health auto-complete, unlimited habits, and custom themes. 76
            built-in habits across morning, fitness, nutrition, recovery,
            mindfulness, and more.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BrandIcon size={20} />
            <span className="text-xs font-bold tracking-wide uppercase text-neutral-500">
              Routines365
            </span>
          </div>
          <p className="text-xs text-neutral-600">
            Stack your days. Change your life.
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-600">
            <a
              className="hover:text-neutral-400 transition-colors"
              href="/privacy"
            >
              Privacy
            </a>
            <a
              className="hover:text-neutral-400 transition-colors"
              href="/terms"
            >
              Terms
            </a>
            <a
              className="hover:text-neutral-400 transition-colors"
              href="mailto:support@routines365.com"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
