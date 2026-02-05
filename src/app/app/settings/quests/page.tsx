"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type BuiltinQuestId = "q-rowing" | "q-walk" | "q-run" | "q-recovery" | "q-green";

type CustomQuest = {
  id: string;
  emoji: string;
  title: string;
  // counts as done for a day if any routine label includes any keyword (case-insensitive)
  keywords: string[];
};

type QuestConfig = {
  enabled: boolean;
  maxShown: 0 | 1 | 2 | 3;
  selected: BuiltinQuestId[];
  custom: CustomQuest[];
};

const KEY = "routines365:quests:v1";

const BUILTINS: Array<{ id: BuiltinQuestId; title: string; desc: string }> = [
  { id: "q-rowing", title: "Rowing meters (WTD)", desc: "Track weekly meters rowed" },
  { id: "q-walk", title: "Walking steps (WTD)", desc: "Track weekly steps" },
  { id: "q-run", title: "Running miles (WTD)", desc: "Track weekly miles" },
  { id: "q-recovery", title: "Recovery sessions (WTD)", desc: "Sauna + cold sessions" },
  { id: "q-green", title: "Green days (WTD)", desc: "CORE green days this week" },
];

function loadCfg(): QuestConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error("no");
    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      maxShown: (parsed.maxShown ?? 3) as any,
      selected: Array.isArray(parsed.selected) ? parsed.selected : ["q-rowing", "q-walk", "q-green"],
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
    };
  } catch {
    return {
      enabled: true,
      maxShown: 3,
      selected: ["q-rowing", "q-walk", "q-green"],
      custom: [],
    };
  }
}

function saveCfg(cfg: QuestConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event("routines365:questsChanged"));
}

export default function QuestSettingsPage() {
  const [cfg, setCfg] = useState<QuestConfig | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    setCfg(loadCfg());
  }, []);

  const selectedSet = useMemo(() => new Set(cfg?.selected ?? []), [cfg]);

  const toggleBuiltin = (id: BuiltinQuestId) => {
    if (!cfg) return;
    const selected = selectedSet.has(id) ? cfg.selected.filter((x) => x !== id) : [...cfg.selected, id];
    const next = { ...cfg, selected };
    setCfg(next);
    saveCfg(next);
    setStatus("Saved.");
    setTimeout(() => setStatus(""), 800);
  };

  const addCustom = () => {
    if (!cfg) return;
    const title = prompt("Custom quest name (e.g., Pullups)")?.trim();
    if (!title) return;
    const emoji = prompt("Emoji (e.g., 💪)")?.trim() || "⭐";
    const keywordsRaw = prompt("Keywords (comma-separated) matched against routine labels (e.g., pullup,pull-ups)")?.trim();
    if (!keywordsRaw) return;
    const keywords = keywordsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (keywords.length === 0) return;

    const id = `c-${Date.now()}`;
    const custom: CustomQuest[] = [...cfg.custom, { id, emoji, title, keywords }];
    const next = { ...cfg, custom };
    setCfg(next);
    saveCfg(next);
  };

  const delCustom = (id: string) => {
    if (!cfg) return;
    const custom = cfg.custom.filter((c) => c.id !== id);
    const next = { ...cfg, custom };
    setCfg(next);
    saveCfg(next);
  };

  if (!cfg) return null;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Quests</h1>
        <p className="text-sm text-neutral-400">Choose what shows on Today. Keep it motivating, not noisy.</p>
        <div className="pt-2 flex items-center justify-between">
          <Link href="/app/settings" className="text-xs text-neutral-300 underline">
            Back to settings
          </Link>
          {status ? <span className="text-xs text-neutral-500">{status}</span> : null}
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-100">Enable quests</p>
          <button
            type="button"
            className={
              cfg.enabled
                ? "rounded-full bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-200"
                : "rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-neutral-300"
            }
            onClick={() => {
              const next = { ...cfg, enabled: !cfg.enabled };
              setCfg(next);
              saveCfg(next);
            }}
          >
            {cfg.enabled ? "ON" : "OFF"}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-100">Show on Today</p>
          <select
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            value={cfg.maxShown}
            onChange={(e) => {
              const v = Number(e.target.value) as any;
              const next = { ...cfg, maxShown: v };
              setCfg(next);
              saveCfg(next);
            }}
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-sm font-semibold text-neutral-100">Built-in quests</p>
        <div className="space-y-2">
          {BUILTINS.map((q) => {
            const on = selectedSet.has(q.id);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => toggleBuiltin(q.id)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-left hover:bg-white/5"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-100">{q.title}</p>
                  <p className="text-xs text-neutral-500">{q.desc}</p>
                </div>
                <span
                  className={
                    on
                      ? "rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-200"
                      : "rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-neutral-300"
                  }
                >
                  {on ? "ON" : "OFF"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-100">Custom streak quests</p>
          <button
            type="button"
            onClick={addCustom}
            className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"
          >
            + Add
          </button>
        </div>

        {cfg.custom.length === 0 ? (
          <p className="text-sm text-neutral-400">None yet. Add one like “💪 Pullups” with keyword “pullup”.</p>
        ) : (
          <div className="space-y-2">
            {cfg.custom.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-100">
                    <span className="mr-2">{c.emoji}</span>
                    {c.title}
                  </p>
                  <p className="text-xs text-neutral-500">Keywords: {c.keywords.join(", ")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => delCustom(c.id)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-neutral-500">
        Note: Custom quests count streaks by consecutive days where at least one routine label matches a keyword.
      </p>
    </div>
  );
}
