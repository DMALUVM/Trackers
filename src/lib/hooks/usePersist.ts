import { useCallback, useRef, useState } from "react";
import type { DayMode } from "@/lib/types";
import { upsertDailyChecks, upsertDailyLog, upsertDaySnooze, getUserId } from "@/lib/supabaseData";
import type { UiItem } from "@/lib/hooks/useRoutineDay";
import type { ToastState } from "@/app/app/_components/ui/Toast";
import { AUTOSAVE_DELAY_MS, SNOOZE_DURATION_MS } from "@/lib/constants";
import { enqueue } from "@/lib/offlineQueue";

interface UsePersistOpts {
  dateKey: string;
  itemsRef: React.MutableRefObject<UiItem[]>;
}

export function usePersist({ dateKey, itemsRef }: UsePersistOpts) {
  const [saveState, setSaveState] = useState<ToastState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef(false);
  const pendingRef = useRef(false);
  const pendingDayModeRef = useRef<DayMode | null>(null);
  const dirtyRef = useRef(false);

  const persistNow = useCallback(async (dayMode: DayMode) => {
    if (inflightRef.current) {
      pendingRef.current = true;
      return;
    }

    inflightRef.current = true;
    pendingRef.current = false;
    setSaveState("saving");

    const items = itemsRef.current;
    const didRowing = items.some((i) => i.label.toLowerCase().includes("rowing") && i.done);
    const didWeights = items.some((i) => i.label.toLowerCase().includes("workout") && i.done);

    const logPayload = { dateKey, dayMode, sex: null, didRowing, didWeights };
    const checksPayload = {
      dateKey,
      checks: items.map((i) => ({ routineItemId: i.id, done: i.done })),
    };

    try {
      await Promise.all([
        upsertDailyLog(logPayload),
        upsertDailyChecks(checksPayload),
      ]);

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
      // Notify other pages (calendar, week strip) that data changed
      (window as unknown as Record<string, number>).__r365_lastSaveTs = Date.now();
      window.dispatchEvent(new Event("routines365:routinesChanged"));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const isOffline = !navigator.onLine || msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("network");

      if (isOffline) {
        // Queue for later sync
        enqueue({ type: "dailyLog", payload: logPayload as unknown as Record<string, unknown> });
        enqueue({ type: "dailyChecks", payload: checksPayload as unknown as Record<string, unknown> });
        setSaveState("saved"); // Show saved — user's checks are preserved locally
        setTimeout(() => setSaveState("idle"), 1500);
      } else {
        console.error("Save failed:", msg);
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 3000);
      }
    } finally {
      inflightRef.current = false;
      if (pendingRef.current) {
        const dm = pendingDayModeRef.current ?? dayMode;
        pendingDayModeRef.current = null;
        void persistNow(dm);
      }
    }
  }, [dateKey, itemsRef]);

  const debouncedPersist = useCallback((dayMode: DayMode) => {
    dirtyRef.current = true;
    pendingDayModeRef.current = dayMode;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void persistNow(dayMode);
    }, AUTOSAVE_DELAY_MS);
  }, [persistNow]);

  const flushNow = useCallback((dayMode: DayMode) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!dirtyRef.current) return Promise.resolve();
    return persistNow(dayMode);
  }, [persistNow]);

  /** Save a single-item snooze to Supabase. */
  const persistSnooze = useCallback(async (routineItemId: string) => {
    try {
      await upsertDaySnooze({
        dateKey,
        routineItemId,
        snoozedUntilMs: Date.now() + SNOOZE_DURATION_MS,
      });
    } catch {
      // Offline or auth hiccup — local state is already updated
    }
  }, [dateKey]);

  return {
    saveState,
    debouncedPersist,
    flushNow,
    persistSnooze,
  };
}
