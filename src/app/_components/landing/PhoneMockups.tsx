/* ────────────────────────────────────────────
   Phone mockup components for the landing page.
   These are pure render components — no hooks, no state.
   ──────────────────────────────────────────── */

/* SVG nav icons matching the actual app */
const NavIcons = {
  Today: (active: boolean, isDark = true) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#10b981" : isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Progress: (active: boolean, isDark = true) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#10b981" : isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Neuro: (active: boolean, isDark = true) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#10b981" : isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a7 7 0 017 7c0 3-2 5-4 6.5M12 2a7 7 0 00-7 7c0 3 2 5 4 6.5M12 22v-6" />
    </svg>
  ),
  Breathwork: (active: boolean, isDark = true) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#10b981" : isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c-4-3-8-6-8-10a8 8 0 0116 0c0 4-4 7-8 10z" />
    </svg>
  ),
  Movement: (active: boolean, isDark = true) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#10b981" : isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <path d="M6 20l4-8 2 3 2-3 4 8" />
    </svg>
  ),
};

type NavItem = { key: keyof typeof NavIcons; l: string };

function PhoneFrame({
  children,
  label,
  navItems,
  theme = "dark",
}: {
  children: React.ReactNode;
  label: string;
  navItems?: NavItem[];
  theme?: "dark" | "light";
}) {
  const nav: NavItem[] = navItems ?? [
    { key: "Today", l: "Today" },
    { key: "Progress", l: "Progress" },
    { key: "Neuro", l: "Neuro" },
  ];
  const isDark = theme === "dark";
  const bg = isDark ? "#0c0c0c" : "#f5f5f0";
  const frameBg = isDark
    ? "linear-gradient(145deg, #222 0%, #111 100%)"
    : "linear-gradient(145deg, #e8e8e4 0%, #d0d0cc 100%)";
  const frameBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
  const navBg = isDark ? "rgba(0,0,0,0.6)" : "rgba(245,245,240,0.95)";
  const navBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const inactiveColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)";
  const notchBg = isDark ? "#000" : "#e0e0dc";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-[36px] p-2"
        style={{
          background: frameBg,
          border: `1.5px solid ${frameBorder}`,
          boxShadow: `0 4px 40px rgba(0,0,0,${isDark ? 0.6 : 0.15}), 0 0 0 1px ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"} inset`,
        }}
      >
        <div
          className="rounded-[28px] overflow-hidden relative"
          style={{ background: bg, width: 240 }}
        >
          {/* Notch */}
          <div className="flex justify-center pt-1.5 pb-0.5" style={{ background: bg }}>
            <div className="w-20 h-5 rounded-full" style={{ background: notchBg }} />
          </div>
          <div className="px-3 pb-3">{children}</div>
          {/* Bottom nav */}
          <div
            className="flex justify-around items-center py-2 border-t"
            style={{ borderColor: navBorder, background: navBg }}
          >
            {nav.map(({ key, l }) => (
              <div key={l} className="flex flex-col items-center gap-0.5">
                {NavIcons[key](l === label, isDark)}
                <span
                  className="text-[7px] font-semibold"
                  style={{ color: l === label ? "#10b981" : inactiveColor }}
                >
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs font-semibold text-neutral-400">{label}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Mockup 1 — Today Page
   ═══════════════════════════════════════════ */
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
            <p className="text-[8px] font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              Good morning 👋
            </p>
            <p className="text-[11px] font-bold text-white">
              Tuesday{" "}
              <span className="text-[8px] font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>
                Feb 11
              </span>
            </p>
          </div>
          <div className="flex gap-1">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span style={{ fontSize: 8 }}>🏆</span>
            </div>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-white" style={{ fontSize: 7 }}>•••</span>
            </div>
          </div>
        </div>

        {/* Score card */}
        <div
          className="rounded-xl p-2.5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
              <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                <circle
                  cx="22" cy="22" r="18" fill="none" stroke="#10b981" strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset="0"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: "#10b981" }}>
                ✓
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-semibold" style={{ color: "#10b981" }}>Green Day! 🎉</p>
              <p className="text-[7px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                {coreDone}/{coreHabits.length} core · +1 bonus
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span style={{ fontSize: 9 }}>🔥</span>
                <span className="text-[9px] font-bold text-white">7</span>
                <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  day streak · best 7
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-2 px-0.5">
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-[6px] font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>{d.d}</span>
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[7px] font-bold"
                  style={{
                    background: d.c === "green" ? "#10b981" : d.c === "today" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                    border: d.c === "today" ? "1.5px solid #10b981" : "none",
                    color: d.c === "green" ? "#000" : "rgba(255,255,255,0.5)",
                    transform: d.c === "today" ? "scale(1.1)" : "none",
                  }}
                >
                  {d.n}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily quote */}
        <div
          className="rounded-lg px-2.5 py-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p className="text-[7px] italic" style={{ color: "rgba(255,255,255,0.4)" }}>
            &ldquo;The impediment to action advances action.&rdquo;
          </p>
          <p className="text-[6px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>— Marcus Aurelius</p>
        </div>

        {/* Core habits */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
              Core
            </span>
            <span className="text-[7px] font-semibold" style={{ color: "#10b981" }}>
              {coreDone}/{coreHabits.length}
            </span>
          </div>
          <div className="space-y-[3px]">
            {coreHabits.map((h) => (
              <div
                key={h.label}
                className="flex items-center gap-1.5 rounded-lg px-2 py-[5px]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0" style={{ background: "#10b981" }}>
                  <span className="text-[7px] text-black font-bold">✓</span>
                </div>
                <span className="text-[7px]">{h.emoji}</span>
                <span className="text-[8px] line-through" style={{ color: "rgba(255,255,255,0.3)" }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bonus habits */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>Bonus</span>
            <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.2)" }}>1/{bonusHabits.length}</span>
          </div>
          <div className="space-y-[3px]">
            {bonusHabits.map((h) => (
              <div
                key={h.label}
                className="flex items-center gap-1.5 rounded-lg px-2 py-[4px]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div
                  className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                  style={{
                    background: h.done ? "#10b981" : "transparent",
                    border: h.done ? "none" : "1.5px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {h.done && <span className="text-[6px] text-black font-bold">✓</span>}
                </div>
                <span className="text-[7px]">{h.emoji}</span>
                <span
                  className={`text-[8px] ${h.done ? "line-through" : ""}`}
                  style={{ color: h.done ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.55)" }}
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

/* ═══════════════════════════════════════════
   Mockup 2 — Breathwork Session
   ═══════════════════════════════════════════ */
export function MockBreathwork() {
  const techniques = [
    { emoji: "🟦", name: "Box Breathing", desc: "Calm focus", free: true },
    { emoji: "🌙", name: "4-7-8 Relaxation", desc: "Deep sleep", free: false },
    { emoji: "❄️", name: "Wim Hof Power", desc: "Energy boost", free: false },
    { emoji: "😮‍💨", name: "Physiological Sigh", desc: "Instant calm", free: false },
    { emoji: "⚡", name: "Energizing Breath", desc: "Wake up", free: false },
  ];

  return (
    <PhoneFrame label="Breathwork" navItems={[
      { key: "Today", l: "Today" },
      { key: "Breathwork", l: "Breathwork" },
      { key: "Progress", l: "Progress" },
    ]}>
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-bold text-white">Breathwork</p>
          <p className="text-[7px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Choose a technique and breathe
          </p>
        </div>

        {/* Active session visualization */}
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
        >
          {/* Breathing circle */}
          <div className="mx-auto relative" style={{ width: 100, height: 100 }}>
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
                transform: "scale(0.85)",
              }}
            />
            <div
              className="absolute rounded-full flex items-center justify-center"
              style={{
                top: 10, left: 10, width: 80, height: 80,
                background: "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.3), rgba(59,130,246,0.08))",
                border: "2px solid rgba(59,130,246,0.4)",
                boxShadow: "0 0 40px rgba(59,130,246,0.15), inset 0 0 20px rgba(59,130,246,0.05)",
              }}
            >
              <div className="text-center">
                <p className="text-[10px] font-black" style={{ color: "#3b82f6" }}>Breathe In</p>
                <p className="text-lg font-bold text-white mt-0.5">4</p>
              </div>
            </div>
          </div>
          <p className="text-[8px] font-semibold text-white mt-2">🟦 Box Breathing</p>
          <p className="text-[7px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Round 3 of 6 · 🔊 Om drone
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-[8px] text-white">⏸</span>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-[8px] text-white">↺</span>
            </div>
          </div>
        </div>

        {/* Technique list */}
        <div>
          <p className="text-[7px] font-bold tracking-wider uppercase mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            Techniques
          </p>
          <div className="space-y-[3px]">
            {techniques.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-2 rounded-lg px-2 py-[6px]"
                style={{
                  background: t.name === "Box Breathing" ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.04)",
                  border: t.name === "Box Breathing" ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <span className="text-sm">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] font-bold text-white">{t.name}</p>
                  <p className="text-[6px]" style={{ color: "rgba(255,255,255,0.35)" }}>{t.desc}</p>
                </div>
                {!t.free && (
                  <span className="text-[6px] px-1 py-0.5 rounded" style={{ background: "rgba(234,179,8,0.2)", color: "#eab308" }}>
                    PRO
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ═══════════════════════════════════════════
   Mockup 3 — Movement Routine
   ═══════════════════════════════════════════ */
export function MockMovement() {
  const steps = [
    { emoji: "🔄", name: "Neck Circles", time: "0:30", done: true },
    { emoji: "💪", name: "Shoulder Rolls", time: "0:20", done: true },
    { emoji: "🐱", name: "Cat-Cow", time: "0:40", active: true },
    { emoji: "🌍", name: "World's Greatest Stretch", time: "0:40", done: false },
    { emoji: "⭕", name: "Hip Circles", time: "0:30", done: false },
    { emoji: "🙇", name: "Forward Fold", time: "0:30", done: false },
  ];

  const routines = [
    { emoji: "🌅", name: "Morning Mobility", dur: "5 min", free: true },
    { emoji: "☯️", name: "Qigong Foundations", dur: "6 min", free: true },
    { emoji: "🪑", name: "Desk Reset", dur: "4 min", free: false },
    { emoji: "🌙", name: "Evening Wind-Down", dur: "5 min", free: false },
  ];

  return (
    <PhoneFrame label="Movement" navItems={[
      { key: "Today", l: "Today" },
      { key: "Movement", l: "Movement" },
      { key: "Progress", l: "Progress" },
    ]}>
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-bold text-white">🌅 Morning Mobility</p>
          <p className="text-[7px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            5 min · Wake up your joints
          </p>
        </div>

        {/* Active step */}
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <span className="text-2xl">🐱</span>
          <p className="text-[10px] font-bold text-white mt-1">Cat-Cow</p>
          <p className="text-[7px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
            Arch and round your spine with each breath
          </p>
          <p className="text-xl font-bold text-white mt-2 tabular-nums">0:28</p>
          <div className="w-full h-1 rounded-full mt-2" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-1 rounded-full" style={{ width: "30%", background: "#10b981" }} />
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-[8px] text-white">⏸</span>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-[8px] text-white">⏭</span>
            </div>
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-[3px]">
          {steps.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-1.5 rounded-lg px-2 py-[5px]"
              style={{
                background: s.active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                border: s.active ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {s.done ? (
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#10b981" }}>
                  <span className="text-[6px] text-black font-bold">✓</span>
                </div>
              ) : s.active ? (
                <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ border: "2px solid #10b981", background: "rgba(16,185,129,0.2)" }} />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ border: "1.5px solid rgba(255,255,255,0.1)" }} />
              )}
              <span className="text-[7px]">{s.emoji}</span>
              <span className={`text-[8px] flex-1 ${s.done ? "line-through" : ""}`}
                style={{ color: s.done ? "rgba(255,255,255,0.3)" : s.active ? "#10b981" : "rgba(255,255,255,0.5)" }}>
                {s.name}
              </span>
              <span className="text-[7px] tabular-nums" style={{ color: "rgba(255,255,255,0.25)" }}>{s.time}</span>
            </div>
          ))}
        </div>

        {/* Other routines */}
        <div>
          <p className="text-[7px] font-bold tracking-wider uppercase mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
            All routines
          </p>
          <div className="grid grid-cols-2 gap-1">
            {routines.map((r) => (
              <div key={r.name} className="rounded-lg px-2 py-1.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 10 }}>{r.emoji}</span>
                <p className="text-[7px] font-semibold text-white mt-0.5">{r.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[6px]" style={{ color: "rgba(255,255,255,0.3)" }}>{r.dur}</span>
                  {!r.free && <span className="text-[5px] px-0.5 rounded" style={{ background: "rgba(234,179,8,0.2)", color: "#eab308" }}>PRO</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ═══════════════════════════════════════════
   Mockup 4 — Progress Calendar
   ═══════════════════════════════════════════ */
export function MockProgress() {
  const days = [
    ...Array.from({ length: 6 }, (_, i) => ({ n: 26 + i, c: "faded" })),
    { n: 1, c: "green" }, { n: 2, c: "green" }, { n: 3, c: "green" },
    { n: 4, c: "yellow" }, { n: 5, c: "green" }, { n: 6, c: "green" },
    { n: 7, c: "green" }, { n: 8, c: "green" }, { n: 9, c: "green" },
    { n: 10, c: "green" }, { n: 11, c: "today" },
    ...Array.from({ length: 17 }, (_, i) => ({ n: 12 + i, c: "future" })),
  ];

  return (
    <PhoneFrame label="Progress">
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-bold text-white">Progress</p>
          <p className="text-[7px]" style={{ color: "rgba(255,255,255,0.35)" }}>Tap any day to review</p>
        </div>

        <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.3)" }}>‹</span>
            <span className="text-[9px] font-bold text-white">February 2026</span>
            <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.3)" }}>›</span>
          </div>
          <div className="grid grid-cols-7 gap-[3px] text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-[6px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{d}</span>
            ))}
            {days.map((d, i) => {
              const bg = d.c === "green" ? "#10b981" : d.c === "yellow" ? "#eab308" : d.c === "today" ? "rgba(16,185,129,0.15)" : "transparent";
              const border = d.c === "today" ? "1.5px solid #10b981" : "none";
              const textColor = d.c === "green" ? "#000" : d.c === "yellow" ? "#000" : d.c === "faded" ? "rgba(255,255,255,0.1)" : d.c === "future" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)";
              return (
                <div key={i} className="flex items-center justify-center rounded-full text-[7px] font-bold"
                  style={{ width: 22, height: 22, background: bg, border, color: textColor, margin: "0 auto" }}>
                  {d.n}
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-2 justify-center">
            {[{ c: "#10b981", l: "All core" }, { c: "#eab308", l: "Missed 1" }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                <span className="text-[6px]" style={{ color: "rgba(255,255,255,0.35)" }}>{l}</span>
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
            <div key={label} className="rounded-lg p-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[6px] font-bold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
              <p className="text-sm font-extrabold text-white mt-0.5">{value}</p>
              <p className="text-[6px]" style={{ color: "rgba(255,255,255,0.25)" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Quest card */}
        <div className="rounded-lg p-2" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.15)" }}>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 10 }}>⚔️</span>
            <div className="flex-1">
              <p className="text-[7px] font-bold" style={{ color: "#eab308" }}>Weekly Quest</p>
              <p className="text-[6px]" style={{ color: "rgba(255,255,255,0.4)" }}>5 green days this week · 4/5</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(234,179,8,0.15)", border: "1.5px solid rgba(234,179,8,0.3)" }}>
              <span className="text-[8px] font-bold" style={{ color: "#eab308" }}>80%</span>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ═══════════════════════════════════════════
   Mockup 5 — Sleep & Biometrics
   ═══════════════════════════════════════════ */
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
    <PhoneFrame label="Insights">
      <div className="space-y-2">
        <div className="rounded-lg px-2 py-1.5 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-[8px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
            📈 Biometric Insights
          </span>
        </div>

        <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex justify-between mb-2">
            <span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
              🌙 Sleep — 7 Nights
            </span>
            <span className="text-[7px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>avg 7h 5m</span>
          </div>
          <div className="space-y-[5px]">
            {nights.map((n) => (
              <div key={n.d} className="flex items-center gap-2">
                <span className="text-[7px] w-5 text-right shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>{n.d}</span>
                <div className="flex-1 flex h-3 rounded-sm overflow-hidden">
                  <div style={{ width: `${n.deep}%`, background: "#4338ca" }} />
                  <div style={{ width: `${n.core}%`, background: "#6366f1" }} />
                  <div style={{ width: `${n.rem}%`, background: "#a78bfa" }} />
                </div>
                <span className="text-[7px] w-8 text-right shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>{n.total}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-2 justify-center">
            {[{ c: "#4338ca", l: "Deep" }, { c: "#6366f1", l: "Core" }, { c: "#a78bfa", l: "REM" }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                <span className="text-[6px]" style={{ color: "rgba(255,255,255,0.35)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-[7px] font-bold tracking-wider uppercase" style={{ color: "#eab308" }}>✨ Habit × Body</p>
          <p className="text-[8px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Your HRV averages 12ms higher on days you complete cold exposure and breathwork.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: "Resting HR", v: "58", u: "bpm", icon: "❤️" },
            { l: "HRV", v: "42", u: "ms", icon: "📊" },
            { l: "SpO₂", v: "98", u: "%", icon: "🫁" },
          ].map(({ l, v, u, icon }) => (
            <div key={l} className="rounded-lg p-1.5 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: 10 }}>{icon}</span>
              <p className="text-[10px] font-extrabold text-white">{v}<span className="text-[6px] text-neutral-500 ml-0.5">{u}</span></p>
              <p className="text-[5px]" style={{ color: "rgba(255,255,255,0.25)" }}>{l}</p>
            </div>
          ))}
        </div>

        {/* Knowledge base teaser */}
        <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 10 }}>🧠</span>
            <div>
              <p className="text-[7px] font-bold text-white">Knowledge Base</p>
              <p className="text-[6px]" style={{ color: "rgba(255,255,255,0.35)" }}>13 science-backed articles · Sleep, Exercise, Nutrition…</p>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ────────────────────────────────────────────
   Light theme mockups
   ──────────────────────────────────────────── */

export function MockTodayLight() {
  const coreHabits = [
    { label: "Morning walk", done: true },
    { label: "Read 20 pages", done: true },
    { label: "Meditate 10 min", done: true },
    { label: "Cold shower", done: false },
  ];
  const bonusHabits = [
    { label: "Journal entry", done: true },
    { label: "No sugar", done: false },
  ];
  const coreDone = coreHabits.filter((h) => h.done).length;
  const t = { text: "rgba(20,20,15,0.9)", muted: "rgba(20,20,15,0.45)", card: "rgba(0,0,0,0.04)", border: "rgba(0,0,0,0.06)" };

  return (
    <PhoneFrame label="Today · Light" theme="light">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-medium" style={{ color: t.muted }}>Good morning 👋</p>
            <p className="text-[11px] font-bold" style={{ color: t.text }}>
              Tuesday <span className="text-[8px] font-normal" style={{ color: t.muted }}>Feb 11</span>
            </p>
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <span style={{ fontSize: 8 }}>🏆</span>
          </div>
        </div>

        {/* Score card */}
        <div className="rounded-xl p-2.5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
              <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3.5" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - coreDone / coreHabits.length)}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: "#10b981" }}>
                {Math.round((coreDone / coreHabits.length) * 100)}%
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-semibold" style={{ color: "#059669" }}>Almost there! 💪</p>
              <p className="text-[7px]" style={{ color: t.muted }}>{coreDone}/{coreHabits.length} core · 1 bonus</p>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="rounded-lg px-2 py-1.5" style={{ background: t.card }}>
          <p className="text-[7px] italic" style={{ color: t.muted }}>&ldquo;The impediment to action advances action.&rdquo;</p>
          <p className="text-[6px] mt-0.5" style={{ color: "rgba(20,20,15,0.3)" }}>— Marcus Aurelius</p>
        </div>

        {/* Core habits */}
        <div>
          <p className="text-[7px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.muted }}>Core Habits</p>
          <div className="space-y-1">
            {coreHabits.map((h) => (
              <div key={h.label} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: h.done ? "rgba(16,185,129,0.08)" : t.card }}>
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: h.done ? "#10b981" : "transparent", border: h.done ? "none" : `1.5px solid ${t.border}` }}>
                  {h.done && <span className="text-white text-[8px]">✓</span>}
                </div>
                <span className="text-[8px] font-medium" style={{ color: h.done ? "#059669" : t.text, textDecoration: h.done ? "line-through" : "none", opacity: h.done ? 0.7 : 1 }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bonus */}
        <div>
          <p className="text-[7px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.muted }}>Bonus</p>
          <div className="space-y-1">
            {bonusHabits.map((h) => (
              <div key={h.label} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: h.done ? "rgba(16,185,129,0.08)" : t.card }}>
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: h.done ? "#10b981" : "transparent", border: h.done ? "none" : `1.5px solid ${t.border}` }}>
                  {h.done && <span className="text-white text-[8px]">✓</span>}
                </div>
                <span className="text-[8px] font-medium" style={{ color: h.done ? "#059669" : t.text, textDecoration: h.done ? "line-through" : "none", opacity: h.done ? 0.7 : 1 }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

export function MockStreaksLight() {
  const t = { text: "rgba(20,20,15,0.9)", muted: "rgba(20,20,15,0.45)", card: "rgba(0,0,0,0.04)", border: "rgba(0,0,0,0.06)" };
  const habits = [
    { label: "Morning walk", streak: 14, best: 21, color: "#10b981" },
    { label: "Read 20 pages", streak: 9, best: 12, color: "#3b82f6" },
    { label: "Meditate", streak: 7, best: 7, color: "#8b5cf6" },
    { label: "Cold shower", streak: 3, best: 5, color: "#06b6d4" },
  ];

  return (
    <PhoneFrame label="Streaks · Light" theme="light">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold" style={{ color: t.text }}>Your Streaks</p>
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 10 }}>🔥</span>
            <span className="text-[10px] font-bold" style={{ color: "#f97316" }}>14 days</span>
          </div>
        </div>

        {/* Green day calendar strip */}
        <div className="rounded-xl p-2" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <p className="text-[6px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.muted }}>Last 14 days</p>
          <div className="flex gap-[3px] justify-between">
            {Array.from({ length: 14 }, (_, i) => {
              const green = i < 11 || i === 12;
              return (
                <div key={i}>
                  <div className="rounded-[3px]" style={{
                    width: 12, height: 12,
                    background: green ? "#10b981" : i === 13 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.15)",
                    border: i === 13 ? "1.5px solid #10b981" : "none",
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Habit streaks */}
        <div className="space-y-1.5">
          {habits.map((h) => (
            <div key={h.label} className="rounded-xl p-2" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] font-semibold" style={{ color: t.text }}>{h.label}</span>
                <span className="text-[8px] font-bold" style={{ color: h.color }}>{h.streak}d 🔥</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "rgba(0,0,0,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${(h.streak / h.best) * 100}%`, background: h.color }} />
              </div>
              <p className="text-[6px] mt-1" style={{ color: t.muted }}>Best: {h.best} days</p>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

export function MockJournalLight() {
  const t = { text: "rgba(20,20,15,0.9)", muted: "rgba(20,20,15,0.45)", card: "rgba(0,0,0,0.04)", border: "rgba(0,0,0,0.06)" };
  const entries = [
    { date: "Today", preview: "Had an amazing morning walk in the cold air. Felt energized all day...", mood: "😊" },
    { date: "Yesterday", preview: "Skipped the cold shower but everything else was solid. Consistency over perfection...", mood: "😌" },
    { date: "Feb 9", preview: "Green day! All habits checked. Started reading Atomic Habits...", mood: "🔥" },
  ];

  return (
    <PhoneFrame label="Journal · Light" theme="light">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold" style={{ color: t.text }}>Journal</p>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="text-[10px]" style={{ color: "#10b981" }}>+</span>
          </div>
        </div>

        {/* Prompt card */}
        <div className="rounded-xl p-2.5" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}>
          <p className="text-[7px] font-semibold" style={{ color: "#7c3aed" }}>✨ Today&apos;s Prompt</p>
          <p className="text-[7px] mt-0.5" style={{ color: t.muted }}>What&apos;s one small thing you&apos;re grateful for this morning?</p>
        </div>

        {/* Entries */}
        <div className="space-y-1.5">
          {entries.map((e) => (
            <div key={e.date} className="rounded-xl p-2.5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[7px] font-bold" style={{ color: t.text }}>{e.date}</span>
                <span style={{ fontSize: 10 }}>{e.mood}</span>
              </div>
              <p className="text-[7px] leading-relaxed" style={{ color: t.muted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                {e.preview}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="rounded-xl p-2" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex justify-around text-center">
            <div>
              <p className="text-[10px] font-bold" style={{ color: "#10b981" }}>12</p>
              <p className="text-[6px]" style={{ color: t.muted }}>Entries</p>
            </div>
            <div>
              <p className="text-[10px] font-bold" style={{ color: "#8b5cf6" }}>5</p>
              <p className="text-[6px]" style={{ color: t.muted }}>Day streak</p>
            </div>
            <div>
              <p className="text-[10px] font-bold" style={{ color: "#f59e0b" }}>📊</p>
              <p className="text-[6px]" style={{ color: t.muted }}>Insights</p>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
