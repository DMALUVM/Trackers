export type TemplatePack = {
  id: string;
  title: string;
  desc: string;
  routines: Array<{
    label: string;
    emoji?: string;
    section?: "morning" | "anytime" | "night";
    isNonNegotiable?: boolean;
    daysOfWeek?: number[];
  }>;
  weeklyGoals?: Array<{ key: string; targetPerWeek: number; minPerWeek?: number }>;
  modules?: Array<"progress" | "rowing" | "settings" | "neuro">;
};

export const templatePacks: TemplatePack[] = [
  {
    id: "morning-reset-10",
    title: "Morning Reset (10 min)",
    desc: "A simple morning routine you can actually stick with.",
    routines: [
      { label: "Drink water", emoji: "💧", section: "morning", isNonNegotiable: true },
      { label: "Morning sunlight", emoji: "🌅", section: "morning", isNonNegotiable: true },
      { label: "Move (5 min)", emoji: "🌀", section: "morning", isNonNegotiable: true },
      { label: "Plan top 1 thing", emoji: "✅", section: "morning", isNonNegotiable: true },
      { label: "Protein", emoji: "🍳", section: "morning" },
      { label: "No phone for 10 min", emoji: "📵", section: "morning" },
    ],
    modules: ["progress", "settings"],
  },
  {
    id: "fitness-consistency",
    title: "Fitness Consistency",
    desc: "Daily movement + a few basics to keep you on track.",
    routines: [
      { label: "Drink water", emoji: "💧", section: "morning", isNonNegotiable: true },
      { label: "Walk", emoji: "🚶", section: "anytime", isNonNegotiable: true },
      { label: "Workout", emoji: "🏋️", section: "anytime", isNonNegotiable: true },
      { label: "Protein", emoji: "🍳", section: "anytime" },
      { label: "Stretch", emoji: "🧘", section: "night" },
      { label: "Sleep by target time", emoji: "😴", section: "night", isNonNegotiable: true },
    ],
    weeklyGoals: [{ key: "workout", targetPerWeek: 4, minPerWeek: 3 }],
    modules: ["progress", "settings"],
  },
  {
    id: "productivity-focus",
    title: "Productivity Focus",
    desc: "Less busywork, more focus. Simple daily structure.",
    routines: [
      { label: "Plan top 3 priorities", emoji: "🧠", section: "morning", isNonNegotiable: true },
      { label: "Deep work (30 min)", emoji: "🎯", section: "anytime", isNonNegotiable: true },
      { label: "Inbox once", emoji: "📥", section: "anytime", isNonNegotiable: true },
      { label: "Walk", emoji: "🚶", section: "anytime" },
      { label: "Shutdown ritual", emoji: "🌙", section: "night", isNonNegotiable: true },
    ],
    modules: ["progress", "settings"],
  },
];
