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
export function markSolved(id: string): void {
  try {
    localStorage.setItem(solvedKey(id), "1");
  } catch {
    /* ignore */
  }
}
export function solvedIds(ids: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const id of ids) if (readDraft(id, "solved") === "1") out.add(id);
  return out;
}
