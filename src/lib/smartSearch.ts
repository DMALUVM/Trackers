/**
 * Shared smart search with synonym expansion.
 * Works with any item that has a `label` and optional `section`.
 */

export const SYNONYMS: Record<string, string[]> = {
  exercise: ["workout", "run", "walk", "yoga", "stretch", "mobility", "steps", "stairs", "movement", "gym", "fitness"],
  gym: ["workout", "run", "yoga", "stretch", "fitness", "exercise"],
  fitness: ["workout", "run", "walk", "yoga", "stretch", "steps", "exercise", "gym"],
  meditate: ["meditation", "breathwork", "mindfulness", "pray", "gratitude", "mindful"],
  meditation: ["breathwork", "meditate", "mindfulness", "pray"],
  mindfulness: ["meditate", "meditation", "breathwork", "gratitude", "journal", "emotional"],
  sleep: ["bed", "night", "screens", "wind", "shutdown", "evening"],
  bedtime: ["sleep", "bed", "night", "screens", "shutdown"],
  water: ["drink", "hydration", "glasses", "hydrate"],
  hydration: ["water", "drink", "glasses"],
  food: ["meal", "breakfast", "lunch", "protein", "vegetables", "greens", "nutrition", "eat", "sugar"],
  eat: ["meal", "breakfast", "lunch", "protein", "vegetables", "nutrition", "food"],
  nutrition: ["protein", "vegetables", "meal", "breakfast", "lunch", "food", "eat", "sugar", "greens"],
  diet: ["protein", "vegetables", "meal", "food", "sugar", "nutrition", "eat", "greens"],
  health: ["vitamins", "supplements", "omega", "magnesium", "probiotics", "creatine", "collagen"],
  supplement: ["vitamins", "supplements", "omega", "magnesium", "probiotics", "creatine", "collagen"],
  vitamin: ["vitamins", "supplements", "omega", "magnesium", "probiotics"],
  morning: ["sunlight", "bed", "water", "stretch", "skincare", "shower", "breakfast"],
  night: ["sleep", "screens", "shutdown", "stretch", "gratitude", "tidy", "evening", "wind"],
  evening: ["sleep", "screens", "shutdown", "night", "wind", "bed"],
  focus: ["deep work", "priorities", "single-task", "time-block", "goals"],
  productivity: ["deep work", "priorities", "time-block", "goals", "calendar", "batch", "inbox", "focus"],
  work: ["deep work", "priorities", "time-block", "goals", "calendar", "focus"],
  read: ["reading", "book", "learn"],
  reading: ["read", "book", "learn"],
  book: ["read", "reading", "learn"],
  phone: ["screens", "social media", "phone", "limit"],
  screen: ["screens", "phone", "social media", "limit"],
  social: ["social media", "friends", "family", "kindness", "connect", "call", "partner"],
  family: ["kids", "partner", "connect", "quality time"],
  friend: ["call", "text", "connect", "social"],
  creative: ["instrument", "write", "art", "draw", "project", "creative"],
  art: ["draw", "creative", "instrument", "write"],
  music: ["instrument", "practice"],
  learn: ["language", "read", "book", "something new"],
  study: ["language", "learn", "read", "book"],
  journal: ["reflect", "write", "gratitude", "journal"],
  writing: ["journal", "write", "blog", "reflect"],
  cold: ["cold shower", "cold plunge", "ice"],
  ice: ["cold plunge", "cold shower"],
  recovery: ["sauna", "cold plunge", "foam roll", "massage", "epsom", "compression", "red light", "rest"],
  relax: ["sauna", "bath", "stretch", "foam roll", "massage", "yoga", "rest"],
  self: ["skincare", "bath", "foam roll", "dry brushing", "floss"],
  clean: ["tidy", "bed", "space"],
  teeth: ["floss"],
  dental: ["floss"],
  walk: ["walking", "steps", "outside", "get outside"],
  walking: ["walk", "steps", "outside"],
  run: ["running", "jog"],
  running: ["run", "jog"],
  pray: ["prayer", "scripture", "devotional", "spiritual", "meditate"],
  prayer: ["pray", "scripture", "devotional", "spiritual"],
  spiritual: ["pray", "scripture", "devotional", "meditation"],
  religion: ["pray", "scripture", "devotional", "spiritual"],
  faith: ["pray", "scripture", "devotional", "spiritual"],
  skin: ["skincare", "dry brushing"],
  stretch: ["stretching", "mobility", "yoga", "foam roll"],
  stretching: ["stretch", "mobility", "yoga"],
};

export interface Searchable {
  label: string;
  section?: string;
}

export function smartSearch<T extends Searchable>(items: T[], q: string): T[] {
  const term = q.toLowerCase().trim();
  if (!term) return [];

  // Step 1: direct label or section substring match
  const direct = items.filter(function(item) {
    const label = (item.label || "").toLowerCase();
    const section = (item.section || "").toLowerCase();
    return label.indexOf(term) !== -1 || section.indexOf(term) !== -1;
  });

  // Step 2: synonym expansion
  const expanded: T[] = [];
  const synKeys = Object.keys(SYNONYMS);
  for (let i = 0; i < synKeys.length; i++) {
    const key = synKeys[i];
    if (key === term || (term.length >= 3 && key.indexOf(term) === 0) || (term.length >= 3 && term.indexOf(key) === 0)) {
      const synonyms = SYNONYMS[key];
      for (let j = 0; j < items.length; j++) {
        const label = (items[j].label || "").toLowerCase();
        for (let k = 0; k < synonyms.length; k++) {
          if (label.indexOf(synonyms[k]) !== -1) {
            expanded.push(items[j]);
            break;
          }
        }
      }
    }
  }

  // Step 3: prefix match on individual words
  const prefix: T[] = [];
  if (term.length >= 2) {
    for (let i = 0; i < items.length; i++) {
      const words = (items[i].label || "").toLowerCase().split(" ");
      for (let w = 0; w < words.length; w++) {
        if (words[w].indexOf(term) === 0) {
          prefix.push(items[i]);
          break;
        }
      }
    }
  }

  // Deduplicate: direct first, then expanded, then prefix
  const seen = new Set<string>();
  const result: T[] = [];
  const all = direct.concat(expanded).concat(prefix);
  for (let i = 0; i < all.length; i++) {
    if (!seen.has(all[i].label)) {
      seen.add(all[i].label);
      result.push(all[i]);
    }
  }
  return result;
}
