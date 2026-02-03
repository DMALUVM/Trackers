"use client";

import { useEffect, useMemo, useState } from "react";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Exclude common iOS browsers that embed WebKit but aren't Safari.
  const isCriOS = /CriOS/.test(ua);
  const isFxiOS = /FxiOS/.test(ua);
  const isEdgiOS = /EdgiOS/.test(ua);
  return !isCriOS && !isFxiOS && !isEdgiOS;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  // iOS Safari uses navigator.standalone; others use display-mode.
  // @ts-expect-error - nonstandard
  const navStandalone = typeof navigator !== "undefined" && navigator.standalone;
  const mm = window.matchMedia?.("(display-mode: standalone)")?.matches;
  return Boolean(navStandalone || mm);
}

export function IosInstallPrompt() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem("routines365:iosInstallPrompt:dismissed");
      setDismissed(v === "1");
    } catch {
      setDismissed(true);
    }
  }, []);

  const shouldShow = useMemo(() => {
    if (dismissed) return false;
    if (!isIos()) return false;
    if (!isSafari()) return false;
    if (isStandalone()) return false;
    return true;
  }, [dismissed]);

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Add to Home Screen</p>
            <p className="mt-1 text-xs text-neutral-300">
              For faster open + fewer login issues on iPhone.
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
            onClick={() => {
              localStorage.setItem("routines365:iosInstallPrompt:dismissed", "1");
              setDismissed(true);
            }}
          >
            Dismiss
          </button>
        </div>

        <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-neutral-200">
          <li>Tap the Share button in Safari</li>
          <li>Scroll and tap “Add to Home Screen”</li>
          <li>Open from your Home Screen next time</li>
        </ol>
      </div>
    </div>
  );
}
