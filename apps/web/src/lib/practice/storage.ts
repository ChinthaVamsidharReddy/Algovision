import { localDay, recordToday } from "../activity-log";

/** Drafts and solved marks live only in this browser. Every access is guarded: storage can be blocked or full. */
const codeKey = (id: string, lang: string) => `algovision.code.${id}.${lang}`;
const solvedKey = (id: string) => `algovision.solved.${id}`;

export function readDraft(id: string, lang: "javascript" | "python" | "solved"): string | null {
  try {
    return lang === "solved" ? localStorage.getItem(solvedKey(id)) : localStorage.getItem(codeKey(id, lang));
  } catch {
    return null;
  }
}
export function writeDraft(id: string, lang: string, code: string): void {
  try {
    localStorage.setItem(codeKey(id, lang), code);
  } catch {
    /* storage unavailable: the draft just is not kept */
  }
}
/** Stores the local day it was first solved ("1" in marks saved by older versions: solved, day unknown). */
export function markSolved(id: string, day: string = localDay(new Date())): void {
  try {
    if (localStorage.getItem(solvedKey(id))) return;
    localStorage.setItem(solvedKey(id), day);
    recordToday();
  } catch {
    /* ignore */
  }
}
export function solvedIds(ids: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const id of ids) if (readDraft(id, "solved")) out.add(id);
  return out;
}

/** Every solved mark with the day it was made (null when unknown). */
export function solvedMarks(ids: readonly string[]): { id: string; date: string | null }[] {
  const out: { id: string; date: string | null }[] = [];
  for (const id of ids) {
    const v = readDraft(id, "solved");
    if (v) out.push({ id, date: /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null });
  }
  return out;
}
