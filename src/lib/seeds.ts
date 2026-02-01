export type SeedRoutineItem = {
  label: string;
  emoji?: string;
  section?: "morning" | "anytime" | "night";
  isNonNegotiable?: boolean;
  daysOfWeek?: number[]; // ISO 1=Mon..7=Sun
};

export const daveSeedRoutineItems: SeedRoutineItem[] = [
  // Morning
  { label: "Nattokinase", emoji: "🧬", section: "morning", isNonNegotiable: true },
  {
    label: "Lymphatic flow",
    emoji: "🌀",
    section: "morning",
    isNonNegotiable: true,
  },
  {
    label: "Workout (weights)",
    emoji: "🏋️",
    section: "morning",
    isNonNegotiable: true,
  },
  {
    label: "Collagen + creatine",
    emoji: "🥤",
    section: "morning",
    isNonNegotiable: true,
  },

  // Anytime
  { label: "Breathwork", emoji: "🌬️", section: "anytime", isNonNegotiable: true },
  { label: "Neurofeedback", emoji: "🧠", section: "anytime" },
  { label: "TRT/HCG", emoji: "💉", section: "anytime", daysOfWeek: [1, 3, 5] },
  { label: "CrossFit", emoji: "🏟️", section: "anytime" },
  { label: "Rowing (20 min)", emoji: "🚣", section: "anytime" },
  { label: "Sauna", emoji: "🔥", section: "anytime" },
  { label: "Cold plunge", emoji: "🧊", section: "anytime" },

  // Night
  { label: "Magnesium", emoji: "💤", section: "night" },
  { label: "Reading", emoji: "📚", section: "night" },
  { label: "Sex", emoji: "❤️", section: "night" },
];

export const daveSeedWeeklyGoals = [{ key: "rowing", targetPerWeek: 5 }] as const;
