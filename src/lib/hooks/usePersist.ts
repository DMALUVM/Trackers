import { useCallback, useRef, useState } from "react";
import type { DayMode } from "@/lib/types";
import { upsertDailyChecks, upsertDailyLog, upsertDaySnooze } from "@/lib/supabaseData";
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
  const dirtyRef = useRef(false);
  // Track the current inflight save so flushNow can wait for it
  const inflightPromiseRef = useRef<Promise<void> | null>(null);

  const doSave = useCallback(async (dayMode: DayMode) => {
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

      dirtyRef.current = false;
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
      // Notify other pages (calendar, week strip) that data changed
      (window as unknown as Record<string, number>).__r365_lastSaveTs = Date.now();
      window.dispatchEvent(new Event("routines365:routinesChanged"));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const isOffline = !navigator.onLine || msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("network");

      if (isOffline) {
        enqueue({ type: "dailyLog", payload: logPayload as unknown as Record<string, unknown> });
        enqueue({ type: "dailyChecks", payload: checksPayload as unknown as Record<string, unknown> });
        dirtyRef.current = false;
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1500);
      } else {
        console.error("Save failed:", msg);
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 3000);
      }
    } finally {
      inflightPromiseRef.current = null;
    }
  }, [dateKey, itemsRef]);

  const debouncedPersist = useCallback((dayMode: DayMode) => {
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const p = doSave(dayMode);
      inflightPromiseRef.current = p;
    }, AUTOSAVE_DELAY_MS);
  }, [doSave]);

  /**
   * Flush any pending save immediately and return a promise that resolves
   * when the save is complete. Safe to call before navigation.
   */
  const flushNow = useCallback(async (dayMode: DayMode) => {
    // Cancel any pending debounce timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If a save is already in-flight, wait for it
    if (inflightPromiseRef.current) {
      await inflightPromiseRef.current;
      // If still dirty after that save (shouldn't happen, but be safe)
      if (dirtyRef.current) {
        const p = doSave(dayMode);
        inflightPromiseRef.current = p;
        await p;
      }
      return;
    }

    // If dirty but no save in-flight, save now
    if (dirtyRef.current) {
      const p = doSave(dayMode);
      inflightPromiseRef.current = p;
      await p;
    }
  }, [doSave]);

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
