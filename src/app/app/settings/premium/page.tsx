"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Lock, Sparkles, Shield, BarChart3, Zap } from "lucide-react";
import { usePremium } from "@/lib/premium";
import { hapticHeavy, hapticMedium } from "@/lib/haptics";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Deep Insights",
    desc: "Sleep correlation, day-of-week patterns, trend detection, and 6+ personalized insights that get smarter over time",
    free: "2 basic insights",
    premium: "All 6+ insights",
  },
  {
    icon: Shield,
    title: "Unlimited Streak Freezes",
    desc: "Life happens. Protect your streak without guilt — unlimited freezes whenever you need them",
    free: "1 per month",
    premium: "Unlimited",
  },
  {
    icon: Sparkles,
    title: "Per-Habit Analytics",
    desc: "Tap any habit to see its individual completion rate, best day, trend over time, and personal records",
    free: "—",
    premium: "Full analytics",
  },
  {
    icon: Zap,
    title: "Progress Reports & Sharing",
    desc: "Beautiful downloadable PDF reports and shareable progress cards for accountability partners",
    free: "—",
    premium: "Full access",
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const { isPremium, activate, redeemCode, redeemedCode } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<"yearly" | "monthly">("yearly");
  const [restoring, setRestoring] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [showCodeField, setShowCodeField] = useState(false);

  // Already premium
  if (isPremium) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--accent-green-soft)" }}>
          <Crown size={32} style={{ color: "var(--accent-green-text)" }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>You&apos;re Premium!</h1>
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>All features are unlocked. Thank you for your support.</p>
        {redeemedCode && (
          <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>
            Redeemed with code: <strong>{redeemedCode}</strong>
          </p>
        )}
        <button type="button" onClick={() => router.back()}
          className="btn-primary px-6 py-3 rounded-xl text-sm font-bold mt-4">
          Back to app
        </button>
      </div>
    );
  }

  const yearlyPrice = 29.99;
  const monthlyPrice = 4.99;
  const yearlyMonthly = (yearlyPrice / 12).toFixed(2);
  const savings = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

  return (
    <div className="space-y-6 pb-10">
      {/* Hero */}
      <div className="relative text-center pt-6 pb-4 px-6">
        <button type="button" onClick={() => router.back()}
          className="absolute left-4 top-6 text-sm font-medium tap-btn"
          style={{ color: "var(--text-muted)" }}>
          ✕
        </button>

        <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 animate-fade-in-up"
          style={{
            background: "linear-gradient(135deg, var(--accent-green), var(--accent-green-text))",
            boxShadow: "0 8px 32px rgba(16, 185, 129, 0.3)",
          }}>
          <Crown size={40} color="white" />
        </div>

        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Unlock Routines365 Pro
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Deeper insights. Streak protection. Full analytics.
        </p>
      </div>

      {/* Feature comparison */}
      <section className="px-4 space-y-3 stagger-children">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-4 flex gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-green-soft)" }}>
              <f.icon size={20} style={{ color: "var(--accent-green-text)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{f.title}</p>
              <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
              <div className="flex gap-4 mt-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
                  Free: {f.free}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--accent-green-soft)", color: "var(--accent-green-text)" }}>
                  Pro: {f.premium}
                </span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Pricing toggle */}
      <section className="px-4 space-y-3">
        {/* Yearly */}
        <button type="button" onClick={() => { setSelectedPlan("yearly"); hapticMedium(); }}
          className="w-full rounded-2xl p-4 text-left relative overflow-hidden transition-all"
          style={{
            background: selectedPlan === "yearly" ? "var(--accent-green-soft)" : "var(--bg-card)",
            border: selectedPlan === "yearly" ? "2px solid var(--accent-green)" : "2px solid var(--border-primary)",
          }}>
          {/* Badge */}
          <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--accent-green)", color: "white" }}>
            SAVE {savings}%
          </span>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Yearly</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>${yearlyMonthly}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>/ month</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
            ${yearlyPrice}/year · Billed annually
          </p>
        </button>

        {/* Monthly */}
        <button type="button" onClick={() => { setSelectedPlan("monthly"); hapticMedium(); }}
          className="w-full rounded-2xl p-4 text-left transition-all"
          style={{
            background: selectedPlan === "monthly" ? "var(--accent-green-soft)" : "var(--bg-card)",
            border: selectedPlan === "monthly" ? "2px solid var(--accent-green)" : "2px solid var(--border-primary)",
          }}>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Monthly</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>${monthlyPrice}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>/ month</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
            Cancel anytime
          </p>
        </button>
      </section>

      {/* CTA */}
      <section className="px-4 space-y-3">
        <button type="button"
          onClick={() => {
            hapticHeavy();
            // TODO: Replace with StoreKit purchase when native
            // For now, dev activation for testing
            activate();
          }}
          className="w-full py-4 rounded-2xl text-center font-bold text-base"
          style={{
            background: "linear-gradient(135deg, var(--accent-green), var(--accent-green-text))",
            color: "white",
            boxShadow: "0 4px 24px rgba(16, 185, 129, 0.3)",
          }}>
          Start Free Trial
        </button>

        <p className="text-center text-[11px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
          7-day free trial · Cancel anytime · No charge until trial ends
        </p>

        <button type="button"
          onClick={() => { setRestoring(true); setTimeout(() => setRestoring(false), 1500); }}
          className="w-full text-center text-xs font-medium py-2"
          style={{ color: "var(--text-muted)" }}>
          {restoring ? "Checking..." : "Restore purchase"}
        </button>

        {/* Code redemption */}
        {!showCodeField ? (
          <button type="button" onClick={() => setShowCodeField(true)}
            className="w-full text-center text-xs font-medium py-2"
            style={{ color: "var(--text-muted)" }}>
            Have a code?
          </button>
        ) : (
          <div className="space-y-2 animate-fade-in-up">
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(false); }}
                placeholder="Enter code"
                className="flex-1 text-sm font-mono tracking-wider text-center px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: "var(--bg-card)",
                  border: codeError ? "2px solid var(--accent-red)" : "2px solid var(--border-primary)",
                  color: "var(--text-primary)",
                }}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
              <button type="button"
                onClick={() => {
                  hapticMedium();
                  const ok = redeemCode(codeInput);
                  if (!ok) setCodeError(true);
                }}
                disabled={codeInput.length < 3}
                className="px-4 py-2.5 rounded-xl text-sm font-bold shrink-0"
                style={{
                  background: codeInput.length >= 3 ? "var(--accent-green)" : "var(--bg-card-hover)",
                  color: codeInput.length >= 3 ? "white" : "var(--text-faint)",
                }}>
                Redeem
              </button>
            </div>
            {codeError && (
              <p className="text-xs text-center" style={{ color: "var(--accent-red)" }}>
                Invalid code. Please check and try again.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Social proof */}
      <section className="px-4">
        <div className="rounded-2xl p-4 text-center" style={{ background: "var(--bg-card-hover)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            &ldquo;The insights alone are worth it. Knowing my Wednesdays are weak changed how I plan my week.&rdquo;
          </p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>— Beta tester</p>
        </div>
      </section>

      {/* Terms */}
      <footer className="text-center px-6">
        <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
          Payment will be charged to your Apple ID account at confirmation of purchase.
          Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
        </p>
      </footer>
    </div>
  );
}
