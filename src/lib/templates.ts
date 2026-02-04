export type TemplateRoutine = {
  id: string;
  label: string;
  emoji?: string;
  section?: "morning" | "anytime" | "night";
  defaultCore?: boolean;
  daysOfWeek?: number[];
};

export type TemplateAddon = TemplateRoutine & {
  // if true, enabled by default for the template
  defaultOn?: boolean;
};

export type TemplatePack = {
  id: string;
  title: string;
  desc: string;
  routines: TemplateRoutine[];
  addons?: TemplateAddon[];
  weeklyGoals?: Array<{ key: string; targetPerWeek: number; minPerWeek?: number }>;
  modules?: Array<"progress" | "rowing" | "settings" | "neuro">;
};

export const templatePacks: TemplatePack[] = [
  {
    id: "movement-first",
    title: "Movement-first (Dave style)",
    desc: "Movement + breathwork + exercise + nourishment. Minimal fluff.",
    routines: [
      {
        id: "morning-movement",
        label: "Morning movement (lymphatic flow)",
        emoji: "🌀",
        section: "morning",
        defaultCore: true,
      },
      {
        id: "breathwork",
        label: "Breathwork / meditation",
        emoji: "🌬️",
        section: "morning",
        defaultCore: true,
      },
      {
        id: "exercise",
        label: "Exercise (lift or cardio)",
        emoji: "🏋️",
        section: "anytime",
        defaultCore: true,
      },
      {
        id: "nourishment",
        label: "Nourishment (eat well)",
        emoji: "🥗",
        section: "anytime",
        defaultCore: true,
      },
      { id: "sunlight", label: "Morning sunlight", emoji: "🌅", section: "morning" },
      { id: "hydration", label: "Drink water", emoji: "💧", section: "morning" },
      { id: "sleep", label: "Sleep by target time", emoji: "😴", section: "night" },
    ],
    addons: [
      { id: "protocol", label: "Medication / protocol", emoji: "💊", section: "anytime" },
      { id: "creatine", label: "Creatine", emoji: "🧃", section: "anytime" },
      { id: "collagen", label: "Collagen", emoji: "🦴", section: "anytime" },
      { id: "journal", label: "Journal", emoji: "📓", section: "morning" },
      { id: "cold", label: "Cold exposure", emoji: "🧊", section: "morning" },
      { id: "read", label: "Read (10 min)", emoji: "📚", section: "night" },
    ],
    modules: ["progress", "settings"],
  },
  {
    id: "morning-reset-10",
    title: "Morning Reset (10 min)",
    desc: "A simple morning routine you can actually stick with.",
    routines: [
      { id: "water", label: "Drink water", emoji: "💧", section: "morning", defaultCore: true },
      {
        id: "sunlight",
        label: "Morning sunlight",
        emoji: "🌅",
        section: "morning",
        defaultCore: true,
      },
      { id: "move", label: "Move (5 min)", emoji: "🌀", section: "morning", defaultCore: true },
      {
        id: "plan1",
        label: "Plan top 1 thing",
        emoji: "✅",
        section: "morning",
        defaultCore: true,
      },
      { id: "protein", label: "Protein", emoji: "🍳", section: "morning" },
      { id: "no-phone", label: "No phone for 10 min", emoji: "📵", section: "morning" },
    ],
    addons: [
      { id: "breathwork", label: "Breathwork / meditation", emoji: "🌬️", section: "morning" },
      { id: "journal", label: "Journal", emoji: "📓", section: "morning" },
    ],
    modules: ["progress", "settings"],
  },
  {
    id: "fitness-consistency",
    title: "Fitness Consistency",
    desc: "Daily movement + a few basics to keep you on track.",
    routines: [
      { id: "water", label: "Drink water", emoji: "💧", section: "morning", defaultCore: true },
      { id: "walk", label: "Walk", emoji: "🚶", section: "anytime", defaultCore: true },
      { id: "workout", label: "Workout", emoji: "🏋️", section: "anytime", defaultCore: true },
      { id: "protein", label: "Protein", emoji: "🍳", section: "anytime" },
      { id: "stretch", label: "Stretch", emoji: "🧘", section: "night" },
      {
        id: "sleep",
        label: "Sleep by target time",
        emoji: "😴",
        section: "night",
        defaultCore: true,
      },
    ],
    weeklyGoals: [{ key: "workout", targetPerWeek: 4, minPerWeek: 3 }],
    addons: [
      { id: "supplements", label: "Supplements", emoji: "💊", section: "anytime" },
      { id: "mobility", label: "Mobility (10 min)", emoji: "🧘‍♂️", section: "anytime" },
    ],
    modules: ["progress", "settings"],
  },
  {
    id: "productivity-focus",
    title: "Productivity Focus",
    desc: "Less busywork, more focus. Simple daily structure.",
    routines: [
      {
        id: "plan3",
        label: "Plan top 3 priorities",
        emoji: "🧠",
        section: "morning",
        defaultCore: true,
      },
      {
        id: "deepwork",
        label: "Deep work (30 min)",
        emoji: "🎯",
        section: "anytime",
        defaultCore: true,
      },
      { id: "inbox", label: "Inbox once", emoji: "📥", section: "anytime", defaultCore: true },
      { id: "walk", label: "Walk", emoji: "🚶", section: "anytime" },
      {
        id: "shutdown",
        label: "Shutdown ritual",
        emoji: "🌙",
        section: "night",
        defaultCore: true,
      },
    ],
    addons: [
      { id: "breathwork", label: "Breathwork / meditation", emoji: "🌬️", section: "morning" },
      { id: "read", label: "Read (10 min)", emoji: "📚", section: "night" },
    ],
    modules: ["progress", "settings"],
  },
];
