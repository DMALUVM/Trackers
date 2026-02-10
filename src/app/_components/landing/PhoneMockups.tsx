/* ────────────────────────────────────────────
   Phone mockup components for the landing page.
   These are pure render components — no hooks, no state.
   ──────────────────────────────────────────── */

function PhoneFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-[36px] p-2"
        style={{
          background:
            "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="rounded-[28px] overflow-hidden relative"
          style={{ background: "#0a0a0a", width: 240 }}
        >
          {/* Notch */}
          <div className="flex justify-center pt-1.5 pb-0.5">
            <div
              className="w-20 h-5 rounded-full"
              style={{ background: "#000" }}
            />
          </div>
          <div className="px-3 pb-3">{children}</div>
          {/* Bottom nav */}
          <div
            className="flex justify-around items-center py-2 border-t"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.5)",
            }}
          >
            {[
              { icon: "🏠", l: "Today" },
              { icon: "📈", l: "Progress" },
              { icon: "🧠", l: "Neuro" },
            ].map(({ icon, l }) => (
              <div key={l} className="flex flex-col items-center gap-0.5">
                <span style={{ fontSize: 11 }}>{icon}</span>
                <span
                  className="text-[7px] font-semibold"
                  style={{
                    color:
                      l === label ? "#10b981" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
    </div>
  );
}

/* ── Mockup 1 — Today Page ── */
export function MockToday() {
  const coreHabits = [
    { emoji: "💊", label: "Nattokinase", done: true },
    { emoji: "🏋️", label: "Workout", done: true },
    { emoji: "🧃", label: "Creatine", done: true },
    { emoji: "🦴", label: "Collagen", done: true },
    { emoji: "🌀", label: "Lymphatic flow", done: true },
    { emoji: "🍷", label: "No alcohol", done: true },
  ];
  const bonusHabits = [
    { emoji: "📓", label: "Journal", done: true },
    { emoji: "🧊", label: "Cold exposure", done: false },
    { emoji: "📚", label: "Read (10 min)", done: false },
  ];
  const weekDays = [
    { d: "W", n: "5", c: "green" },
    { d: "T", n: "6", c: "green" },
    { d: "F", n: "7", c: "green" },
    { d: "S", n: "8", c: "green" },
    { d: "S", n: "9", c: "green" },
    { d: "M", n: "10", c: "green" },
    { d: "T", n: "11", c: "today" },
  ];
  const coreDone = coreHabits.filter((h) => h.done).length;

  return (
    <PhoneFrame label="Today">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-[8px] font-medium"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Good morning 👋
            </p>
            <p className="text-[11px] font-bold text-white">
              Tuesday{" "}
              <span
                className="text-[8px] font-normal"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Feb 11
              </span>
            </p>
          </div>
          <div className="flex gap-1">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ fontSize: 8 }}>🏆</span>
            </div>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-white" style={{ fontSize: 7 }}>
                •••
              </span>
            </div>
          </div>
        </div>

        {/* Score card */}
        <div
          className="rounded-xl p-2.5"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="relative shrink-0"
              style={{ width: 44, height: 44 }}
            >
              <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - 1)}`}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                style={{ color: "#10b981" }}
              >
                ✓
              </span>
            </div>
            <div className="flex-1">
              <p
                className="text-[9px] font-semibold"
                style={{ color: "#10b981" }}
              >
                Green Day! 🎉
              </p>
              <p
                className="text-[7px]"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {coreDone}/{coreHabits.length} core · +1 bonus
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span style={{ fontSize: 9 }}>🔥</span>
                <span className="text-[9px] font-bold text-white">7</span>
                <span
                  className="text-[7px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  day streak · best 7
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-2 px-0.5">
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span
                  className="text-[6px] font-semibold"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {d.d}
                </span>
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[7px] font-bold"
                  style={{
                    background:
                      d.c === "green"
                        ? "#10b981"
                        : d.c === "today"
                          ? "rgba(16,185,129,0.15)"
                          : "rgba(255,255,255,0.05)",
                    border:
                      d.c === "today" ? "1.5px solid #10b981" : "none",
                    color:
                      d.c === "green" ? "#000" : "rgba(255,255,255,0.5)",
                    transform: d.c === "today" ? "scale(1.1)" : "none",
                  }}
                >
                  {d.n}
                </div>
              </div>
            ))}
          </div>
          <div
            className="mt-2 flex items-center justify-between text-[7px]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <span>Next: ⚡ One Week</span>
            <span style={{ color: "#10b981" }}>🎉 Today!</span>
          </div>
        </div>

        {/* Green Day celebration */}
        <div
          className="rounded-xl p-2 text-center"
          style={{
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <span style={{ fontSize: 14 }}>🎉</span>
          <p
            className="text-[8px] font-bold"
            style={{ color: "#10b981" }}
          >
            7-day streak! You&apos;re built different.
          </p>
        </div>

        {/* Core habits */}
        <div>
          <div className="flex justify-between mb-1">
            <span
              className="text-[7px] font-bold tracking-wider uppercase"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Core
            </span>
            <span
              className="text-[7px] font-semibold"
              style={{ color: "#10b981" }}
            >
              {coreDone}/{coreHabits.length}
            </span>
          </div>
          <div className="space-y-[3px]">
            {coreHabits.map((h) => (
              <div
                key={h.label}
                className="flex items-center gap-1.5 rounded-lg px-2 py-[5px]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: "#10b981" }}
                >
                  <span className="text-[7px] text-black font-bold">✓</span>
                </div>
                <span className="text-[7px]">{h.emoji}</span>
                <span
                  className="text-[8px] line-through"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {h.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bonus habits */}
        <div>
          <div className="flex justify-between mb-1">
            <span
              className="text-[7px] font-bold tracking-wider uppercase"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              Bonus
            </span>
            <span
              className="text-[7px]"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              1/{bonusHabits.length}
            </span>
          </div>
          <div className="space-y-[3px]">
            {bonusHabits.map((h) => (
              <div
                key={h.label}
                className="flex items-center gap-1.5 rounded-lg px-2 py-[4px]"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div
                  className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                  style={{
                    background: h.done ? "#10b981" : "transparent",
                    border: h.done
                      ? "none"
                      : "1.5px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {h.done && (
                    <span className="text-[6px] text-black font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <span className="text-[7px]">{h.emoji}</span>
                <span
                  className={`text-[8px] ${h.done ? "line-through" : ""}`}
                  style={{
                    color: h.done
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(255,255,255,0.55)",
                  }}
                >
                  {h.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ── Mockup 2 — Progress Calendar ── */
export function MockProgress() {
  const days = [
    ...Array.from({ length: 6 }, (_, i) => ({ n: 26 + i, c: "faded" })),
    { n: 1, c: "green" },
    { n: 2, c: "green" },
    { n: 3, c: "green" },
    { n: 4, c: "yellow" },
    { n: 5, c: "green" },
    { n: 6, c: "green" },
    { n: 7, c: "green" },
    { n: 8, c: "green" },
    { n: 9, c: "green" },
    { n: 10, c: "green" },
    { n: 11, c: "today" },
    ...Array.from({ length: 17 }, (_, i) => ({ n: 12 + i, c: "future" })),
  ];

  return (
    <PhoneFrame label="Progress">
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-bold text-white">Progress</p>
          <p
            className="text-[7px]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Tap any day to review
          </p>
        </div>

        <div
          className="rounded-xl p-2.5"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[7px]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              ‹
            </span>
            <span className="text-[9px] font-bold text-white">
              February 2026
            </span>
            <span
              className="text-[7px]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              ›
            </span>
          </div>
          <div className="grid grid-cols-7 gap-[3px] text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span
                key={i}
                className="text-[6px] font-semibold mb-1"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {d}
              </span>
            ))}
            {days.map((d, i) => {
              const bg =
                d.c === "green"
                  ? "#10b981"
                  : d.c === "yellow"
                    ? "#eab308"
                    : d.c === "red"
                      ? "#ef4444"
                      : d.c === "today"
                        ? "rgba(16,185,129,0.15)"
                        : "transparent";
              const border =
                d.c === "today" ? "1.5px solid #10b981" : "none";
              const textColor =
                d.c === "green"
                  ? "#000"
                  : d.c === "yellow"
                    ? "#000"
                    : d.c === "faded"
                      ? "rgba(255,255,255,0.1)"
                      : d.c === "future"
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(255,255,255,0.5)";
              return (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-full text-[7px] font-bold"
                  style={{
                    width: 22,
                    height: 22,
                    background: bg,
                    border,
                    color: textColor,
                    margin: "0 auto",
                  }}
                >
                  {d.n}
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-2 justify-center">
            {[
              { c: "#10b981", l: "All core" },
              { c: "#eab308", l: "Missed 1" },
            ].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: c }}
                />
                <span
                  className="text-[6px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "CURRENT", value: "10", sub: "consecutive green days" },
            { label: "BEST", value: "10", sub: "all-time record" },
            { label: "CORE HIT-RATE", value: "91%", sub: "this week" },
            { label: "GREEN DAYS", value: "10", sub: "this month" },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              className="rounded-lg p-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p
                className="text-[6px] font-bold tracking-wider uppercase"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {label}
              </p>
              <p className="text-sm font-extrabold text-white mt-0.5">
                {value}
              </p>
              <p
                className="text-[6px]"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                {sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ── Mockup 3 — My Streaks ── */
export function MockStreaks() {
  const habits = [
    { emoji: "💊", label: "Nattokinase", core: true, streak: 10, pct: "100%", best: "10d" },
    { emoji: "🏋️", label: "Workout", core: true, streak: 8, pct: "80%", best: "8d" },
    { emoji: "🍷", label: "No alcohol", core: true, streak: 10, pct: "100%", best: "10d" },
    { emoji: "🧃", label: "Creatine", core: true, streak: 10, pct: "100%", best: "10d" },
    { emoji: "🌀", label: "Lymphatic flow", core: true, streak: 7, pct: "70%", best: "7d" },
    { emoji: "📓", label: "Journal", core: false, streak: 5, pct: "50%", best: "5d" },
  ];

  return (
    <PhoneFrame label="Today">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-white">My Streaks</p>
            <p
              className="text-[7px]"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              13 habits tracked
            </p>
          </div>
          <div
            className="rounded-lg px-2 py-1 flex items-center gap-1"
            style={{ border: "1px solid rgba(16,185,129,0.3)" }}
          >
            <span style={{ fontSize: 8 }}>👥</span>
            <span
              className="text-[7px] font-semibold"
              style={{ color: "#10b981" }}
            >
              Partner
            </span>
          </div>
        </div>

        <div className="space-y-1">
          {habits.map((h) => (
            <div
              key={h.label}
              className="flex items-center gap-2 rounded-xl px-2 py-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span className="text-sm">{h.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-white truncate">
                    {h.label}
                  </span>
                  {h.core && (
                    <span
                      className="text-[5px] font-bold px-1 py-0.5 rounded"
                      style={{
                        background: "rgba(16,185,129,0.2)",
                        color: "#10b981",
                      }}
                    >
                      CORE
                    </span>
                  )}
                </div>
                <p
                  className="text-[7px]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {h.pct} · Best: {h.best}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className="text-sm font-extrabold"
                  style={{ color: "#10b981" }}
                >
                  {h.streak}
                </p>
                <p
                  className="text-[6px]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  days
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ── Mockup 4 — Sleep / Biometrics ── */
export function MockSleep() {
  const nights = [
    { d: "Tue", deep: 28, core: 40, rem: 22, total: "7h 12m" },
    { d: "Wed", deep: 22, core: 44, rem: 18, total: "6h 49m" },
    { d: "Thu", deep: 30, core: 38, rem: 24, total: "7h 31m" },
    { d: "Fri", deep: 18, core: 46, rem: 16, total: "6h 15m" },
    { d: "Sat", deep: 32, core: 36, rem: 26, total: "7h 42m" },
    { d: "Sun", deep: 24, core: 42, rem: 20, total: "6h 58m" },
    { d: "Mon", deep: 26, core: 40, rem: 22, total: "7h 8m" },
  ];

  return (
    <PhoneFrame label="Progress">
      <div className="space-y-2">
        <div
          className="rounded-lg px-2 py-1.5 text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span
            className="text-[8px] font-semibold"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            📈 Biometric Insights
          </span>
        </div>

        <div
          className="rounded-xl p-2.5"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex justify-between mb-2">
            <span
              className="text-[7px] font-bold tracking-wider uppercase"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              🌙 Sleep — 7 Nights
            </span>
            <span
              className="text-[7px] font-semibold"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              avg 7h 5m
            </span>
          </div>
          <div className="space-y-[5px]">
            {nights.map((n) => (
              <div key={n.d} className="flex items-center gap-2">
                <span
                  className="text-[7px] w-5 text-right shrink-0"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {n.d}
                </span>
                <div className="flex-1 flex h-3 rounded-sm overflow-hidden">
                  <div style={{ width: `${n.deep}%`, background: "#4338ca" }} />
                  <div style={{ width: `${n.core}%`, background: "#6366f1" }} />
                  <div style={{ width: `${n.rem}%`, background: "#a78bfa" }} />
                </div>
                <span
                  className="text-[7px] w-8 text-right shrink-0"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {n.total}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-2 justify-center">
            {[
              { c: "#4338ca", l: "Deep" },
              { c: "#6366f1", l: "Core" },
              { c: "#a78bfa", l: "REM" },
            ].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: c }}
                />
                <span
                  className="text-[6px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl p-2.5"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <p
            className="text-[7px] font-bold tracking-wider uppercase"
            style={{ color: "#eab308" }}
          >
            ✨ Habit × Body
          </p>
          <p
            className="text-[8px] mt-1"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Your HRV averages 12ms higher on days you complete cold exposure and
            breathwork.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {[
            { l: "Resting HR", v: "58 bpm", icon: "❤️" },
            { l: "HRV", v: "42 ms", icon: "📊" },
          ].map(({ l, v, icon }) => (
            <div
              key={l}
              className="rounded-lg p-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ fontSize: 10 }}>{icon}</span>
              <p className="text-xs font-extrabold text-white mt-0.5">{v}</p>
              <p
                className="text-[6px]"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                {l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
