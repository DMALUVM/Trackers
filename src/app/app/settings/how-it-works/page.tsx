"use client";

import { SubPageHeader } from "@/app/app/_components/ui";

export default function HowItWorksPage() {
  return (
    <div className="space-y-5">
      <SubPageHeader title="How it works" subtitle="Everything you need to know" backHref="/app/settings" />

      {/* Core vs Bonus */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>⭐ Core vs. Bonus Habits</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Your habits are split into two types:
        </p>
        <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--accent-green-soft)" }}>
          <div className="flex items-start gap-3">
            <span className="shrink-0 rounded-full px-2 py-1 text-xs font-bold"
              style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>CORE</span>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Must-do habits.</strong> These are the non-negotiable things you want to do every day. Complete ALL your core habits to earn a <strong style={{ color: "var(--accent-green-text)" }}>green day</strong>.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 rounded-full px-2 py-1 text-xs font-bold"
              style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>OPT</span>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Bonus habits.</strong> Nice-to-haves that you track but don&apos;t affect your green day status. Great for aspirational habits you&apos;re building up to.
            </p>
          </div>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          💡 We recommend 3–5 core habits. Too many and it&apos;s hard to get green days. Too few and it&apos;s not meaningful.
        </p>
      </section>

      {/* Colors */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>🎨 What the Colors Mean</h2>
        <div className="space-y-2.5">
          {[
            { color: "var(--accent-green)", label: "Green", desc: "All core habits completed — perfect day!" },
            { color: "var(--accent-yellow)", label: "Yellow", desc: "Missed 1 core habit — almost there" },
            { color: "var(--accent-red)", label: "Red", desc: "Missed 2+ core habits" },
            { color: "var(--bg-card-hover)", label: "Gray", desc: "No activity recorded that day" },
          ].map(({ color, label, desc }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="shrink-0 rounded-full" style={{ width: 16, height: 16, background: color }} />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--text-primary)" }}>{label}</strong> — {desc}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          You&apos;ll see these colors on your Progress calendar and the week strip on the home screen.
        </p>
      </section>

      {/* Streaks */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>🔥 Streaks &amp; Trophies</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Consecutive green days build a streak. The longer your streak, the more trophies you unlock:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { days: "3 days", trophy: "🥉 First Spark" },
            { days: "7 days", trophy: "📅 One Week" },
            { days: "14 days", trophy: "🔥 Two Weeks" },
            { days: "21 days", trophy: "⚡ Habit Formed" },
            { days: "30 days", trophy: "🏆 One Month" },
            { days: "100 days", trophy: "💎 100 Club" },
          ].map(({ days, trophy }) => (
            <div key={days} className="rounded-xl p-2.5 text-center" style={{ background: "var(--bg-card)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{trophy}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{days}</p>
            </div>
          ))}
        </div>
      </section>

      {/* My Streaks */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>📌 My Streaks</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Everyone has that <strong style={{ color: "var(--text-primary)" }}>one habit</strong> that matters most — no alcohol, daily walking, meditation, whatever it is for you. My Streaks gives every habit its own dedicated tracker.
        </p>
        <div className="space-y-2">
          {[
            { title: "Pin your most important habits", desc: "Pin up to 5 habits to see big, bold streak counters front and center. Your \"47 days sober\" moment." },
            { title: "Per-habit stats", desc: "Every habit shows WTD, MTD, YTD, and all-time completion counts. Tap any habit to expand and see the full picture." },
            { title: "30-day heatmap", desc: "A visual timeline of the last 30 days for each habit — see your consistency at a glance." },
            { title: "Per-habit milestones", desc: "Earn milestone badges at 3, 7, 14, 21, 30, 50, 75, 100, 150, 200, and 365 days per habit." },
            { title: "Share your streaks", desc: "Generate a beautiful image card showing your streak and share it to iMessage, Instagram, or anywhere else." },
          ].map(({ title, desc }) => (
            <div key={title}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          💡 Access My Streaks by tapping your 🔥 streak on the Today screen, or from the Progress page.
        </p>
      </section>

      {/* Accountability Partner */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>🤝 Accountability Partner</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Connect with <strong style={{ color: "var(--text-primary)" }}>one person</strong> who can see your streak and today&apos;s progress. Research shows people with an accountability partner are 65% more likely to reach their goals.
        </p>
        <div className="space-y-2">
          {[
            { title: "Invite a partner", desc: "Generate a 6-character code and share it via text, email, or any messaging app." },
            { title: "See their progress", desc: "View your partner's current streak, best streak, and how many habits they've completed today." },
            { title: "Send cheers", desc: "Tap the ❤️ button to send encouragement when your partner needs a boost." },
          ].map(({ title, desc }) => (
            <div key={title}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          💡 Find it from My Streaks → tap the 👥 icon in the top right.
        </p>
      </section>

      {/* How to customize */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>⚙️ Customizing Your Habits</h2>
        <div className="space-y-3">
          {[
            { title: "Add a habit", desc: "Go to Settings → Routines → type a name and tap the + button. Or browse the library of 76+ habits." },
            { title: "Make it Core", desc: "In Settings → Routines, tap the OPT button next to any habit to switch it to CORE (and vice versa)." },
            { title: "Remove a habit", desc: "Tap the 🗑 trash icon next to any habit to archive it. It won't appear in your daily checklist anymore." },
            { title: "Reorder habits", desc: "Use the ↑↓ arrows next to each habit to change the order they appear in." },
            { title: "Set reminders", desc: "Tap the 🔔 bell icon on any habit to set a daily reminder at a specific time. Choose which days of the week to be reminded." },
            { title: "Schedule days", desc: "Tap any habit name on the Today screen to set which days of the week it should appear (M/W/F, weekdays only, etc.)." },
          ].map(({ title, desc }) => (
            <div key={title}>
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Day-of-week scheduling */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>📅 Day-of-Week Scheduling</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Not every habit needs to happen every day. You can schedule habits to only appear on specific days of the week.
        </p>
        <div className="space-y-2">
          {[
            { title: "From the Today screen", desc: "Tap any habit name → use the \"Show on days\" toggles (M T W T F S S) to pick which days it appears." },
            { title: "From Settings", desc: "Settings → Routines → tap a habit → set Frequency to Every day, Mon–Fri, Mon/Wed/Fri, Tue/Thu, or Custom." },
            { title: "How it works", desc: "Scheduled habits only appear on their assigned days. They won't show as bonus habits on off-days. If no habits are scheduled for a day, your core habits will still appear." },
          ].map(({ title, desc }) => (
            <div key={title}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          💡 Great for medication (M/W/F), gym days (Tue/Thu), or weekly reviews (Sunday only).
        </p>
      </section>

      {/* Apple Health */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>💚 Apple Health</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Connect Apple Health to automatically pull in your health data. See how your habits correlate with your body&apos;s metrics.
        </p>
        <div className="space-y-2">
          {[
            { title: "Free tier", desc: "Steps, sleep hours, calories burned, and workouts — all synced automatically from Apple Health." },
            { title: "Premium biometrics", desc: "HRV (heart rate variability), resting heart rate, SpO2 (blood oxygen), and respiratory rate. Requires a device like Apple Watch, Oura Ring, or Garmin." },
            { title: "Sleep stages", desc: "Premium users see a breakdown of Deep, Light, and REM sleep with a visual bar chart and bed/wake times." },
            { title: "Auto-complete", desc: "Habits like \"Walk 10k steps\" or \"8 hours sleep\" can auto-complete when Apple Health data meets your targets." },
          ].map(({ title, desc }) => (
            <div key={title}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          💡 Tap the ⚙️ gear on the Health card to choose which metrics to show. Tap the 🔄 refresh icon to sync latest data.
        </p>
      </section>

      {/* Breathwork & Movement */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>🫁 Breathwork &amp; Movement</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Built-in guided sessions you can do right from the app — no YouTube or separate apps needed.
        </p>
        <div className="space-y-2">
          {[
            { title: "Box Breathing (4-4-4-4)", desc: "A calming technique used by Navy SEALs. Inhale 4s, hold 4s, exhale 4s, hold 4s." },
            { title: "Wim Hof Method", desc: "30 power breaths followed by a retention hold. Builds cold tolerance and focus." },
            { title: "4-7-8 Relaxation", desc: "Dr. Andrew Weil's sleep technique. Inhale 4s, hold 7s, exhale 8s." },
            { title: "Physiological Sigh", desc: "Double inhale through the nose, long exhale. Instantly calms the nervous system." },
            { title: "Mobility flows", desc: "Guided movement routines for morning activation, desk breaks, and recovery." },
          ].map(({ title, desc }) => (
            <div key={title}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          💡 Access from the quick action buttons on the Today screen, or check the &quot;Breathwork&quot; habit for a direct link.
        </p>
      </section>

      {/* Focus Timer */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>🧠 Focus Timer</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          A built-in Pomodoro-style timer for deep work sessions. Set your work duration and break duration, then start the timer.
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          💡 Access from the quick action buttons on the Today screen. Sessions are logged automatically.
        </p>
      </section>

      {/* Rest Days & Streak Freezes */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>🛌 Rest Days &amp; Streak Freezes</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Life happens. These tools protect your streak without compromising your commitment.
        </p>
        <div className="space-y-2">
          {[
            { title: "Rest Days", desc: "Plan days off in advance (Settings → Rest Days). Rest days don't count as missed — your streak stays intact. Great for Sundays or recovery days." },
            { title: "Day Modes", desc: "Set today's mode to Normal, Travel, or Sick from the ⋯ menu. Travel and Sick modes are more forgiving with your score." },
            { title: "Streak Freezes", desc: "Emergency protection when you forget. Use from the ⋯ menu. Free users get 1 per month, Premium users get unlimited." },
          ].map(({ title, desc }) => (
            <div key={title}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Customize Today */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>🎛️ Customize Your Today Screen</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Show or hide sections on your Today page to keep it clean and focused. Go to Settings → Customize Today.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          You can toggle: Apple Health card, Water Tracker, Quests, Daily Wisdom quotes, and Quick Action buttons (Breathwork, Focus, Movement).
        </p>
      </section>

      {/* Premium */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>👑 Premium</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Routines365 is fully usable for free. Premium adds power-user features for those who want to go deeper:
        </p>
        <div className="space-y-2">
          {[
            { title: "Biometric insights", desc: "HRV, resting heart rate, SpO2, respiratory rate, and sleep stages from Apple Health." },
            { title: "Health auto-complete", desc: "Habits auto-check when Apple Health data meets your targets." },
            { title: "Unlimited habits", desc: "Free tier allows up to 10 habits. Premium removes the limit." },
            { title: "Per-habit analytics", desc: "Completion rate, best/worst days, current and best streaks per habit." },
            { title: "Weekly reports", desc: "Detailed breakdown of your week with trends and insights." },
            { title: "Themes", desc: "Additional color themes beyond the defaults." },
            { title: "Unlimited streak freezes", desc: "Free users get 1/month. Premium gets unlimited." },
          ].map(({ title, desc }) => (
            <div key={title}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          💡 Go to Settings → Premium to see plans and enter a promo code.
        </p>
      </section>
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>📦 Modules</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Modules are <strong style={{ color: "var(--text-primary)" }}>dedicated logging pages</strong> for activities that need more detail than a simple checkmark. Things like Sleep (hours + score), Fitness (duration), Rowing (meters), Hydration (glasses), and more.
        </p>
        <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--bg-card-hover)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Habits vs. Modules</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-primary)" }}>Habits</strong> live on the Today screen — tap to check them off. They answer &quot;did I do it?&quot;
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-primary)" }}>Modules</strong> are extra tabs in the nav bar for logging specifics — &quot;how much did I do?&quot; (meters rowed, hours slept, glasses of water, etc.)
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Some habits (like Rowing) will auto-prompt you to log details when you check them off — connecting the two seamlessly.
          </p>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Go to Settings → Modules to turn them on or off. You can have up to 4 active modules in your bottom navigation bar, alongside Today and Progress.
        </p>
      </section>

      {/* Water Tracker */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>💧 Water Tracker</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          A simple hydration tracker lives right on your Today screen. Tap any empty dot to fill it, tap a filled dot to undo. Goal is 8 glasses a day.
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Your water intake is saved automatically and shows up in your Progress stats too.
        </p>
      </section>

      {/* Quests */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>🎯 Quests</h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Quests are <strong style={{ color: "var(--text-primary)" }}>weekly goals</strong> that show your progress on the Today screen. They pull from your activity logs automatically. Tap a quest to log activity directly.
        </p>
        <div className="space-y-2">
          {[
            { label: "Built-in quests", desc: "Track weekly rowing meters, walking steps, running miles, recovery sessions, or green days." },
            { label: "Custom quests", desc: "Create your own by matching keywords to your habit names (e.g. a \"Pullups\" quest that tracks any habit with \"pullup\" in the name)." },
          ].map(({ label, desc }) => (
            <div key={label}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{label}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Configure quests in Settings → Quests. Choose up to 3 to display on your Today screen.
        </p>
      </section>

      {/* Daily routine */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>📱 Your Daily Routine</h2>
        <div className="space-y-2.5">
          {[
            { step: "1", text: "Open the app — your Today screen shows everything" },
            { step: "2", text: "Tap each habit you completed" },
            { step: "3", text: "Check your Apple Health stats and log water" },
            { step: "4", text: "Watch your score and streak grow" },
            { step: "5", text: "Use breathwork, focus timer, or movement when you need a boost" },
            { step: "6", text: "That's it! Come back tomorrow and do it again." },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3">
              <div className="shrink-0 flex items-center justify-center rounded-full font-bold"
                style={{ width: 28, height: 28, fontSize: "0.875rem", background: "var(--accent-green)", color: "var(--text-inverse)" }}>
                {step}
              </div>
              <p className="text-base" style={{ color: "var(--text-secondary)" }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-sm pb-4" style={{ color: "var(--text-faint)" }}>
        Questions? Tap the thumbs-down on any screen to send feedback.
      </p>
    </div>
  );
}
