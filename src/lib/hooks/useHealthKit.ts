"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isHealthKitAvailable,
  isHealthKitAuthorized,
  requestHealthKitAuth,
  getTodaySteps,
  getLastNightSleep,
  getDaySummary,
  type HealthKitDaySummary,
  type HealthKitSleep,
} from "@/lib/healthKit";

interface UseHealthKitReturn {
  /** HealthKit is available (running in native app) */
  available: boolean;
  /** User has authorized HealthKit access */
  authorized: boolean;
  /** Request authorization */
  requestAuth: () => Promise<boolean>;
  /** Today's step count */
  steps: number;
  /** Last night's sleep data */
  sleep: HealthKitSleep | null;
  /** Full day summary */
  summary: HealthKitDaySummary | null;
  /** Refresh all data */
  refresh: () => Promise<void>;
  /** Loading state */
  loading: boolean;
}

/**
 * Hook for accessing Apple Health data.
 * Automatically checks availability and authorization.
 * Falls back gracefully on web.
 */
export function useHealthKit(): UseHealthKitReturn {
  const [available, setAvailable] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [steps, setSteps] = useState(0);
  const [sleep, setSleep] = useState<HealthKitSleep | null>(null);
  const [summary, setSummary] = useState<HealthKitDaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isHealthKitAvailable()) return;
    try {
      const [stepsData, sleepData, summaryData] = await Promise.all([
        getTodaySteps(),
        getLastNightSleep(),
        getDaySummary(),
      ]);
      setSteps(stepsData);
      setSleep(sleepData);
      setSummary(summaryData);
    } catch (e) {
      console.error("HealthKit refresh error:", e);
    }
  }, []);

  const requestAuth = useCallback(async (): Promise<boolean> => {
    const ok = await requestHealthKitAuth();
    setAuthorized(ok);
    if (ok) await refresh();
    return ok;
  }, [refresh]);

  useEffect(() => {
    const init = async () => {
      const avail = isHealthKitAvailable();
      setAvailable(avail);
      if (!avail) { setLoading(false); return; }

      const auth = await isHealthKitAuthorized();
      setAuthorized(auth);
      if (auth) await refresh();
      setLoading(false);
    };
    void init();
  }, [refresh]);

  // Refresh when app comes to foreground
  useEffect(() => {
    if (!authorized) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [authorized, refresh]);

  return {
    available,
    authorized,
    requestAuth,
    steps,
    sleep,
    summary,
    refresh,
    loading,
  };
}
