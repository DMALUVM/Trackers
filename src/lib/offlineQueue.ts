// ===========================================================================
// OFFLINE WRITE QUEUE
// ===========================================================================
// When the app can't reach Supabase (subway, airplane mode, poor signal),
// writes are stored in localStorage. When connectivity returns, they're
// replayed in order. The SW handles read caching; this handles writes.
// ===========================================================================

import { upsertDailyChecks, upsertDailyLog } from "@/lib/supabaseData";

const LS_KEY = "routines365:offlineQueue";

export interface QueuedWrite {
  id: string;
  timestamp: number;
  type: "dailyLog" | "dailyChecks";
  payload: Record<string, unknown>;
}

// ── Queue management ──

function loadQueue(): QueuedWrite[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedWrite[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(queue));
  } catch { /* storage full — degrade gracefully */ }
}

/** Add a write to the offline queue */
export function enqueue(write: Omit<QueuedWrite, "id" | "timestamp">) {
  const queue = loadQueue();
  // Deduplicate: replace existing writes of the same type + dateKey
  const dateKey = (write.payload as Record<string, unknown>).dateKey as string;
  const filtered = queue.filter(
    (q) => !(q.type === write.type && (q.payload as Record<string, unknown>).dateKey === dateKey)
  );
  filtered.push({
    ...write,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  });
  saveQueue(filtered);
  notifyChange();
}

/** How many writes are pending */
export function pendingCount(): number {
  return loadQueue().length;
}

/** Clear the queue (after successful sync) */
export function clearQueue() {
  try { localStorage.removeItem(LS_KEY); } catch {}
  notifyChange();
}

// ── Replay ──

let flushing = false;

/** Replay all queued writes to Supabase. Returns number of failures. */
export async function flushQueue(): Promise<number> {
  if (flushing) return 0;
  flushing = true;

  const queue = loadQueue();
  if (queue.length === 0) { flushing = false; return 0; }

  let failures = 0;
  const remaining: QueuedWrite[] = [];

  // Process in order (oldest first)
  const sorted = [...queue].sort((a, b) => a.timestamp - b.timestamp);

  for (const item of sorted) {
    try {
      if (item.type === "dailyLog") {
        await upsertDailyLog(item.payload as Parameters<typeof upsertDailyLog>[0]);
      } else if (item.type === "dailyChecks") {
        await upsertDailyChecks(item.payload as Parameters<typeof upsertDailyChecks>[0]);
      }
      // Success — don't re-add
    } catch {
      // Still offline or transient error — keep in queue
      remaining.push(item);
      failures++;
    }
  }

  saveQueue(remaining);
  flushing = false;
  notifyChange();
  return failures;
}

// ── Connectivity listener ──

let listenerAttached = false;

/** Start listening for connectivity changes and auto-flush */
export function startOfflineSync() {
  if (listenerAttached || typeof window === "undefined") return;
  listenerAttached = true;

  window.addEventListener("online", () => {
    // Small delay to let the connection stabilize
    setTimeout(() => void flushQueue(), 1500);
    notifyChange();
  });

  window.addEventListener("offline", () => {
    notifyChange();
  });

  // Also flush on visibility change (user switches back to app)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      void flushQueue();
    }
  });

  // Flush on startup if there's pending writes
  if (navigator.onLine && pendingCount() > 0) {
    setTimeout(() => void flushQueue(), 2000);
  }
}

// ── Change notifications ──

function notifyChange() {
  try {
    window.dispatchEvent(new Event("routines365:offlineQueueChange"));
  } catch {}
}
