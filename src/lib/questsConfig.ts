export type BuiltinQuestId = "q-rowing" | "q-walk" | "q-run" | "q-recovery" | "q-green"
  | "q-breathwork" | "q-movement" | "q-focus" | "q-journal";

export type CustomQuest = {
  id: string;
  emoji: string;
  title: string;
  keywords: string[];
};

export type QuestConfig = {
  enabled: boolean;
  maxShown: 0 | 1 | 2 | 3;
  selected: BuiltinQuestId[];
  custom: CustomQuest[];
};

const KEY = "routines365:quests:v1";

export function loadQuestConfig(): QuestConfig {
  try {
    if (typeof window === "undefined") {
      return { enabled: true, maxShown: 3, selected: ["q-walk", "q-green", "q-run"], custom: [] };
    }
    const raw = window.localStorage.getItem(KEY);
    if (!raw) throw new Error("no");
    const parsed = JSON.parse(raw);
    const maxShown = [0, 1, 2, 3].includes(parsed.maxShown) ? parsed.maxShown : 3;
    const selected = Array.isArray(parsed.selected) ? parsed.selected : ["q-walk", "q-green", "q-run"];
    const custom = Array.isArray(parsed.custom) ? parsed.custom : [];
    return { enabled: !!parsed.enabled, maxShown, selected, custom } as QuestConfig;
  } catch {
    return { enabled: true, maxShown: 3, selected: ["q-walk", "q-green", "q-run"], custom: [] };
  }
}

export function saveQuestConfig(cfg: QuestConfig) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(cfg));
    window.dispatchEvent(new Event("routines365:questsChanged"));
  } catch {
    // ignore
  }
}
