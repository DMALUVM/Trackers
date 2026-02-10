"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Pencil, ChevronLeft, Check } from "lucide-react";
import { useToday } from "@/lib/hooks";
import { supabase } from "@/lib/supabaseClient";
import { getUserId, listRoutineItems, upsertDailyChecks } from "@/lib/supabaseData";
import { Toast, type ToastState } from "@/app/app/_components/ui";
import { hapticSuccess, hapticLight } from "@/lib/haptics";

// ── Types ──
type JournalMode = "guided" | "free";

type GuidedEntry = {
  mode: "guided";
  gratitude: [string, string, string];
  intention: string;
  wentWell: string;
  toImprove: string;
};

type FreeEntry = {
  mode: "free";
  text: string;
};

type JournalData = GuidedEntry | FreeEntry;

const EMPTY_GUIDED: GuidedEntry = {
  mode: "guided",
  gratitude: ["", "", ""],
  intention: "",
  wentWell: "",
  toImprove: "",
};

const EMPTY_FREE: FreeEntry = { mode: "free", text: "" };

// ── Parse stored notes back into JournalData ──
function parseNotes(notes: string | null): JournalData | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed?.mode === "guided") return parsed as GuidedEntry;
    if (parsed?.mode === "free") return { mode: "free", text: parsed.text ?? "" };
  } catch { /* not JSON — legacy free text */ }
  return { mode: "free", text: notes };
}

function wordCount(data: JournalData): number {
  const allText =
    data.mode === "free"
      ? data.text
      : [
          ...data.gratitude,
          data.intention,
          data.wentWell,
          data.toImprove,
        ].join(" ");
  return allText.split(/\s+/).filter(Boolean).length;
}

function isEmpty(data: JournalData): boolean {
  if (data.mode === "free") return !data.text.trim();
  return (
    data.gratitude.every((g) => !g.trim()) &&
    !data.intention.trim() &&
    !data.wentWell.trim() &&
    !data.toImprove.trim()
  );
}

// ── Components ──
function PromptSection({
  emoji,
  label,
  children,
}: {
  emoji: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function JournalTextarea({
  value,
  onChange,
  placeholder,
  minHeight = 80,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  minHeight?: number;
}) {
  return (
    <textarea
      className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none"
      style={{
        background: "var(--bg-input)",
        border: "1px solid var(--border-secondary)",
        color: "var(--text-primary)",
        minHeight,
      }}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ── Main Page ──
export default function JournalPage() {
  const router = useRouter();
  const { dateKey } = useToday();
  const [mode, setMode] = useState<JournalMode>(() => {
    try {
      return (localStorage.getItem("routines365:journalMode") as JournalMode) ?? "guided";
    } catch {
      return "guided";
    }
  });
  const [guided, setGuided] = useState<GuidedEntry>({ ...EMPTY_GUIDED });
  const [free, setFree] = useState<FreeEntry>({ ...EMPTY_FREE });
  const [toast, setToast] = useState<ToastState>("idle");
  const [loaded, setLoaded] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Load existing entry
  useEffect(() => {
    void (async () => {
      try {
        const userId = await getUserId();
        const { data } = await supabase
          .from("activity_logs")
          .select("notes")
          .eq("user_id", userId)
          .eq("date", dateKey)
          .eq("activity_key", "journal")
          .maybeSingle();
        const parsed = parseNotes(data?.notes ?? null);
        if (parsed) {
          if (parsed.mode === "guided") {
            setGuided(parsed);
            setMode("guided");
          } else {
            setFree(parsed);
            setMode("free");
          }
          setHasSaved(true);
        }
      } catch { /* no entry yet */ }
      setLoaded(true);
    })();
  }, [dateKey]);

  // Save preference when mode changes
  const switchMode = (m: JournalMode) => {
    hapticLight();
    setMode(m);
    try { localStorage.setItem("routines365:journalMode", m); } catch { /* ignore */ }
  };

  const currentData: JournalData = mode === "guided" ? guided : free;

  // Auto-check journal habit after save
  const autoCheckJournal = useCallback(async () => {
    try {
      const items = await listRoutineItems();
      const journalItem = items.find((i) => i.label.toLowerCase().includes("journal"));
      if (journalItem) {
        await upsertDailyChecks({
          dateKey,
          checks: [{ routineItemId: journalItem.id, done: true }],
        });
        window.dispatchEvent(new Event("routines365:routinesChanged"));
      }
    } catch { /* best effort */ }
  }, [dateKey]);

  const save = useCallback(async () => {
    const data = mode === "guided" ? guided : free;
    if (isEmpty(data)) return;

    setToast("saving");
    try {
      const userId = await getUserId();
      const notes = JSON.stringify(data);
      const { error } = await supabase.from("activity_logs").upsert(
        {
          user_id: userId,
          date: dateKey,
          activity_key: "journal",
          value: wordCount(data),
          unit: "count",
          notes,
        },
        { onConflict: "user_id,date,activity_key" }
      );
      if (error) throw error;

      await autoCheckJournal();

      setHasSaved(true);
      hapticSuccess();
      setToast("saved");
      setTimeout(() => setToast("idle"), 1200);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  }, [mode, guided, free, dateKey, autoCheckJournal]);

  // Guided state helpers
  const setGratitude = (index: number, val: string) => {
    setGuided((prev) => {
      const g = [...prev.gratitude] as [string, string, string];
      g[index] = val;
      return { ...prev, gratitude: g };
    });
  };

  const words = wordCount(currentData);
  const dateLabel = (() => {
    try {
      const d = new Date(dateKey + "T12:00:00");
      return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    } catch { return dateKey; }
  })();

  return (
    <div className="space-y-5 pb-8">
      <Toast state={toast} />

      {/* Header */}
      <header>
        <button type="button" onClick={() => router.back()}
          className="flex items-center gap-1 mb-3 text-xs font-semibold"
          style={{ color: "var(--text-muted)" }}>
          <ChevronLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📓</span>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Journal</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{dateLabel}</p>
          </div>
        </div>
      </header>

      {/* Mode Switcher */}
      <div className="flex gap-2">
        <button type="button" onClick={() => switchMode("guided")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: mode === "guided" ? "var(--accent-green-soft)" : "var(--bg-card)",
            color: mode === "guided" ? "var(--accent-green-text)" : "var(--text-muted)",
            border: `1px solid ${mode === "guided" ? "var(--accent-green)" : "var(--border-primary)"}`,
          }}>
          <BookOpen size={14} /> Guided
        </button>
        <button type="button" onClick={() => switchMode("free")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: mode === "free" ? "var(--accent-green-soft)" : "var(--bg-card)",
            color: mode === "free" ? "var(--accent-green-text)" : "var(--text-muted)",
            border: `1px solid ${mode === "free" ? "var(--accent-green)" : "var(--border-primary)"}`,
          }}>
          <Pencil size={14} /> Free Write
        </button>
      </div>

      {/* Content */}
      {!loaded ? (
        <div className="space-y-4">
          <div className="rounded-2xl h-32" style={{ background: "var(--bg-card-hover)" }} />
          <div className="rounded-2xl h-24" style={{ background: "var(--bg-card-hover)" }} />
        </div>
      ) : mode === "guided" ? (
        <div className="space-y-4">
          {/* Gratitude */}
          <PromptSection emoji="🙏" label="Gratitude">
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              Three things I'm grateful for today
            </p>
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-faint)" }}>
                    {i + 1}.
                  </span>
                  <input
                    type="text"
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-primary)",
                    }}
                    placeholder={
                      i === 0 ? "e.g. Morning coffee with my partner"
                        : i === 1 ? "e.g. A great workout"
                          : "e.g. Progress on my project"
                    }
                    value={guided.gratitude[i]}
                    onChange={(e) => setGratitude(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </PromptSection>

          {/* Intention */}
          <PromptSection emoji="🎯" label="Daily Intention">
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              What's my main focus or intention for today?
            </p>
            <JournalTextarea
              value={guided.intention}
              onChange={(v) => setGuided((prev) => ({ ...prev, intention: v }))}
              placeholder="Today I will focus on..."
              minHeight={60}
            />
          </PromptSection>

          {/* Reflection */}
          <PromptSection emoji="💭" label="Reflection">
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              What went well? What could be better?
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--accent-green-text)" }}>
                  ✓ What went well
                </label>
                <JournalTextarea
                  value={guided.wentWell}
                  onChange={(v) => setGuided((prev) => ({ ...prev, wentWell: v }))}
                  placeholder="Wins, progress, good moments..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                  → What to improve
                </label>
                <JournalTextarea
                  value={guided.toImprove}
                  onChange={(v) => setGuided((prev) => ({ ...prev, toImprove: v }))}
                  placeholder="Adjustments, lessons, next steps..."
                />
              </div>
            </div>
          </PromptSection>
        </div>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <JournalTextarea
            value={free.text}
            onChange={(v) => setFree({ mode: "free", text: v })}
            placeholder="Write freely — thoughts, ideas, reflections, brain dump..."
            minHeight={260}
          />
        </div>
      )}

      {/* Save + word count */}
      <div className="space-y-3">
        <button type="button" onClick={() => void save()}
          className="btn-primary w-full text-sm py-3 flex items-center justify-center gap-2"
          disabled={!loaded || isEmpty(currentData)}>
          {hasSaved ? <><Check size={16} /> Update entry</> : "Save entry"}
        </button>

        {words > 0 && (
          <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
            {words} word{words !== 1 ? "s" : ""}
            {hasSaved && " · saved ✓"}
          </p>
        )}
      </div>
    </div>
  );
}
