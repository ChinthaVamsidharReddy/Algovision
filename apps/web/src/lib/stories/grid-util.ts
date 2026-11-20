import type { ExecutionStep } from "@algovision/trace-schema";
import type { GridFrame, Tone } from "./types";

type Step = ExecutionStep<"grid">;

export interface Mark {
  role: string;
  label?: string;
}
/** What the algorithm itself highlights, by cell index. */
export function marks(step: Step): Map<number, Mark[]> {
  const out = new Map<number, Mark[]>();
  for (const h of step.highlights) {
    if (h.target.kind !== "index") continue;
    const list = out.get(h.target.index) ?? [];
    list.push({ role: h.role, label: h.label });
    out.set(h.target.index, list);
  }
  return out;
}
export const has = (m: Map<number, Mark[]>, index: number, role: string) => (m.get(index) ?? []).some((x) => x.role === role);
export const labelOf = (m: Map<number, Mark[]>, index: number, role?: string) => (m.get(index) ?? []).find((x) => (role === undefined || x.role === role) && x.label)?.label;
export const indexWith = (m: Map<number, Mark[]>, role: string, label?: string): number | undefined => {
  for (const [i, list] of m) if (list.some((x) => x.role === role && (label === undefined || x.label === label))) return i;
  return undefined;
};
export const indexesWith = (m: Map<number, Mark[]>, role: string): number[] => [...m].filter(([, l]) => l.some((x) => x.role === role)).map(([i]) => i);

/** "row 2, column 3", counted from 1 the way people count. */
export const where = (step: Step, index: number | undefined): string => {
  if (index === undefined) return "an unknown place";
  const cols = Math.max(1, step.state.cols);
  return `row ${Math.floor(index / cols) + 1}, column ${(index % cols) + 1}`;
};
export const num = (step: Step, name: string): number | undefined => {
  const v = step.variables.find((x) => x.name === name)?.value;
  return typeof v === "number" ? v : undefined;
};
export const plural = (n: number | undefined, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** The two words a table is built from, read from its row and column labels. */
export function words(step: Step): { s: string[]; t: string[] } {
  return { s: (step.state.rowLabels ?? []).slice(1), t: (step.state.colLabels ?? []).slice(1) };
}
export const quote = (letters: string[]): string => (letters.length ? `"${letters.join("")}"` : "an empty word");

/** The frame to show when the grid has no cells at all. */
export function emptyFrame(says: string, last: boolean, bannerText: string): GridFrame {
  return { tones: {}, actors: [], says, banner: last ? { kind: "info", text: bannerText } : undefined };
}
export const toneFor = (hit: boolean, done: boolean): Tone => (hit ? "hit" : done ? "good" : "plain");
