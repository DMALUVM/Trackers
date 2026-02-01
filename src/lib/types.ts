export type DayMode = "normal" | "travel" | "sick";

export type RoutineItemRow = {
  id: string;
  user_id: string;
  label: string;
  emoji: string | null;
  section: string;
  is_active: boolean;
  is_non_negotiable: boolean;
  days_of_week: number[] | null;
  sort_order?: number | null;
};

export type DailyLogRow = {
  id: string;
  user_id: string;
  date: string; // yyyy-mm-dd
  day_mode: DayMode;
  sex: boolean | null;
  did_rowing: boolean | null;
  did_weights: boolean | null;
};
