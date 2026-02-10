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
} from "@/app/_components/landing/PhoneMockups";

/* ────────────────────────────────────────────
   Feature / marketing data
   ──────────────────────────────────────────── */
const FEATURES = [
  {
    emoji: "✅",
    title: "One-tap daily checklist",
    desc: "Mark habits as Core or Bonus. Complete all your core habits and you earn a green day — miss none and your streak keeps climbing. The whole check-in takes about 10 seconds.",
  },
  {
    emoji: "🌬️",
    title: "Guided breathwork sessions",
    desc: "Five techniques with animated breathing circles and Om audio cues: Box Breathing (Navy SEALs), 4-7-8 Relaxation, Wim Hof Power Breath, Physiological Sigh, and Energizing Breath. Start a session, follow the circle, feel the shift.",
  },
  {
    emoji: "🧘",
    title: "Movement & Qigong routines",
    desc: "Seven step-by-step guided routines: Morning Mobility, Qigong Foundations, Desk Reset, Evening Wind-Down, and more. Each movement has timed instructions so you just follow along.",
  },
  {
    emoji: "🎯",
    title: "Focus timer",
    desc: "Three modes — Pomodoro (25/5), Deep Work (50/10), and Sprint (15/3). Track completed focus blocks alongside your habits. Built-in break reminders keep you sharp.",
  },
  {
    emoji: "📓",
    title: "Guided journal",
    desc: "Gratitude prompts, daily intention, and evening reflection — or switch to free write. Saving auto-checks your journal habit. Your entries are private and protected with Face ID.",
  },
  {
    emoji: "❤️",
    title: "Apple Health integration",
    desc: "Sleep stages, HRV, resting heart rate, steps, blood oxygen, and respiratory rate — pulled automatically from Apple Health. Works with Apple Watch, Oura, Whoop, or any HealthKit-connected wearable.",
  },
  {
    emoji: "🔥",
    title: "Streaks, trophies & quests",
    desc: "Build daily streaks with milestones at 7, 30, 100, and 365 days. Earn trophies, complete 9 types of weekly quests, and share milestone cards with friends when you hit a new personal best.",
  },
  {
    emoji: "🛡️",
    title: "Rest days & streak freeze",
    desc: "Life happens. Schedule rest days that count as green, or use a streak freeze to protect your streak when you miss a day. Free users get one freeze per month — premium gets unlimited.",
  },
  {
    emoji: "👥",
    title: "Accountability partner",
    desc: "Invite a friend and see each other's streaks and green days. Send cheers when they hit milestones. Having someone watching makes you 65% more likely to complete a goal.",
  },
  {
    emoji: "🧠",
    title: "Science-backed knowledge base",
    desc: "13 articles across sleep, exercise, nutrition, mental health, habit science, and recovery — each with cited research. Understand why your habits work, not just that they do.",
  },
  {
    emoji: "📊",
    title: "Progress & insights",
    desc: "Beautiful progress calendar, day-of-week patterns, per-habit analytics, and personalized insights that get smarter over time. See exactly where your consistency breaks down.",
  },
  {
    emoji: "💧",
    title: "Water & supplement tracking",
    desc: "Log daily water intake with a visual tracker. Track your supplement and medication stack with daily check-offs. Everything in one place instead of scattered across apps.",
  },
];

const MORE_FEATURES = [
  { emoji: "🔐", text: "Face ID & Touch ID lock — your journal and health data stay private" },
  { emoji: "📴", text: "Full offline mode — check habits on a plane, sync when you're back" },
  { emoji: "📖", text: "365 daily stoic quotes — fresh wisdom every morning to set your intention" },
  { emoji: "🎨", text: "7 custom themes — dark, light, midnight, forest, ocean, sunset, and rose" },
  { emoji: "🏋️", text: "Activity logging — workouts, cardio, rowing, mindfulness sessions with notes" },
  { emoji: "🔔", text: "Smart recommendations — personalized suggestions based on your patterns" },
];

const PREMIUM_FEATURES = [
  "Biometric insights — HRV trends and resting heart rate analysis",
  "Sleep stage breakdown — Deep, Core, and REM with 7-night trends",
  "Health auto-complete — habits check themselves when Apple Health data hits your goals",
  "Unlimited habits, unlimited streak freezes, and detailed reports",
  "Premium breathwork — Wim Hof, 4-7-8, Physiological Sigh, Energizing",
  "Custom themes, milestone share cards, and per-habit analytics",
];

/* ──────────────────────────────────────
   SERVER COMPONENT — Marketing Landing Page
   All content is server-rendered for SEO.
   Auth + animations are client components.
   ────────────────────────────────────── */
export default function Home() {
  return (
    <main className="min-h-dvh bg-black text-white" style={{ overflowX: "clip" }}>
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
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm text-neutral-400 hover:text-white transition-colors">
              Sign in
            </a>
            <CTAButton className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
              Get started free
            </CTAButton>
          </div>
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
                  Habits, breathwork,
                  <br />
                  journal, streaks
                  <br />
                  <span className="text-emerald-400">
                    — one app, 10 seconds
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 text-lg text-neutral-400 leading-relaxed">
                  Stop juggling five apps for your morning routine.
                  Routines365 puts habit tracking, guided breathwork,
                  journaling, movement routines, Apple Health insights, and
                  accountability into one beautiful daily checklist.
                  Check in once, and watch consistency compound.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
                  <CTAButton className="w-full sm:w-auto rounded-xl bg-emerald-500 px-8 py-4 text-base font-bold text-black transition hover:bg-emerald-400 active:scale-[0.98]">
                    Start for free →
                  </CTAButton>
                  {/* TODO: Uncomment once App Store listing is live
                  <a href="https://apps.apple.com/app/routines365/idXXXXXX">
                    <img src="/app-store-badge.svg" alt="Download on the App Store" className="h-12" />
                  </a> */}
                </div>
                <p className="mt-4 text-xs text-neutral-600 lg:text-left text-center">
                  Free forever plan · Founding member pricing: $2.99/mo · 76
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

      {/* ── Founding member banner ── */}
      <Reveal>
        <section className="border-y border-emerald-800/30 py-4 px-6" style={{ background: "rgba(16,185,129,0.04)" }}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-emerald-400">
              🚀 Founding Member Launch — Lock in $2.99/mo for life
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Price goes to $3.99/mo after launch. Early members keep their rate forever.
            </p>
          </div>
        </section>
      </Reveal>

      {/* ── Device bar ── */}
      <Reveal>
        <section className="border-b border-white/5 py-5 px-6">
          <div className="mx-auto max-w-3xl flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-neutral-500">
            <span>📱 iOS App</span>
            <span className="text-neutral-700">·</span>
            <span>🍎 Apple Health</span>
            <span className="text-neutral-700">·</span>
            <span>🔐 Face ID</span>
            <span className="text-neutral-700">·</span>
            <span>📴 Works offline</span>
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
                Track habits, practice breathwork, follow guided movement routines,
                and understand your health — all from your pocket.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ScrollCarousel>
              <div className="snap-center shrink-0">
                <MockToday />
              </div>
              <div className="snap-center shrink-0">
                <MockBreathwork />
              </div>
              <div className="snap-center shrink-0">
                <MockMovement />
              </div>
              <div className="snap-center shrink-0">
                <MockProgress />
              </div>
              <div className="snap-center shrink-0">
                <MockSleep />
              </div>
            </ScrollCarousel>
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
                Habit tracker, breathwork guide, journal, movement coach, focus timer,
                health dashboard, and accountability partner — built into one
                app that takes 10 seconds a day.
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

          {/* More features - compact list */}
          <Reveal delay={0.2}>
            <div className="mt-10 rounded-2xl border border-white/[0.06] p-6">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">
                Plus everything else you need
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MORE_FEATURES.map(({ emoji, text }) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <span className="text-base shrink-0">{emoji}</span>
                    <span className="text-sm text-neutral-400 leading-relaxed">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
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
                d: "Choose from 76 built-in habits across morning routines, fitness, nutrition, recovery, and mindfulness — or create your own. Enable the modules you care about: breathwork, movement, focus, journal, water, supplements.",
              },
              {
                n: "2",
                t: "Mark your Core",
                d: "Tag your non-negotiable habits as Core. Complete all of them and you earn a green day. Bonus habits are extra credit — they count but don't break your streak.",
              },
              {
                n: "3",
                t: "Check in daily",
                d: "One tap per habit. Do a breathwork session, follow a movement routine, write in your journal, log a workout. Quick check-in takes 10 seconds. Works offline — sync when you're back.",
              },
              {
                n: "4",
                t: "Watch consistency compound",
                d: "Build streaks, earn trophies, complete quests, fill your calendar with green. Connect Apple Health and discover how your habits affect your sleep, HRV, and heart rate over time.",
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

      {/* ── DAILY WISDOM ── */}
      <Reveal>
        <section className="py-16 px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div
              className="rounded-2xl border border-white/[0.06] p-8"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <p className="text-2xl mb-4">📖</p>
              <blockquote className="text-lg font-medium text-neutral-300 italic leading-relaxed">
                &ldquo;We are what we repeatedly do. Excellence, then, is not an act, but a habit.&rdquo;
              </blockquote>
              <p className="mt-3 text-sm text-neutral-500">
                — Will Durant
              </p>
              <p className="mt-6 text-xs text-neutral-600">
                365 curated quotes from Stoic philosophers, scientists, and leaders.
                A fresh one every morning to set your intention.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── PREMIUM ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Free is powerful. Premium is next-level.
              </h2>
              <p className="mt-3 text-neutral-500 text-sm max-w-lg mx-auto">
                Start free with core habits, streaks, journal, Box Breathing, and Morning Mobility.
                Upgrade when you want the full experience.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free tier */}
            <Reveal delay={0.05}>
              <div className="rounded-3xl border border-white/[0.08] p-8 h-full">
                <p className="text-xs font-bold tracking-wider uppercase text-neutral-400 mb-2">
                  Free forever
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">$0</span>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    "Up to 8 habits with Core/Bonus system",
                    "Streaks, green days, and progress calendar",
                    "Guided journal with gratitude prompts",
                    "Box Breathing with animated guide",
                    "Morning Mobility routine",
                    "1 streak freeze per month",
                    "Daily stoic quotes",
                    "Accountability partner",
                    "Full offline mode",
                  ].map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <span className="text-emerald-400 shrink-0 mt-0.5 text-sm">✓</span>
                      <span className="text-sm text-neutral-400">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex justify-center">
                  <CTAButton className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
                    Get started free
                  </CTAButton>
                </div>
              </div>
            </Reveal>

            {/* Premium tier */}
            <Reveal delay={0.1}>
              <div
                className="rounded-3xl border border-emerald-800/40 p-8 relative h-full"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)",
                }}
              >
                {/* Founding member badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-block rounded-full bg-emerald-500 px-4 py-1 text-[11px] font-bold text-black uppercase tracking-wider">
                    🚀 Founding Member
                  </span>
                </div>
                <p className="text-xs font-bold tracking-wider uppercase text-emerald-400 mb-2 mt-2">
                  Premium
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold">$2.99</span>
                  <span className="text-sm text-neutral-500">/mo</span>
                  <span className="ml-2 text-sm text-neutral-600 line-through">$3.99/mo</span>
                </div>
                <p className="text-xs text-emerald-400/80 mt-1">
                  or $24.99/year <span className="text-neutral-600 line-through">$39.99/yr</span> (save 37%) · Lock in this rate forever
                </p>
                <div className="mt-6 space-y-3">
                  {PREMIUM_FEATURES.map((p) => (
                    <div key={p} className="flex items-start gap-2.5">
                      <span className="text-emerald-400 shrink-0 mt-0.5 text-sm">✦</span>
                      <span className="text-sm text-neutral-300">{p}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex justify-center">
                  <CTAButton className="rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-black transition hover:bg-emerald-400">
                    Start 7-day free trial →
                  </CTAButton>
                </div>
                <p className="text-center text-[11px] text-neutral-600 mt-3">
                  7-day free trial · Cancel anytime · Founding price locked in
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        className="py-20 px-6 border-t border-white/5"
        style={{ background: "rgba(255,255,255,0.01)" }}
      >
        <div className="mx-auto max-w-md text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Start your first green day
            </h2>
            <p className="text-neutral-500 text-sm mb-3">
              Free plan available. No credit card required.
            </p>
            <p className="text-xs text-emerald-400/70 mb-8">
              🚀 Founding member pricing available for a limited time
            </p>
            <CTAButton className="inline-block rounded-xl bg-emerald-500 px-10 py-4 text-base font-bold text-black transition hover:bg-emerald-400 active:scale-[0.98]">
              Create free account →
            </CTAButton>
            <p className="mt-4 text-xs text-neutral-600">
              Already have an account?{" "}
              <a href="/login" className="text-emerald-400/70 underline underline-offset-2 hover:text-emerald-400 transition">
                Sign in
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── SEO ── */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="mx-auto max-w-3xl space-y-4 text-xs text-neutral-600 leading-relaxed">
          <p>
            Routines365 is a daily habit tracker and wellness app for iOS designed for people who
            want to build consistent morning routines, track fitness goals,
            practice breathwork, and journal with guided gratitude prompts.
            Whether you&apos;re building a Wim Hof breathing practice,
            following guided Qigong movement routines, tracking supplements,
            logging water intake, or simply checking off daily habits,
            Routines365 makes consistency simple with one 10-second daily check-in.
          </p>
          <p>
            Features include streak tracking with milestones at 7, 14, 30,
            50, 100, and 365 days; a guided journal with gratitude,
            intention, and reflection prompts; five breathwork techniques
            with animated breathing circles and Om audio cues; seven guided movement
            routines including Qigong and mobility flows; a Pomodoro focus timer with
            three modes; Apple Health integration for sleep stages, HRV, heart rate, and steps;
            an accountability partner system; rest days and streak freezes;
            Face ID and Touch ID privacy lock; full offline mode;
            365 daily stoic quotes; water and supplement tracking;
            activity logging for workouts, cardio, rowing, and recovery;
            a science-backed knowledge base with 13 cited articles;
            and a beautiful progress calendar that shows your consistency at a glance.
          </p>
          <p>
            Available as a native iOS app with 7 custom themes. Free to start with
            up to 8 habits, Box Breathing, Morning Mobility, guided journal, streaks,
            and accountability partner. Optional premium upgrade for biometric insights,
            sleep stage analysis, health auto-complete, all breathwork techniques,
            unlimited habits, and custom themes. 76 built-in habits across morning,
            fitness, nutrition, recovery, mindfulness, and more. Works offline and
            syncs with any Apple Health-connected wearable including Apple Watch,
            Oura Ring, and Whoop.
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
