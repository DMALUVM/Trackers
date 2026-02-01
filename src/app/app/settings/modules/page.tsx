"use client";

import { useEffect, useState } from "react";

const KEY = "dr:modules:hideNeuro";

export default function ModulesSettingsPage() {
  const [hideNeuro, setHideNeuro] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    setHideNeuro(raw === "1");
  }, []);

  const toggle = () => {
    const next = !hideNeuro;
    setHideNeuro(next);
    localStorage.setItem(KEY, next ? "1" : "0");
    setStatus("Saved.");
    setTimeout(() => setStatus(""), 1200);
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Modules</h1>
        <p className="text-sm text-neutral-400">
          Customize the bottom nav. (Sync to your account coming next.)
        </p>
        {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm hover:bg-white/10"
        >
          <div>
            <p className="font-medium text-neutral-100">Neuro</p>
            <p className="text-xs text-neutral-400">
              Hide Neuro tab (most people won’t use it).
            </p>
          </div>
          <span
            className={
              hideNeuro
                ? "rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-neutral-300"
                : "rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-200"
            }
          >
            {hideNeuro ? "HIDDEN" : "VISIBLE"}
          </span>
        </button>
      </section>
    </div>
  );
}
