"use client";

import { useEffect, useMemo, useState } from "react";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  // @ts-expect-error - nonstandard
  const navStandalone = typeof navigator !== "undefined" && navigator.standalone;
  const mm = window.matchMedia?.("(display-mode: standalone)")?.matches;
  return Boolean(navStandalone || mm);
}

export function IosInstallPrompt() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try { setDismissed(localStorage.getItem("routines365:iosInstallPrompt:dismissed") === "1"); }
    catch { setDismissed(true); }
  }, []);

  const shouldShow = useMemo(() => !dismissed && isIos() && isSafari() && !isStandalone(), [dismissed]);
  if (!shouldShow) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4">
      <div className="mx-auto w-full max-w-md rounded-2xl p-4 shadow-lg backdrop-blur"
        style={{ background: "var(--bg-sheet)", border: "1px solid var(--border-primary)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Add to Home Screen</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              For faster open + fewer login issues on iPhone.
            </p>
          </div>
          <button type="button" className="btn-secondary text-xs py-2 px-3"
            onClick={() => { localStorage.setItem("routines365:iosInstallPrompt:dismissed", "1"); setDismissed(true); }}>
            Dismiss
          </button>
        </div>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs" style={{ color: "var(--text-secondary)" }}>
          <li>Tap the Share button in Safari</li>
          <li>Scroll and tap "Add to Home Screen"</li>
          <li>Open from your Home Screen next time</li>
        </ol>
      </div>
    </div>
  );
}
