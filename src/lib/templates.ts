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
    id: "starter-focus-fitness",
    title: "Starter: Focus + Fitness",
    desc: "Simple daily foundations with a fitness bias.",
    routines: [
      { label: "Hydrate", emoji: "💧", section: "morning", isNonNegotiable: true },
      { label: "Workout", emoji: "🏋️", section: "morning", isNonNegotiable: true },
      { label: "Breathwork", emoji: "🌬️", section: "anytime", isNonNegotiable: true },
      { label: "Walk", emoji: "🚶", section: "anytime" },
      { label: "Rowing", emoji: "🚣", section: "anytime" },
      { label: "Reading", emoji: "📚", section: "night" },
      { label: "Sleep by target time", emoji: "😴", section: "night", isNonNegotiable: true },
    ],
    weeklyGoals: [{ key: "rowing", targetPerWeek: 5, minPerWeek: 3 }],
    modules: ["progress", "rowing", "settings"],
  },
  {
    id: "starter-morning-night",
    title: "Starter: Morning + Night",
    desc: "A clean, minimal routine structure.",
    routines: [
      { label: "Morning sunlight", emoji: "🌅", section: "morning", isNonNegotiable: true },
      { label: "Water", emoji: "💧", section: "morning", isNonNegotiable: true },
      { label: "Movement", emoji: "🌀", section: "morning" },
      { label: "Journaling", emoji: "📝", section: "anytime" },
      { label: "Reading", emoji: "📚", section: "night" },
      { label: "Magnesium", emoji: "💤", section: "night" },
    ],
    modules: ["progress", "settings"],
  },
];
