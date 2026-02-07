type CsvValue = string | number | boolean | null | undefined;

function escapeCsv(v: CsvValue) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/\"/g, '""')}"`;
  return s;
}

export function toCsv(rows: Array<Record<string, CsvValue>>) {
  if (!rows || rows.length === 0) return "";
  const cols = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  const header = cols.join(",");
  const lines = rows.map((r) => cols.map((c) => escapeCsv(r[c])).join(","));
  return [header, ...lines].join("\n");
}
