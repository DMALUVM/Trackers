"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getActiveSubscription, onSubscriptionChange, isStoreKitAvailable } from "@/lib/storeKit";

// ────────────────────────────────────────────────────────────
// Premium feature flags
// ────────────────────────────────────────────────────────────

export const PREMIUM_FEATURES = {
  /** Free: 2 insights, Premium: all 6 */
  unlimitedInsights: "unlimited_insights",
  /** Free: no per-habit stats, Premium: tap any habit for deep analytics */
  habitDetailStats: "habit_detail_stats",
  /** Free: 1 streak freeze/month, Premium: unlimited */
  unlimitedStreakFreezes: "unlimited_streak_freezes",
  /** Free: basic weekly trend, Premium: full trend + export */
  advancedTrends: "advanced_trends",
  /** Premium: custom themes beyond light/dark */
  customThemes: "custom_themes",
  /** Premium: PDF progress reports */
  pdfReports: "pdf_reports",
  /** Premium: share cards */
  shareCards: "share_cards",
  /** Premium: biometric insights (HRV, RHR, SpO2, respiratory rate) */
  biometricInsights: "biometric_insights",
  /** Premium: health auto-complete from Apple Health */
  healthAutoComplete: "health_auto_complete",
  /** Premium: unlimited habits (free capped at 8) */
  unlimitedHabits: "unlimited_habits",
} as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[keyof typeof PREMIUM_FEATURES];

// ── Free tier limits ──
export const FREE_LIMITS = {
  maxInsights: 2,
  maxStreakFreezesPerMonth: 1,
  maxHabits: 8,
};

// ────────────────────────────────────────────────────────────
// Storage (localStorage now → StoreKit/RevenueCat later)
// ────────────────────────────────────────────────────────────

const LS_KEY = "routines365:premium";

// ── Beta/promo codes that grant premium ──
// Add codes here. When you're done with beta, just clear this array.
const VALID_CODES = new Set([
  "BETA2026",
  "FOUNDER",
  "EARLYBIRD",
]);

interface PremiumState {
  isPremium: boolean;
  activatedAt: string | null;
  devOverride: boolean;
  redeemedCode: string | null;
  /** Active StoreKit subscription info */
  storeKitActive: boolean;
  isTrialPeriod: boolean;
  subscriptionProductId: string | null;
}

function loadState(): PremiumState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { storeKitActive: false, isTrialPeriod: false, subscriptionProductId: null, ...JSON.parse(raw) };
  } catch {}
  return { isPremium: false, activatedAt: null, devOverride: false, redeemedCode: null, storeKitActive: false, isTrialPeriod: false, subscriptionProductId: null };
}

function saveState(state: PremiumState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

// ────────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────────

interface PremiumContextValue {
  isPremium: boolean;
  /** Check if a specific feature is available */
  hasFeature: (feature: PremiumFeature) => boolean;
  /** Activate premium (will be called by StoreKit callback in native) */
  activate: () => void;
  /** Deactivate (for testing/cancellation) */
  deactivate: () => void;
  /** Dev toggle for testing */
  toggleDev: () => void;
  /** Redeem a promo/beta code. Returns true if valid. */
  redeemCode: (code: string) => boolean;
  /** The code used (if any) */
  redeemedCode: string | null;
}

const PremiumContext = createContext<PremiumContextValue>({
  isPremium: false,
  hasFeature: () => false,
  activate: () => {},
  deactivate: () => {},
  toggleDev: () => {},
  redeemCode: () => false,
  redeemedCode: null,
});

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PremiumState>({ isPremium: false, activatedAt: null, devOverride: false, redeemedCode: null, storeKitActive: false, isTrialPeriod: false, subscriptionProductId: null });

  useEffect(() => {
    const saved = loadState();
    setState(saved);

    // Check StoreKit for real subscription status
    if (isStoreKitAvailable()) {
      void (async () => {
        try {
          const sub = await getActiveSubscription();
          if (sub.isPremium) {
            const next: PremiumState = {
              ...saved,
              isPremium: true,
              storeKitActive: true,
              isTrialPeriod: sub.subscription?.isTrialPeriod ?? false,
              subscriptionProductId: sub.subscription?.productId ?? null,
            };
            saveState(next);
            setState(next);
          } else if (saved.storeKitActive && !sub.isPremium) {
            // Subscription expired/cancelled
            const next: PremiumState = {
              ...saved,
              isPremium: saved.redeemedCode ? true : false, // Keep if promo code
              storeKitActive: false,
              isTrialPeriod: false,
              subscriptionProductId: null,
            };
            saveState(next);
            setState(next);
          }
        } catch { /* ignore */ }
      })();
    }

    // Listen for subscription changes (renewals, cancellations)
    const cleanup = onSubscriptionChange((isPremium) => {
      setState((prev) => {
        const next = { ...prev, isPremium, storeKitActive: isPremium };
        saveState(next);
        return next;
      });
    });

    return cleanup;
  }, []);

  const isPremium = state.isPremium || state.devOverride;

  const hasFeature = (feature: PremiumFeature): boolean => {
    if (isPremium) return true;
    // Free tier gets basic versions of some features
    switch (feature) {
      case PREMIUM_FEATURES.unlimitedInsights:
      case PREMIUM_FEATURES.habitDetailStats:
      case PREMIUM_FEATURES.unlimitedStreakFreezes:
      case PREMIUM_FEATURES.advancedTrends:
      case PREMIUM_FEATURES.customThemes:
      case PREMIUM_FEATURES.pdfReports:
      case PREMIUM_FEATURES.shareCards:
        return false;
      default:
        return false;
    }
  };

  const activate = () => {
    const next: PremiumState = { ...state, isPremium: true, activatedAt: new Date().toISOString(), devOverride: false };
    saveState(next);
    setState(next);
  };

  const deactivate = () => {
    const next: PremiumState = { isPremium: false, activatedAt: null, devOverride: false, redeemedCode: null, storeKitActive: false, isTrialPeriod: false, subscriptionProductId: null };
    saveState(next);
    setState(next);
  };

  const toggleDev = () => {
    const next = { ...state, devOverride: !state.devOverride };
    saveState(next);
    setState(next);
  };

  const redeemCode = (code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    if (!VALID_CODES.has(normalized)) return false;
    const next: PremiumState = {
      ...state,
      isPremium: true,
      activatedAt: new Date().toISOString(),
      devOverride: false,
      redeemedCode: normalized,
    };
    saveState(next);
    setState(next);
    return true;
  };

  return (
    <PremiumContext.Provider value={{ isPremium, hasFeature, activate, deactivate, toggleDev, redeemCode, redeemedCode: state.redeemedCode }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
