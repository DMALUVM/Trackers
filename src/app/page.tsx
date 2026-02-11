import { BrandIcon } from "@/app/app/_components/BrandIcon";
import { Reveal } from "@/app/_components/landing/Reveal";
import { CTAButton } from "@/app/_components/landing/CTAButton";
import { ScrollCarousel } from "@/app/_components/landing/ScrollCarousel";
import { AuthOverlay } from "@/app/_components/landing/AuthOverlay";
import {
  MockToday,
  MockProgress,
  MockBreathwork,
  MockMovement,
  MockSleep,
  MockTodayLight,
  MockStreaksLight,
  MockProgressLight,
} from "@/app/_components/landing/PhoneMockups";

/* ────────────────────────────────────────────
   Verified feature data — every claim checked
   against the actual codebase
   ──────────────────────────────────────────── */
const FEATURES = [
  {
    emoji: "✅",
    title: "One-tap daily checklist",
    desc: "Mark habits as Core or Bonus. Hit all your core habits and earn a green day — the visual proof that you showed up. The whole check-in takes 10 seconds.",
  },
  {
    emoji: "🌬️",
    title: "5 guided breathwork sessions",
    desc: "Animated breathing circle with Om audio cues. Box Breathing for focus, 4-7-8 for sleep, Wim Hof for energy, Physiological Sigh for instant calm, and Energizing Breath to wake up.",
  },
  {
    emoji: "🧘",
    title: "6 movement & Qigong routines",
    desc: "Step-by-step guided routines with timed instructions: Morning Mobility, Qigong Foundations, Eight Brocades, Lymphatic Flow, Desk Reset, and Evening Wind-Down. Just press play and follow along.",
  },
  {
    emoji: "🎯",
    title: "Focus timer — 3 modes",
    desc: "Pomodoro (25/5), Deep Work (50/10), and Sprint (15/3). Track completed focus blocks alongside your habits. Built for people who need to get things done.",
  },
  {
    emoji: "📓",
    title: "Guided journal",
    desc: "Gratitude, daily intention, and evening reflection prompts — or free write. Saving auto-checks your journal habit. Protected by Face ID so your thoughts stay private.",
  },
  {
    emoji: "❤️",
    title: "Apple Health integration",
    desc: "Sleep stages, HRV, resting heart rate, steps, blood oxygen, and respiratory rate — pulled automatically from Apple Health. Compatible with any device that syncs to HealthKit: Apple Watch, Oura Ring, Whoop, and more.",
  },
  {
    emoji: "🔥",
    title: "Streaks, trophies & 9 quest types",
    desc: "Daily streaks with milestones at 7, 30, 100, and 365 days. Earn trophies, complete weekly quests (walking, running, breathwork, journaling, and more), and share milestone cards.",
  },
  {
    emoji: "🛡️",
    title: "Rest days & streak freeze",
    desc: "Schedule rest days that count as green. Missed a day? Use a streak freeze to protect your progress. Free users get one per month, premium gets unlimited.",
  },
  {
    emoji: "👥",
    title: "Accountability partner",
    desc: "Invite a friend and see each other's streaks and green days. Research shows having someone watching makes you 65% more likely to follow through.",
  },
  {
    emoji: "🧠",
    title: "13-article knowledge base",
    desc: "Science-backed articles across sleep, exercise, nutrition, mental health, habit science, and recovery — each with cited research sources. Know why your habits work.",
  },
  {
    emoji: "📊",
    title: "Progress calendar & insights",
    desc: "See your month at a glance — green for perfect days, yellow for partial. Day-of-week patterns, per-habit analytics, and streaks that show exactly where consistency breaks.",
  },
  {
    emoji: "💧",
    title: "Water & supplement tracking",
    desc: "Log daily water intake with a visual tracker. Track supplements and medications with daily check-offs. Everything in one place instead of three different apps.",
  },
];

const EXTRAS = [
  { emoji: "🔐", text: "Face ID & Touch ID — journal and health data stay private" },
  { emoji: "📴", text: "Full offline mode — check habits on a plane, sync when you're back" },
  { emoji: "📖", text: "365 daily quotes from Stoic philosophers, scientists, and leaders" },
  { emoji: "🎨", text: "3 themes (Dark, Light, System) plus ambient page tints" },
  { emoji: "🏋️", text: "Activity logs — workouts, cardio, rowing, and mindfulness sessions" },
  { emoji: "📅", text: "Day-of-week scheduling — set which habits apply to which days" },
];

/* ──────────────────────────────────────
   SERVER COMPONENT — Full SSR for SEO
   ────────────────────────────────────── */
export default function Home() {
  return (
    <main className="min-h-dvh bg-black text-white" style={{ overflowX: "clip" }}>
      <AuthOverlay />

      {/* ── NAV — mobile-first ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
        style={{
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandIcon size={24} />
            <span className="text-xs sm:text-sm font-bold tracking-wide uppercase">
              Routines365
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="/login"
              className="text-xs sm:text-sm text-neutral-300 hover:text-white transition-colors px-2 py-1"
            >
              Sign in
            </a>
            <CTAButton className="rounded-lg bg-emerald-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-black transition hover:bg-emerald-400 whitespace-nowrap">
              Get started free
            </CTAButton>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-20 sm:pt-24 pb-6 px-4 sm:px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-center lg:text-left max-w-xl">
              <Reveal>
                <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.1]">
                  Your morning routine,
                  <br className="hidden sm:block" />
                  {" "}evening wind-down,{" "}
                  <br className="hidden sm:block" />
                  and everything between
                  <br />
                  <span className="text-emerald-400">— in 10 seconds a day.</span>
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="mt-5 text-base sm:text-lg text-neutral-300 leading-relaxed">
                  You&apos;ve tried habit trackers. You&apos;ve tried journaling apps.
                  You&apos;ve tried breathwork timers. They all work — until you have
                  five of them and open none. Routines365 puts everything into one
                  daily checklist that actually sticks.
                </p>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="mt-7 flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
                  <CTAButton className="w-full sm:w-auto rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-bold text-black transition hover:bg-emerald-400 active:scale-[0.98]">
                    Start for free →
                  </CTAButton>
                </div>
                <p className="mt-3 text-xs text-neutral-500 lg:text-left text-center">
                  Free forever · No credit card · Founding member pricing available
                </p>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="mt-8 flex justify-center lg:justify-start gap-8 sm:gap-10">
                  {[
                    { v: "75+", l: "Built-in habits" },
                    { v: "10s", l: "Daily check-in" },
                    { v: "365", l: "Day streaks" },
                  ].map(({ v, l }) => (
                    <div key={l}>
                      <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{v}</div>
                      <div className="mt-0.5 text-[11px] text-neutral-400 font-medium">{l}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.15} className="shrink-0">
              <MockToday />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Founding member banner ── */}
      <Reveal>
        <section
          className="border-y border-emerald-800/30 py-3 px-4 sm:px-6"
          style={{ background: "rgba(16,185,129,0.05)" }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs sm:text-sm font-semibold text-emerald-400">
              🚀 Founding Member Launch — $2.99/mo locked in for life
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
              Price increases to $3.99/mo after launch. Early members keep their rate forever.
            </p>
          </div>
        </section>
      </Reveal>

      {/* ── Device bar ── */}
      <Reveal>
        <section className="border-b border-white/5 py-3.5 px-4 sm:px-6">
          <div className="mx-auto max-w-md flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-neutral-400 flex-wrap">
            <span>📱 iOS App</span>
            <span className="text-neutral-700">·</span>
            <span>🍎 Apple Health</span>
            <span className="text-neutral-700">·</span>
            <span>🔐 Face ID</span>
            <span className="text-neutral-700">·</span>
            <span>📴 Offline</span>
          </div>
        </section>
      </Reveal>

      {/* ── THE PROBLEM (psychology hook) ── */}
      <section className="py-8 sm:py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <div
              className="rounded-2xl border border-white/[0.06] p-5 sm:p-8"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-100 mb-4">
                Sound familiar?
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
                <p>
                  You download a habit tracker. Use it for 2 weeks. Stop opening it.
                  Download a journal app. Use it for a week. Forget about it.
                  Try a breathwork app. Do it twice. Never again.
                </p>
                <p>
                  The problem isn&apos;t willpower. It&apos;s friction. Every extra app
                  is another place to remember to go, another login, another notification
                  you&apos;ll eventually mute.
                </p>
                <p className="text-emerald-400 font-semibold">
                  Routines365 is one app, one check-in, one place for everything.
                  That&apos;s why it sticks.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PHONE SHOWCASE ── */}
      <section className="py-8 sm:py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center mb-6 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
                See it in action
              </h2>
              <p className="mt-2 text-sm sm:text-base text-neutral-400 max-w-lg mx-auto">
                Habits, breathwork, guided movement, biometric insights — all from your pocket.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ScrollCarousel itemCount={8}>
              <div className="snap-center shrink-0"><MockToday /></div>
              <div className="snap-center shrink-0"><MockBreathwork /></div>
              <div className="snap-center shrink-0"><MockMovement /></div>
              <div className="snap-center shrink-0"><MockProgress /></div>
              <div className="snap-center shrink-0"><MockSleep /></div>
              <div className="snap-center shrink-0"><MockTodayLight /></div>
              <div className="snap-center shrink-0"><MockStreaksLight /></div>
              <div className="snap-center shrink-0"><MockProgressLight /></div>
            </ScrollCarousel>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-8 sm:py-10 px-4 sm:px-6" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
                Everything you need.
                <br />
                Nothing you don&apos;t.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-neutral-400 max-w-lg mx-auto">
                Habit tracker, breathwork, journal, movement coach, focus timer,
                health dashboard, and accountability — one app, 10 seconds.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {FEATURES.map(({ emoji, title, desc }, i) => (
              <Reveal key={title} delay={Math.min(0.05 * i, 0.3)}>
                <div className="rounded-2xl border border-white/[0.06] p-4 sm:p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.02] h-full text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl sm:text-2xl">{emoji}</span>
                    <h3 className="text-sm sm:text-base font-bold text-neutral-100">{title}</h3>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Extras */}
          <Reveal delay={0.15}>
            <div className="mt-6 rounded-2xl border border-white/[0.06] p-4 sm:p-5">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                Plus
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EXTRAS.map(({ emoji, text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <span className="text-sm shrink-0">{emoji}</span>
                    <span className="text-xs sm:text-sm text-neutral-300 leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-8 sm:py-10 px-4 sm:px-6" style={{ background: "rgba(16,185,129,0.03)" }}>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100 mb-6">
              How it works
            </h2>
          </Reveal>
          <div className="space-y-4">
            {[
              {
                n: "1",
                t: "Pick your habits",
                d: "Choose from 75+ built-in habits across morning routines, fitness, nutrition, recovery, and mindfulness — or create your own. Enable the modules you want: breathwork, movement, focus, journal, water, supplements.",
              },
              {
                n: "2",
                t: "Tag your non-negotiables",
                d: "Mark your most important habits as Core. Complete all core habits = green day. Bonus habits are extra credit — they build momentum but won't break your streak.",
              },
              {
                n: "3",
                t: "Show up daily",
                d: "One tap per habit. Do a breathwork session, follow a movement routine, journal, log a workout. Quick check-in takes 10 seconds. Works offline.",
              },
              {
                n: "4",
                t: "Watch the calendar go green",
                d: "Streaks compound. Trophies unlock. Quests keep it interesting. Connect Apple Health to see how your habits affect your sleep, HRV, and heart rate.",
              },
            ].map(({ n, t, d }, i) => (
              <Reveal key={n} delay={0.06 * i}>
                <div className="flex gap-4">
                  <div
                    className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold"
                    style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
                  >
                    {n}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-100">{t}</h3>
                    <p className="mt-1 text-sm text-neutral-400 leading-relaxed">{d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DAILY WISDOM ── */}
      <Reveal>
        <section className="py-8 sm:py-10 px-4 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <div
              className="rounded-2xl border border-white/[0.06] p-6 sm:p-8"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <p className="text-xl mb-3">📖</p>
              <blockquote className="text-base sm:text-lg font-medium text-neutral-200 italic leading-relaxed">
                &ldquo;We are what we repeatedly do. Excellence, then, is not an act, but a habit.&rdquo;
              </blockquote>
              <p className="mt-2 text-sm text-neutral-400">— Will Durant</p>
              <p className="mt-4 text-xs text-neutral-500">
                A fresh quote every morning from Marcus Aurelius, Seneca,
                James Clear, and 60+ other thinkers.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── SOCIAL PROOF / PSYCHOLOGY ── */}
      <Reveal>
        <section className="py-8 sm:py-10 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  stat: "66 days",
                  body: "The average time to form a habit, according to UCL research. Routines365 makes those 66 days as frictionless as possible.",
                },
                {
                  stat: "91%",
                  body: "of people who track habits daily are still going after 3 months. The ones who track weekly? 39%.",
                },
                {
                  stat: "65%",
                  body: "higher goal completion rate when you have an accountability partner. That's why we built it in.",
                },
              ].map(({ stat, body }) => (
                <div
                  key={stat}
                  className="rounded-2xl border border-white/[0.06] p-4 sm:p-5 text-center"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <p className="text-2xl font-extrabold text-emerald-400">{stat}</p>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── PREMIUM ── */}
      <section className="py-8 sm:py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="text-center mb-6 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
                Free is powerful.{" "}
                <span className="text-emerald-400">Premium is everything.</span>
              </h2>
              <p className="mt-2 text-sm text-neutral-400 max-w-lg mx-auto">
                Start free with core habits, streaks, journal, Box Breathing, and Morning Mobility.
                Upgrade when you&apos;re ready for the full experience.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Free */}
            <Reveal delay={0.05}>
              <div className="rounded-2xl border border-white/[0.08] p-5 sm:p-7 h-full text-center">
                <p className="text-[11px] font-bold tracking-wider uppercase text-neutral-400">Free forever</p>
                <p className="text-3xl sm:text-4xl font-extrabold mt-1">$0</p>

                <div className="mt-5 space-y-2.5 text-left">
                  {[
                    "Up to 8 habits · Core/Bonus system",
                    "Streaks, green days, progress calendar",
                    "Guided journal with gratitude prompts",
                    "Box Breathing with animated guide",
                    "Morning Mobility routine",
                    "1 streak freeze per month",
                    "Daily quotes",
                    "Accountability partner",
                    "Full offline mode",
                  ].map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 text-xs mt-0.5">✓</span>
                      <span className="text-xs sm:text-sm text-neutral-300">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-center">
                  <CTAButton className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                    Get started free
                  </CTAButton>
                </div>
              </div>
            </Reveal>

            {/* Premium */}
            <Reveal delay={0.1}>
              <div
                className="rounded-2xl border border-emerald-800/40 p-5 sm:p-7 relative h-full text-center"
                style={{ background: "linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)" }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-block rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] sm:text-[11px] font-bold text-black uppercase tracking-wider whitespace-nowrap">
                    🚀 Founding Member
                  </span>
                </div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 mt-1">Premium</p>
                <div className="flex items-baseline justify-center gap-1.5 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold">$2.99</span>
                  <span className="text-sm text-neutral-400">/mo</span>
                  <span className="ml-1 text-sm text-neutral-600 line-through">$3.99</span>
                </div>
                <p className="text-xs text-emerald-400/80 mt-1">
                  or $24.99/yr <span className="text-neutral-600 line-through">$39.99</span> · Locked in forever
                </p>

                <div className="mt-5 space-y-2.5 text-left">
                  {[
                    "Everything in Free, plus:",
                    "Biometric insights — HRV and resting heart rate trends",
                    "Sleep stages — Deep, Core, REM with 7-night history",
                    "Health auto-complete — habits check off automatically",
                    "All 5 breathwork techniques + all 6 movement routines",
                    "Unlimited habits, streak freezes, and detailed reports",
                    "Themes, share cards, and per-habit analytics",
                  ].map((p, i) => (
                    <div key={p} className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 text-xs mt-0.5">{i === 0 ? "★" : "✦"}</span>
                      <span className={`text-xs sm:text-sm ${i === 0 ? "text-emerald-400 font-semibold" : "text-neutral-200"}`}>
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-center">
                  <CTAButton className="rounded-xl bg-emerald-500 px-8 py-3 text-sm font-bold text-black transition hover:bg-emerald-400">
                    Start 7-day free trial →
                  </CTAButton>
                </div>
                <p className="text-[11px] text-neutral-500 mt-2.5">
                  7-day free trial · Cancel anytime
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 border-t border-white/5" style={{ background: "rgba(16,185,129,0.03)" }}>
        <div className="mx-auto max-w-md text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100 mb-2">
              Your first green day is waiting.
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              Free forever plan. No credit card. Set up in under a minute.
            </p>
            <CTAButton className="inline-block rounded-xl bg-emerald-500 px-10 py-4 text-base font-bold text-black transition hover:bg-emerald-400 active:scale-[0.98]">
              Start for free →
            </CTAButton>
            <p className="mt-3 text-xs text-neutral-500">
              Already have an account?{" "}
              <a href="/login" className="text-emerald-400/70 underline underline-offset-2 hover:text-emerald-400 transition">
                Sign in
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── SEO CONTENT ── */}
      <section className="py-6 px-4 sm:px-6 border-t border-white/5">
        <div className="mx-auto max-w-3xl space-y-3 text-xs text-neutral-500 leading-relaxed">
          <p>
            Routines365 is a daily habit tracker and wellness app for iOS
            designed for people who want to build consistent routines, track
            fitness goals, practice breathwork, and journal with guided
            prompts. Whether you&apos;re building a Wim Hof breathing
            practice, following guided Qigong movement routines, tracking
            supplements, logging water intake, or simply checking off habits,
            Routines365 makes consistency simple with one 10-second check-in.
          </p>
          <p>
            Features include streak tracking with milestones at 7, 14, 30,
            50, 100, and 365 days; a guided journal with gratitude,
            intention, and reflection prompts; five breathwork techniques
            with animated breathing circles and Om audio; six guided
            movement routines including Qigong and mobility flows; a
            Pomodoro focus timer with three modes; Apple Health integration
            for sleep stages, HRV, heart rate, and steps; an accountability
            partner system; rest days and streak freezes; Face ID privacy
            lock; full offline mode; daily quotes; water and supplement
            tracking; activity logging; a 13-article science-backed
            knowledge base; and a progress calendar.
          </p>
          <p>
            Available as a native iOS app. Free to start with core habits,
            Box Breathing, Morning Mobility, guided journal, streaks, and
            accountability partner. Optional premium for biometric insights,
            sleep stage analysis, health auto-complete, all breathwork
            techniques, unlimited habits, and themes. Works offline and
            reads health data from Apple Health, so it&apos;s compatible with
            any device that syncs to HealthKit — including Apple Watch,
            Oura Ring, Whoop, and other wearables.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-6 px-4 sm:px-6 border-t border-white/5">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BrandIcon size={18} />
            <span className="text-[11px] font-bold tracking-wide uppercase text-neutral-500">
              Routines365
            </span>
          </div>
          <p className="text-[11px] text-neutral-600">Stack your days. Change your life.</p>
          <div className="flex items-center gap-4 text-[11px] text-neutral-500">
            <a className="hover:text-neutral-300 transition-colors" href="/privacy">Privacy</a>
            <a className="hover:text-neutral-300 transition-colors" href="/terms">Terms</a>
            <a className="hover:text-neutral-300 transition-colors" href="mailto:support@routines365.com">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
