"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

interface PremiumState {
  isPremium: boolean;
  /** ISO date when premium was activated (for trial tracking) */
  activatedAt: string | null;
  /** For dev/testing — manual override */
  devOverride: boolean;
}

function loadState(): PremiumState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { isPremium: false, activatedAt: null, devOverride: false };
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
}

const PremiumContext = createContext<PremiumContextValue>({
  isPremium: false,
  hasFeature: () => false,
  activate: () => {},
  deactivate: () => {},
  toggleDev: () => {},
});

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PremiumState>({ isPremium: false, activatedAt: null, devOverride: false });

  useEffect(() => {
    setState(loadState());
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
    const next: PremiumState = { isPremium: true, activatedAt: new Date().toISOString(), devOverride: false };
    saveState(next);
    setState(next);
  };

  const deactivate = () => {
    const next: PremiumState = { isPremium: false, activatedAt: null, devOverride: false };
    saveState(next);
    setState(next);
  };

  const toggleDev = () => {
    const next = { ...state, devOverride: !state.devOverride };
    saveState(next);
    setState(next);
  };

  return (
    <PremiumContext.Provider value={{ isPremium, hasFeature, activate, deactivate, toggleDev }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
