"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { pendingCount, flushQueue, startOfflineSync } from "@/lib/offlineQueue";

/**
 * Slim banner that appears when the device is offline.
 * Shows pending write count and auto-syncs when back online.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    // Initialize
    startOfflineSync();
    setOffline(!navigator.onLine);
    setPending(pendingCount());

    const updateOnline = () => {
      const isOffline = !navigator.onLine;
      setOffline(isOffline);
      if (!isOffline) {
        // Coming back online — trigger sync
        setSyncing(true);
        flushQueue().then(() => {
          setPending(pendingCount());
          setSyncing(false);
          if (pendingCount() === 0) {
            setJustSynced(true);
            setTimeout(() => setJustSynced(false), 3000);
          }
        });
      }
    };

    const updateQueue = () => setPending(pendingCount());

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    window.addEventListener("routines365:offlineQueueChange", updateQueue);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener("routines365:offlineQueueChange", updateQueue);
    };
  }, []);

  // Show "synced" confirmation briefly after reconnecting
  if (justSynced) {
    return (
      <div className="mx-4 mb-2 rounded-xl px-3 py-2 flex items-center gap-2 animate-fade-in-up"
        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <span className="text-xs">✅</span>
        <p className="text-xs font-semibold" style={{ color: "var(--accent-green-text)" }}>
          All changes synced
        </p>
      </div>
    );
  }

  // Nothing to show when online with no pending writes
  if (!offline && pending === 0) return null;

  // Online but still has pending writes (syncing)
  if (!offline && pending > 0) {
    return (
      <div className="mx-4 mb-2 rounded-xl px-3 py-2 flex items-center gap-2"
        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <RefreshCw size={13} className="animate-spin" style={{ color: "#f59e0b" }} />
        <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
          Syncing {pending} pending {pending === 1 ? "change" : "changes"}…
        </p>
      </div>
    );
  }

  // Offline
  return (
    <div className="mx-4 mb-2 rounded-xl px-3 py-2 flex items-center gap-2"
      style={{ background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)" }}>
      <WifiOff size={13} style={{ color: "var(--text-faint)" }} />
      <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
        Offline{pending > 0 ? ` · ${pending} ${pending === 1 ? "change" : "changes"} saved locally` : " · your data is cached"}
      </p>
    </div>
  );
}
