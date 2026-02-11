"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createRoutineItem, createRoutineItemsBulk, listRoutineItems } from "@/lib/supabaseData";
import { Toast, SubPageHeader, type ToastState } from "@/app/app/_components/ui";
import { usePremium, FREE_LIMITS } from "@/lib/premium";

type LibraryItem = { label: string; emoji?: string; section?: "morning" | "anytime" | "night"; suggestedCore?: boolean };

const LIBRARY: Array<{ title: string; items: LibraryItem[] }> = [
  {
    title: "Morning essentials",
    items: [
      { label: "Drink water", emoji: "💧", section: "morning", suggestedCore: true },
      { label: "Morning sunlight (10 min)", emoji: "🌅", section: "morning" },
      { label: "Make bed", emoji: "🛏️", section: "morning" },
      { label: "No phone first 30 min", emoji: "📵", section: "morning" },
      { label: "Morning stretch", emoji: "🙆", section: "morning" },
      { label: "Skincare (AM)", emoji: "🧴", section: "morning" },
      { label: "Cold shower", emoji: "🚿", section: "morning" },
      { label: "Protein breakfast", emoji: "🍳", section: "morning", suggestedCore: true },
    ],
  },
  {
    title: "Mind & focus",
    items: [
      { label: "Breathwork / meditation", emoji: "🌬️", section: "morning" },
      { label: "Gratitude practice", emoji: "🙏", section: "morning" },
      { label: "Journal / reflect", emoji: "📓", section: "morning" },
      { label: "Plan top 3 priorities", emoji: "🧠", section: "morning", suggestedCore: true },
      { label: "Deep work (60 min)", emoji: "🎯", section: "anytime", suggestedCore: true },
      { label: "Learn something new", emoji: "💡", section: "anytime" },
      { label: "Read (15+ min)", emoji: "📚", section: "anytime" },
      { label: "Limit social media", emoji: "📱", section: "anytime" },
      { label: "Inbox once", emoji: "📥", section: "anytime" },
      { label: "Weekly review", emoji: "📋", section: "anytime" },
    ],
  },
  {
    title: "Fitness & movement",
    items: [
      { label: "Walk", emoji: "🚶", section: "anytime", suggestedCore: true },
      { label: "Workout", emoji: "🏋️", section: "anytime", suggestedCore: true },
      { label: "Run", emoji: "🏃", section: "anytime" },
      { label: "Yoga", emoji: "🧘", section: "anytime" },
      { label: "Stretch / mobility (10 min)", emoji: "🤸", section: "anytime" },
      { label: "10,000 steps", emoji: "👟", section: "anytime" },
      { label: "Take the stairs", emoji: "🪜", section: "anytime" },
      { label: "Stand up every hour", emoji: "🧍", section: "anytime" },
      { label: "Get outside", emoji: "🌿", section: "anytime" },
    ],
  },
  {
    title: "Nutrition & supplements",
    items: [
      { label: "Protein at every meal", emoji: "🥩", section: "anytime" },
      { label: "Eat vegetables / greens", emoji: "🥬", section: "anytime" },
      { label: "Healthy lunch", emoji: "🥗", section: "anytime" },
      { label: "Drink 8 glasses of water", emoji: "🚰", section: "anytime" },
      { label: "No processed sugar", emoji: "🚫", section: "anytime" },
      { label: "No alcohol", emoji: "🍷", section: "anytime" },
      { label: "Supplements / vitamins", emoji: "💊", section: "morning" },
      { label: "Creatine", emoji: "🧃", section: "anytime" },
      { label: "Collagen", emoji: "🦴", section: "anytime" },
      { label: "Omega-3", emoji: "🐟", section: "anytime" },
      { label: "Magnesium", emoji: "🧲", section: "night" },
      { label: "Probiotics", emoji: "🦠", section: "morning" },
    ],
  },
  {
    title: "Recovery & self-care",
    items: [
      { label: "Sauna", emoji: "♨️", section: "anytime" },
      { label: "Cold plunge", emoji: "🧊", section: "anytime" },
      { label: "Red light therapy", emoji: "🔴", section: "anytime" },
      { label: "PEMF mat session", emoji: "🧲", section: "anytime" },
      { label: "Compression boots", emoji: "🦵", section: "anytime" },
      { label: "Foam roll / massage", emoji: "🙌", section: "anytime" },
      { label: "Epsom salt bath", emoji: "🛁", section: "night" },
      { label: "Dry brushing", emoji: "🪥", section: "morning" },
      { label: "Grounding / earthing", emoji: "🌿", section: "anytime" },
      { label: "Rest day (no workout)", emoji: "🛌", section: "anytime" },
      { label: "Skincare (PM)", emoji: "✨", section: "night" },
      { label: "Floss", emoji: "🦷", section: "night" },
    ],
  },
  {
    title: "Evening wind-down",
    items: [
      { label: "Sleep by target time", emoji: "😴", section: "night", suggestedCore: true },
      { label: "No screens 30 min before bed", emoji: "🌙", section: "night" },
      { label: "Shutdown ritual", emoji: "🔌", section: "night" },
      { label: "Evening stretch", emoji: "🧘", section: "night" },
      { label: "Gratitude list", emoji: "📝", section: "night" },
      { label: "Review tomorrow's plan", emoji: "📅", section: "night" },
      { label: "Tidy space (10 min)", emoji: "🧹", section: "night" },
      { label: "Prepare for tomorrow", emoji: "👔", section: "night" },
    ],
  },
  {
    title: "Relationships & social",
    items: [
      { label: "Call or text a friend", emoji: "📞", section: "anytime" },
      { label: "Quality time with partner", emoji: "❤️", section: "anytime" },
      { label: "Quality time with kids", emoji: "👨‍👧", section: "anytime" },
      { label: "Act of kindness", emoji: "🤝", section: "anytime" },
      { label: "Connect with family", emoji: "👨‍👩‍👧‍👦", section: "anytime" },
    ],
  },
  {
    title: "Creative & personal growth",
    items: [
      { label: "Practice instrument", emoji: "🎸", section: "anytime" },
      { label: "Language study", emoji: "🗣️", section: "anytime" },
      { label: "Write / blog", emoji: "✍️", section: "anytime" },
      { label: "Side project", emoji: "🛠️", section: "anytime" },
      { label: "Draw / art", emoji: "🎨", section: "anytime" },
      { label: "Do something creative", emoji: "🎭", section: "anytime" },
    ],
  },
  {
    title: "Productivity habits",
    items: [
      { label: "Time-block calendar", emoji: "🗓️", section: "morning" },
      { label: "Review goals", emoji: "🎯", section: "morning" },
      { label: "Single-task (no multitasking)", emoji: "🔒", section: "anytime" },
      { label: "Say no to something unnecessary", emoji: "✋", section: "anytime" },
      { label: "Batch small tasks", emoji: "📦", section: "anytime" },
    ],
  },
  {
    title: "Spiritual & emotional",
    items: [
      { label: "Pray / meditate", emoji: "🙏", section: "morning" },
      { label: "Emotional check-in", emoji: "🫀", section: "anytime" },
      { label: "Practice patience", emoji: "⏳", section: "anytime" },
      { label: "Scripture / devotional", emoji: "📖", section: "morning" },
    ],
  },
];

export default function RoutineLibraryPage() {
  const [toast, setToast] = useState<ToastState>("idle");
  const [toastMsg, setToastMsg] = useState("");
  const [query, setQuery] = useState("");
  const [addingKey, setAddingKey] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const [fromOnboarding, setFromOnboarding] = useState(false);
  const router = useRouter();
  const { isPremium } = usePremium();

  // Detect if user came from onboarding
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setFromOnboarding(params.get("from") === "onboarding");
    }
  }, []);

  const flat = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = LIBRARY.flatMap((g) => g.items);
    if (!q) return null; // show grouped view
    return all.filter((i) => (i.label ?? "").toLowerCase().includes(q));
  }, [query]);

  const show = (state: ToastState, msg?: string) => {
    setToast(state); setToastMsg(msg ?? "");
    if (state === "saved" || state === "error") setTimeout(() => setToast("idle"), 1500);
  };

  const addOne = async (it: LibraryItem) => {
    setAddingKey(it.label); show("saving");
    try {
      const existing = await listRoutineItems();
      if (!isPremium && existing.length >= FREE_LIMITS.maxHabits) {
        show("error", `Free plan allows ${FREE_LIMITS.maxHabits} habits. Upgrade for unlimited.`);
        return;
      }
      if (existing.some((e) => (e.label ?? "").trim().toLowerCase() === it.label.trim().toLowerCase())) {
        show("saved", "Already in your routines.");
        return;
      }
      await createRoutineItem({ label: it.label, emoji: it.emoji ?? null, section: it.section ?? "anytime", isNonNegotiable: !!it.suggestedCore });
      setAddedCount((c) => c + 1);
      show("saved", "Added ✓");
    } catch { show("error", "Add failed"); }
    finally { setAddingKey(""); }
  };

  const addStarterSet = async () => {
    show("saving");
    try {
      const existing = await listRoutineItems();
      const existingLabels = new Set(existing.map((e) => (e.label ?? "").trim().toLowerCase()));
      const starter = LIBRARY.flatMap((g) => g.items).filter((i) => i.suggestedCore);
      const toAdd = starter.filter((s) => !existingLabels.has(s.label.trim().toLowerCase()));
      if (toAdd.length === 0) { show("saved", "You already have the starter set."); return; }
      // Enforce free-tier limit
      const slotsLeft = isPremium ? Infinity : FREE_LIMITS.maxHabits - existing.length;
      const capped = slotsLeft < toAdd.length ? toAdd.slice(0, Math.max(0, slotsLeft)) : toAdd;
      if (capped.length === 0) { show("error", `Free plan allows ${FREE_LIMITS.maxHabits} habits. Upgrade for unlimited.`); return; }
      const maxOrder = Math.max(...existing.map((i) => i.sort_order ?? 0), 0);
      await createRoutineItemsBulk({
        items: capped.map((s, idx) => ({
          label: s.label, emoji: s.emoji ?? null, section: s.section ?? "anytime",
          isNonNegotiable: true, sortOrder: maxOrder + idx + 1,
        })),
      });
      setAddedCount((c) => c + capped.length);
      show("saved", `Added ${capped.length} routines ✓${capped.length < toAdd.length ? ` (${toAdd.length - capped.length} skipped — free limit)` : ""}`);
    } catch { show("error", "Add failed"); }
  };

  const renderItem = (it: LibraryItem) => (
    <div key={it.label} className="flex items-center justify-between gap-3 py-2.5 px-1"
      style={{ borderBottom: "1px solid var(--border-secondary)" }}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-base shrink-0">{it.emoji ?? ""}</span>
        <div className="min-w-0">
          <p className="truncate text-sm" style={{ color: "var(--text-primary)" }}>{it.label}</p>
          <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
            {it.section ?? "anytime"}{it.suggestedCore ? " · ⭐ core" : ""}
          </p>
        </div>
      </div>
      <button type="button" disabled={addingKey === it.label} onClick={() => void addOne(it)}
        className="btn-primary text-xs py-1.5 px-2.5 flex items-center gap-1 disabled:opacity-60 shrink-0">
        <Plus size={12} /> Add
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <Toast state={toast} message={toastMsg || undefined} />

      <SubPageHeader title="Routine library" subtitle={`${LIBRARY.reduce((n, g) => n + g.items.length, 0)} habits to choose from`}
        backHref={fromOnboarding ? "/app/onboarding" : "/app/settings/routines"}
        rightAction={
          <button type="button" onClick={() => void addStarterSet()} className="btn-primary text-xs py-2 px-3">
            Starter set
          </button>
        }
      />

      <section className="card p-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search habits..."
          className="w-full rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }} />
      </section>

      {/* Search results */}
      {flat !== null ? (
        <section className="card p-4">
          {flat.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No matches. Try different keywords.</p>
          ) : (
            flat.map(renderItem)
          )}
        </section>
      ) : (
        /* Grouped browsing view */
        LIBRARY.map((group) => {
          const isOpen = expandedGroup === group.title;
          return (
            <section key={group.title}>
              <button type="button" className="w-full flex items-center justify-between px-1 py-2"
                onClick={() => setExpandedGroup(isOpen ? null : group.title)}>
                <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
                  {group.title}
                  <span className="ml-2 font-normal" style={{ color: "var(--text-faint)" }}>({group.items.length})</span>
                </p>
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="card p-4 mt-1">
                  {group.items.map(renderItem)}
                </div>
              )}
            </section>
          );
        })
      )}

      {/* Floating "Done" CTA — appears after adding habits */}
      {addedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          style={{ background: "linear-gradient(transparent, var(--bg-primary) 30%)" }}>
          <button type="button"
            className="w-full max-w-md mx-auto block rounded-2xl py-4 text-base font-bold transition-transform active:scale-[0.98]"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}
            onClick={() => {
              localStorage.removeItem("routines365:gettingStarted:dismissed");
              router.replace("/app/today");
            }}>
            Start tracking → ({addedCount} habit{addedCount !== 1 ? "s" : ""} added)
          </button>
        </div>
      )}

      {/* Spacer for floating button */}
      {addedCount > 0 && <div className="h-24" />}
    </div>
  );
}
