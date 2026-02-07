"use client";

/**
 * Warm welcome when user returns after 2+ missed days.
 *
 * Psychology: Shame is the #1 reason people abandon habit apps.
 * When someone breaks their streak, most apps show "0" and
 * the user feels like a failure. THIS app says "Welcome back.
 * You're here now. That's what matters."
 *
 * This is the single most important retention feature.
 */
export function ComebackBanner({
  daysSinceLastGreen,
  previousStreak,
  onDismiss,
}: {
  daysSinceLastGreen: number;
  previousStreak: number;
  onDismiss: () => void;
}) {
  // Only show for meaningful gaps
  if (daysSinceLastGreen < 2) return null;

  const getMessage = () => {
    if (previousStreak >= 14) {
      return {
        emoji: "💪",
        title: "Welcome back",
        body: `You had a ${previousStreak}-day streak. That progress is still inside you — it doesn't reset because you took a break.`,
        cta: "Let's build a new one",
      };
    }
    if (previousStreak >= 7) {
      return {
        emoji: "🌅",
        title: "Fresh start",
        body: "A week-long streak shows you know how to be consistent. Today is your comeback chapter.",
        cta: "Start today",
      };
    }
    if (daysSinceLastGreen >= 7) {
      return {
        emoji: "👋",
        title: "Hey, welcome back",
        body: "It's been a while. No guilt — just the fact that you opened this app means something.",
        cta: "Let's go",
      };
    }
    return {
      emoji: "🌱",
      title: "Pick up where you left off",
      body: "Missing a day or two is normal. What matters is you didn't quit.",
      cta: "Get back to it",
    };
  };

  const msg = getMessage();

  return (
    <section className="rounded-2xl p-5 animate-fade-in-up"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.06))",
        border: "1px solid rgba(99,102,241,0.15)",
      }}>
      <div className="text-center space-y-2">
        <div className="text-3xl">{msg.emoji}</div>
        <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{msg.title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{msg.body}</p>
        <button type="button" onClick={onDismiss}
          className="mt-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-transform active:scale-[0.97]"
          style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
          {msg.cta} →
        </button>
      </div>
    </section>
  );
}
