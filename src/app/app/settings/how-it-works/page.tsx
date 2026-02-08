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

      {/* How to customize */}
      <section className="card p-5 space-y-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>⚙️ Customizing Your Habits</h2>
        <div className="space-y-3">
          {[
            { title: "Add a habit", desc: "Go to Settings → Routines → type a name and tap the + button. Or browse the library of 76+ habits." },
            { title: "Make it Core", desc: "In Settings → Routines, tap the OPT button next to any habit to switch it to CORE (and vice versa)." },
            { title: "Remove a habit", desc: "Tap the 🗑 trash icon next to any habit to archive it. It won't appear in your daily checklist anymore." },
            { title: "Reorder habits", desc: "Use the ↑↓ arrows next to each habit to change the order they appear in." },
            { title: "Set reminders", desc: "Tap the 🔔 bell icon on any habit to set a daily push notification reminder." },
          ].map(({ title, desc }) => (
            <div key={title}>
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
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
            { step: "1", text: "Open the app" },
            { step: "2", text: "Tap each habit you completed today" },
            { step: "3", text: "Log your water as you drink throughout the day" },
            { step: "4", text: "Watch your score fill up and your streak grow" },
            { step: "5", text: "That's it! Come back tomorrow and do it again." },
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
