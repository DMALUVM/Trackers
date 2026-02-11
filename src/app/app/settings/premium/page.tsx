"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Lock, Shield, BarChart3, Zap, Heart, Activity, Wind, Dumbbell, Brain, Moon } from "lucide-react";
import { usePremium } from "@/lib/premium";
import { hapticHeavy, hapticMedium } from "@/lib/haptics";
import { isStoreKitAvailable, getProducts, purchase, restorePurchases, PRODUCT_IDS, type StoreProduct } from "@/lib/storeKit";

const FEATURES = [
  {
    icon: Wind,
    title: "Guided Breathwork",
    desc: "4-7-8, Wim Hof, physiological sigh, and energizing breath with Om audio cues",
    free: "Box breathing",
    premium: "All 5 techniques",
  },
  {
    icon: Dumbbell,
    title: "Movement Routines",
    desc: "Lymphatic drainage, desk stretches, evening wind-down with step-by-step timers",
    free: "Morning mobility",
    premium: "All 4 routines",
  },
  {
    icon: Activity,
    title: "Biometric Insights",
    desc: "See how your habits affect your body. HRV, resting heart rate, blood oxygen, and respiratory trends from your Oura Ring, Apple Watch, or Garmin",
    free: "—",
    premium: "Full dashboard",
  },
  {
    icon: Heart,
    title: "Health Auto-Complete",
    desc: "Habits auto-check when Apple Health data meets your goals. Walk 10k steps? Your step habit checks itself",
    free: "—",
    premium: "Smart auto-complete",
  },
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
    icon: Moon,
    title: "Sleep Stage Breakdown",
    desc: "Deep, core, REM sleep charts with 7-day trends and personalized recommendations",
    free: "Total sleep only",
    premium: "Full stage analysis",
  },
  {
    icon: Zap,
    title: "Themes, Sharing & More",
    desc: "Custom themes, share cards, unlimited habits, PDF reports, and per-habit analytics",
    free: "8 habits, basic",
    premium: "Unlimited access",
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const { isPremium, activate, redeemCode, redeemedCode } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<"yearly" | "monthly">("yearly");
  const [restoring, setRestoring] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [showCodeField, setShowCodeField] = useState(false);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const hasStoreKit = isStoreKitAvailable();

  // Load real products from App Store
  useEffect(() => {
    if (!hasStoreKit) return;
    void (async () => {
      const products = await getProducts();
      if (products.length > 0) setStoreProducts(products);
    })();
  }, [hasStoreKit]);

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

  // Use real App Store prices when available, fallback to hardcoded
  const yearlyProduct = storeProducts.find(p => p.id === PRODUCT_IDS.yearly);
  const monthlyProduct = storeProducts.find(p => p.id === PRODUCT_IDS.monthly);
  const yearlyPrice = yearlyProduct ? Number(yearlyProduct.price) : 29.99;
  const monthlyPrice = monthlyProduct ? Number(monthlyProduct.price) : 3.99;
  const yearlyDisplay = yearlyProduct?.displayPrice ?? `$${yearlyPrice.toFixed(2)}`;
  const monthlyDisplay = monthlyProduct?.displayPrice ?? `$${monthlyPrice.toFixed(2)}`;
  const yearlyMonthly = (yearlyPrice / 12).toFixed(2);
  const savings = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);
  const trialDays = yearlyProduct?.freeTrialDays ?? monthlyProduct?.freeTrialDays ?? 7;

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
              <div className="flex gap-2 mt-2.5">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg leading-tight"
                  style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
                  Free: {f.free}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg leading-tight"
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
            {yearlyDisplay}/year · Billed annually
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
            <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{monthlyDisplay}</span>
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
          disabled={purchasing}
          onClick={async () => {
            hapticHeavy();
            const productId = selectedPlan === "yearly" ? PRODUCT_IDS.yearly : PRODUCT_IDS.monthly;

            if (hasStoreKit) {
              // Real StoreKit purchase
              setPurchasing(true);
              try {
                const result = await purchase(productId);
                if (result.success) {
                  activate();
                }
              } catch { /* ignore */ }
              finally { setPurchasing(false); }
            } else {
              // Web fallback: just activate (for dev/testing)
              activate();
            }
          }}
          className="w-full py-4 rounded-2xl text-center font-bold text-base"
          style={{
            background: purchasing
              ? "var(--bg-card-hover)"
              : "linear-gradient(135deg, var(--accent-green), var(--accent-green-text))",
            color: purchasing ? "var(--text-faint)" : "white",
            boxShadow: purchasing ? "none" : "0 4px 24px rgba(16, 185, 129, 0.3)",
          }}>
          {purchasing ? "Processing..." : `Start ${trialDays}-Day Free Trial`}
        </button>

        <p className="text-center text-[11px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
          {trialDays}-day free trial · Cancel anytime · No charge until trial ends
        </p>

        <button type="button"
          disabled={restoring}
          onClick={async () => {
            setRestoring(true);
            hapticMedium();
            if (hasStoreKit) {
              const result = await restorePurchases();
              if (result.isPremium) activate();
            }
            setTimeout(() => setRestoring(false), 1500);
          }}
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
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>— Early user</p>
        </div>
      </section>

      {/* Terms */}
      <footer className="text-center px-6 space-y-2">
        <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
          Payment will be charged to your Apple ID account at confirmation of purchase.
          Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
          You can manage and cancel subscriptions in your Apple ID account settings.
        </p>
        <div className="flex items-center justify-center gap-3 text-[10px]" style={{ color: "var(--text-faint)" }}>
          <a href="/terms" className="underline underline-offset-2">Terms of Use</a>
          <span>·</span>
          <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
