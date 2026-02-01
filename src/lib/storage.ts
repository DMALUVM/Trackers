export const storageKeys = {
  dayMode: (dateKey: string) => `dr:daymode:${dateKey}`,
  checklist: (dateKey: string) => `dr:checklist:${dateKey}`,
  sex: (dateKey: string) => `dr:sex:${dateKey}`,
  rowing: (dateKey: string) => `dr:rowing:${dateKey}`,
} as const;

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
