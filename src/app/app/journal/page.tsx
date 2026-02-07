"use client";

import { useCallback, useEffect, useState } from "react";
import { useToday } from "@/lib/hooks";
import { supabase } from "@/lib/supabaseClient";
import { getUserId } from "@/lib/supabaseData";
import { Toast, type ToastState } from "@/app/app/_components/ui";
import { hapticSuccess } from "@/lib/haptics";

export default function JournalPage() {
  const { dateKey } = useToday();
  const [text, setText] = useState("");
  const [toast, setToast] = useState<ToastState>("idle");
  const [loaded, setLoaded] = useState(false);

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
        if (data?.notes) setText(data.notes);
      } catch { /* no entry yet */ }
      setLoaded(true);
    })();
  }, [dateKey]);

  // Auto-save with debounce
  const save = useCallback(async (content: string) => {
    setToast("saving");
    try {
      const userId = await getUserId();
      const { error } = await supabase.from("activity_logs").upsert({
        user_id: userId,
        date: dateKey,
        activity_key: "journal",
        value: content.length,
        unit: "count",
        notes: content,
      }, { onConflict: "user_id,date,activity_key" });
      if (error) throw error;
      setToast("saved");
      hapticSuccess();
      setTimeout(() => setToast("idle"), 1200);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  }, [dateKey]);

  return (
    <div className="space-y-5">
      <Toast state={toast} />

      <header>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📓</span>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Journal</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Daily reflections and notes</p>
          </div>
        </div>
      </header>

      <section className="card p-4">
        <label className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
          {dateKey}
        </label>
        {loaded ? (
          <textarea
            className="mt-3 w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
              minHeight: 200,
            }}
            placeholder="What's on your mind today? Wins, learnings, gratitude..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <div className="mt-3 rounded-xl h-48" style={{ background: "var(--bg-card-hover)" }} />
        )}
        <button type="button" onClick={() => void save(text)}
          className="mt-3 btn-primary w-full text-sm py-3"
          disabled={!loaded}>
          Save entry
        </button>
      </section>

      {text.length > 0 && (
        <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
          {text.split(/\s+/).filter(Boolean).length} words
        </p>
      )}
    </div>
  );
}
