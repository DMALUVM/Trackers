import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with Routines365. FAQs, troubleshooting, and contact information.",
  robots: { index: true, follow: true },
};

export default function SupportPage() {
  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto w-full max-w-2xl px-6 py-12 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Support</h1>
          <p className="mt-2 text-sm text-neutral-500">
            We&rsquo;re here to help you get the most out of Routines365.
          </p>
        </header>

        {/* ── Contact ── */}
        <Section title="Contact Us">
          <p>
            Have a question, found a bug, or want to share feedback? Reach out
            anytime — we read every message.
          </p>
          <a
            href="mailto:routines365.app@gmail.com"
            className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              background: "rgba(16,185,129,0.12)",
              color: "#10b981",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <span>✉️</span> routines365.app@gmail.com
          </a>
          <p className="mt-2 text-xs text-neutral-500">
            We typically respond within 24 hours.
          </p>
        </Section>

        {/* ── FAQ ── */}
        <Section title="Frequently Asked Questions">
          <FAQ q="How do I connect Apple Health?">
            Open Routines365 and go to your Today tab. Scroll to the Apple
            Health card and tap the sync button. You&rsquo;ll be prompted to
            grant permissions for the health data you want to share (steps,
            sleep, heart rate, etc.). You can change these permissions anytime in
            your device&rsquo;s Settings → Health → Data Access &amp; Devices.
          </FAQ>

          <FAQ q="What is a Green Day?">
            A Green Day means you completed all your Core habits for the day.
            Core habits are the ones that matter most to you — the non-negotiables.
            Bonus habits don&rsquo;t count toward your Green Day, so you can
            be flexible without breaking your streak.
          </FAQ>

          <FAQ q="How do streaks work?">
            Your streak counts consecutive Green Days. Miss a day? Your streak
            resets to zero. Premium members can use Streak Freezes to protect
            their streak when life gets in the way.
          </FAQ>

          <FAQ q="What's included in Premium?">
            Premium unlocks biometric insights (HRV, resting heart rate trends),
            sleep stage breakdown, Apple Health auto-complete, all 5 breathwork
            techniques, all 6 movement routines, unlimited habits, share cards,
            PDF progress reports, per-habit analytics, and unlimited streak
            freezes. You can try it free for 7 days.
          </FAQ>

          <FAQ q="How do I cancel my subscription?">
            Subscriptions are managed through Apple. Go to your device&rsquo;s
            Settings → [your name] → Subscriptions → Routines365 → Cancel.
            You&rsquo;ll keep premium access until the end of your current
            billing period.
          </FAQ>

          <FAQ q="How do I restore my purchase on a new device?">
            Open Routines365 → Settings → Premium → tap &ldquo;Restore
            purchase&rdquo; at the bottom. This will restore any active
            subscription linked to your Apple ID.
          </FAQ>

          <FAQ q="How do I delete my account?">
            Go to Settings → Security → Delete Account. This permanently removes
            your account and all associated data (habits, streaks, journal
            entries, and activity logs). This action cannot be undone.
          </FAQ>

          <FAQ q="Is my health data private?">
            Yes. Apple Health data is processed on your device and is never
            stored on our servers. We do not sell, share, or use health data for
            advertising. Read our full{" "}
            <a href="/privacy" className="text-emerald-400 underline underline-offset-2">
              Privacy Policy
            </a>{" "}
            for details.
          </FAQ>

          <FAQ q="The app isn't loading or shows a blank screen">
            Routines365 requires an internet connection to load. Try these steps:
            (1) Make sure you have a stable Wi-Fi or cellular connection.
            (2) Force-close the app and reopen it.
            (3) If the issue persists, try deleting and reinstalling the app —
            your data is saved to your account and will sync back.
          </FAQ>
        </Section>

        {/* ── System Requirements ── */}
        <Section title="System Requirements">
          <ul className="list-disc list-inside space-y-1.5 text-neutral-300">
            <li>iPhone running iOS 16 or later</li>
            <li>Internet connection required</li>
            <li>
              Apple Health integration requires an Apple Watch, Oura Ring, or
              other HealthKit-compatible device for biometric data (steps are
              tracked by iPhone alone)
            </li>
          </ul>
        </Section>

        <footer className="pt-4 border-t border-white/10">
          <a
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            href="/"
          >
            ← Back to Routines365
          </a>
        </footer>
      </div>
    </main>
  );
}

/* ── Helper components ── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="text-sm text-neutral-300 leading-relaxed">{children}</div>
    </section>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group mt-3 rounded-lg border border-white/5 bg-white/[0.02]">
      <summary className="cursor-pointer select-none list-none px-4 py-3 text-sm font-medium text-neutral-200 flex items-center justify-between">
        {q}
        <span className="text-neutral-500 transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="px-4 pb-3 text-sm text-neutral-400 leading-relaxed">
        {children}
      </div>
    </details>
  );
}
