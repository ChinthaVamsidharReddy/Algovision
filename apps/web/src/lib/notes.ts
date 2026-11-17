/** Personal notes per algorithm, kept in this browser. Every access is guarded: storage can be blocked or full. */
export const MAX_NOTE = 4000;
const key = (id: string) => `algovision.notes.${id}`;

export function readNote(id: string): string {
  try {
    return localStorage.getItem(key(id)) ?? "";
  } catch {
    return "";
  }
}

/** Returns false when the note could not be kept (storage blocked or full). An empty note deletes the entry. */
export function writeNote(id: string, text: string): boolean {
  try {
    const t = text.slice(0, MAX_NOTE);
    if (t.trim() === "") localStorage.removeItem(key(id));
    else localStorage.setItem(key(id), t);
    return true;
  } catch {
    return false;
  }
}

/** Ids (from the given list) that have a saved note. */
export function notedIds(ids: readonly string[]): string[] {
  return ids.filter((id) => readNote(id).trim() !== "");
}
