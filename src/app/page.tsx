import Image from "next/image";
import { BrandIcon } from "@/app/app/_components/BrandIcon";
import { Reveal } from "@/app/_components/landing/Reveal";
import { CTAButton } from "@/app/_components/landing/CTAButton";
import { ScrollCarousel } from "@/app/_components/landing/ScrollCarousel";
import { AuthOverlay } from "@/app/_components/landing/AuthOverlay";
import {
  MockToday,
} from "@/app/_components/landing/PhoneMockups";

/* ── App Store link — update this once approved ── */
const APP_STORE_URL = "https://apps.apple.com/app/routines365/id0000000000";

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
    emoji: "🏋️",
    title: "Barbell & WODs",
    desc: "Track personal records across 27 lifts organized by category — Olympic, Squat, Press, Pull, and Gymnastics. Log benchmark workouts like Fran, Murph, and Grace with Rx'd/Scaled tracking and automatic PR detection.",
  },
  {
    emoji: "🏁",
    title: "Hybrid Race training",
    desc: "Train for 8-station fitness races with curated workouts targeting each station. Log race results with per-segment split times, track your personal best, and watch your total time drop.",
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
    desc: "Sleep stages, HRV, resting heart rate, steps, blood oxygen, and respiratory rate — pulled automatically from Apple Health. Compatible with devices that sync to HealthKit, including Apple Watch, Oura Ring, and WHOOP.",
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
    desc: "Invite a friend and see each other\u2019s streaks and green days. Having someone to check in with can help you stay committed to your goals.",
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
  { emoji: "📴", text: "Full offline mode — check habits on a plane, sync when you\u2019re back" },
  { emoji: "📖", text: "365 daily quotes from Stoic philosophers, scientists, and leaders" },
  { emoji: "🎨", text: "3 themes (Dark, Light, System) plus ambient page tints" },
  { emoji: "🚣", text: "Activity logs — workouts, cardio, rowing, and mindfulness sessions" },
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
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener"
              className="rounded-lg bg-emerald-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-black transition hover:bg-emerald-400 whitespace-nowrap"
            >
              Download free
            </a>
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
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener"
                    className="transition hover:opacity-90 active:scale-[0.98]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/app-store-badge.svg"
                      alt="Download on the App Store"
                      width={156}
                      height={52}
                      className="h-[52px] w-auto"
                    />
                  </a>
                  <CTAButton className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-bold text-white transition hover:bg-white/10 active:scale-[0.98]">
                    Or use on web →
                  </CTAButton>
                </div>
                <p className="mt-3 text-xs text-neutral-500 lg:text-left text-center">
                  Free on the App Store · No credit card · Premium unlocks everything
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

      {/* ── Launch pricing banner ── */}
      <Reveal>
        <section
          className="border-y border-emerald-800/30 py-3 px-4 sm:px-6"
          style={{ background: "rgba(16,185,129,0.05)" }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs sm:text-sm font-semibold text-emerald-400">
              ☕ Less than a coffee a month. The habits last longer too.
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
              7-day free trial, then $3.99/mo or $29.99/yr (save 37%). Cancel anytime.
            </p>
          </div>
        </section>
      </Reveal>

      {/* ── Device bar ── */}
      <Reveal>
        <section className="border-b border-white/5 py-3.5 px-4 sm:px-6">
          <div className="mx-auto max-w-md flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-neutral-400 flex-wrap">
            <span>📱 Free on App Store</span>
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
            <ScrollCarousel itemCount={10} itemWidth={290}>
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <div key={n} className="snap-center shrink-0">
                  <Image
                    src={`/screenshots/slide_${n}.png`}
                    alt={`Routines365 screenshot ${n}`}
                    width={290}
                    height={627}
                    className="rounded-2xl"
                    style={{ width: 290, height: "auto" }}
                    priority={n <= 3}
                  />
                </div>
              ))}
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
                health dashboard, barbell PRs, race training, and accountability — one app, 10 seconds.
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
                d: "Choose from 75+ built-in habits across morning routines, fitness, nutrition, recovery, and mindfulness — or create your own. Enable the modules you want: breathwork, movement, focus, journal, water, supplements, barbell PRs, and race training.",
              },
              {
                n: "2",
                t: "Tag your non-negotiables",
                d: "Mark your most important habits as Core. Complete all core habits = green day. Bonus habits are extra credit — they build momentum but won\u2019t break your streak.",
              },
              {
                n: "3",
                t: "Show up daily",
                d: "One tap per habit. Do a breathwork session, follow a movement routine, journal, log a workout, hit a new PR. Quick check-in takes 10 seconds. Works offline.",
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

      {/* ── SCIENCE-BACKED INSIGHTS ── */}
      <Reveal>
        <section className="py-8 sm:py-10 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  stat: "~66 days",
                  body: "The average time to form a habit in a 2009 UCL study by Phillippa Lally et al., with individual results ranging from 18 to 254 days depending on the person and behavior.",
                  cite: "Lally et al., European Journal of Social Psychology, 2010",
                },
                {
                  stat: "2\u20133\u00d7",
                  body: "People who track their progress on goals are significantly more likely to achieve them, according to a meta-analysis of over 19,000 participants on self-monitoring and goal attainment.",
                  cite: "Harkin et al., Psychological Bulletin, 2016",
                },
                {
                  stat: "76%",
                  body: "In a Dominican University study, participants who wrote down goals and shared weekly updates with a friend completed 76% of them, vs. 43% for those who only thought about their goals.",
                  cite: "Matthews, Dominican University of California, 2007",
                },
              ].map(({ stat, body, cite }) => (
                <div
                  key={stat}
                  className="rounded-2xl border border-white/[0.06] p-4 sm:p-5 text-center"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <p className="text-2xl font-extrabold text-emerald-400">{stat}</p>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">{body}</p>
                  <p className="mt-2 text-[10px] text-neutral-600 italic">{cite}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[10px] text-neutral-600">
              Individual results may vary. These statistics reflect published research findings and are not guarantees of specific outcomes.
            </p>
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
                    "Up to 8 habits \u00b7 Core/Bonus system",
                    "Streaks, green days, progress calendar",
                    "Guided journal with gratitude prompts",
                    "Box Breathing with animated guide",
                    "Morning Mobility + Qigong Foundations routines",
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
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener"
                    className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Download free
                  </a>
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
                    7-Day Free Trial
                  </span>
                </div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 mt-1">Premium</p>
                <div className="flex items-baseline justify-center gap-1.5 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold">$2.50</span>
                  <span className="text-sm text-neutral-400">/mo</span>
                </div>
                <p className="text-xs text-emerald-400/80 mt-1">
                  $29.99/yr (save 37%) · or $3.99/mo
                </p>

                <div className="mt-5 space-y-2.5 text-left">
                  {[
                    "Everything in Free, plus:",
                    "Biometric insights \u2014 HRV and resting heart rate trends",
                    "Sleep stages \u2014 Deep, Core, REM with 7-night history",
                    "Health auto-complete \u2014 habits check off automatically",
                    "All 5 breathwork techniques + all 6 movement routines",
                    "Barbell & WODs \u2014 PR tracking across 27 lifts + benchmarks",
                    "Hybrid Race \u2014 split-time logging + 8 training workouts",
                    "Unlimited habits, streak freezes, and detailed reports",
                    "Share cards, per-habit analytics, and PDF reports",
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
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener"
                    className="rounded-xl bg-emerald-500 px-8 py-3 text-sm font-bold text-black transition hover:bg-emerald-400"
                  >
                    Start 7-day free trial →
                  </a>
                </div>
                <p className="text-[11px] text-neutral-500 mt-2.5">
                  7-day free trial · Cancel anytime · Billed through the App Store
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── HEALTH DISCLAIMER ── */}
      <Reveal>
        <section className="py-5 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div
              className="rounded-2xl border border-white/[0.06] p-4 sm:p-5"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                ⚕️ Health information disclaimer
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Routines365 is a habit-tracking and wellness tool designed to help you build
                consistent daily routines. It is <strong className="text-neutral-400">not a medical device</strong> and
                does not provide medical advice, diagnosis, or treatment. Health metrics displayed
                in the app (including data from Apple Health such as heart rate variability, resting
                heart rate, sleep stages, blood oxygen, and respiratory rate) are for{" "}
                <strong className="text-neutral-400">general informational and motivational purposes only</strong> and
                should not be used to make medical decisions. Always consult a qualified healthcare
                provider before starting any new health or exercise program or making changes to
                an existing one. If you have a medical condition or are taking medication, seek
                professional medical advice before relying on any information displayed in this app.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── FINAL CTA ── */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 border-t border-white/5" style={{ background: "rgba(16,185,129,0.03)" }}>
        <div className="mx-auto max-w-md text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100 mb-2">
              Your first green day is waiting.
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              Free on the App Store. No credit card. Set up in under a minute.
            </p>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener"
              className="inline-block transition hover:opacity-90 active:scale-[0.98]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/app-store-badge.svg"
                alt="Download on the App Store"
                width={180}
                height={60}
                className="h-[60px] w-auto mx-auto"
              />
            </a>
            <p className="mt-4 text-xs text-neutral-500">
              Already have an account?{" "}
              <a href="/login" className="text-emerald-400/70 underline underline-offset-2 hover:text-emerald-400 transition">
                Sign in on web
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
            supplements, logging water intake, tracking barbell personal
            records, training for hybrid fitness races, or simply checking
            off habits, Routines365 makes consistency simple with one
            10-second check-in.
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
            tracking; Barbell &amp; WODs with PR tracking across 27 lifts
            and 19 benchmark workouts; Hybrid Race training with
            split-time logging and curated station workouts; activity
            logging; a 13-article science-backed knowledge base; and a
            progress calendar.
          </p>
          <p>
            Available as a native iOS app. Free to start with core habits,
            Box Breathing, Morning Mobility, guided journal, streaks, and
            accountability partner. Optional premium for biometric insights,
            sleep stage analysis, health auto-complete, all breathwork
            techniques, barbell PR tracking, race training, unlimited habits,
            and themes. Works offline and reads health data from Apple Health,
            so it&apos;s compatible with any device that syncs to HealthKit —
            including Apple Watch and other wearables.
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
            <a className="hover:text-neutral-300 transition-colors" href={APP_STORE_URL} target="_blank" rel="noopener">App Store</a>
            <a className="hover:text-neutral-300 transition-colors" href="/privacy">Privacy</a>
            <a className="hover:text-neutral-300 transition-colors" href="/terms">Terms</a>
            <a className="hover:text-neutral-300 transition-colors" href="/support">Support</a>
          </div>
        </div>

        {/* ── Trademark & Legal Notices ── */}
        <div className="mx-auto max-w-5xl mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] text-neutral-700 leading-relaxed text-center">
            Apple, the Apple logo, App Store, Apple Health, HealthKit, Apple Watch, Face ID,
            and Touch ID are trademarks of Apple Inc., registered in the U.S. and other
            countries. Oura Ring is a trademark of Oura Health Oy. WHOOP is a trademark of
            Whoop, Inc. Routines365 is not affiliated with, endorsed by, or sponsored by
            Apple Inc., Oura Health Oy, or Whoop, Inc. All third-party trademarks are the
            property of their respective owners.
          </p>
          <p className="text-[10px] text-neutral-700 leading-relaxed text-center mt-2">
            Health data displayed in the app is for informational purposes only and is not
            intended as medical advice. Consult a healthcare professional before making
            changes to your health routine. Research statistics cited on this page are from
            published academic studies and reflect averages — individual results may vary.
            Subscription pricing is in USD and may vary by region. Subscriptions are billed
            through the App Store and are subject to Apple&apos;s terms and conditions.
          </p>
          <p className="text-[10px] text-neutral-700 text-center mt-2">
            © {new Date().getFullYear()} Routines365. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
