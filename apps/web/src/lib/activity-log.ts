/**
 * The days on which the learner did something (opened an algorithm, finished one, solved a practice problem),
 * kept in this browser so a streak can be counted. Signed-in progress from the server adds its own days later.
 * Every access is guarded: storage can be blocked or full, and then the streak simply has fewer days.
 */
const KEY = "algovision.days";
const KEEP = 400;

/** A local calendar day as YYYY-MM-DD (the learner's own midnight decides when a day ends). */
export function localDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function readDays(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
  } catch {
    return [];
  }
}

export function recordToday(now: Date = new Date()): void {
  try {
    const today = localDay(now);
    const days = readDays();
    if (days.includes(today)) return;
    const next = [...days, today].sort().slice(-KEEP);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore: the day just is not remembered */
  }
}
