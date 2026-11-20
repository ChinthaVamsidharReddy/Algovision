import type { ExecutionStep } from "@algovision/trace-schema";
import type { ChainActor, Tone } from "./types";

type Step = ExecutionStep<"tree">;

/** In the heap traces the node for array position i is always named t(i+1). */
export const heapId = (i: number): string => `t${i + 1}`;
export const heapValue = (step: Step, i: number | null | undefined): number | undefined => (i === null || i === undefined ? undefined : step.state.nodes.find((n) => n.id === heapId(i))?.value);
/** The heap read as a list, top to bottom and left to right. */
export const heapList = (step: Step): number[] => [...step.state.nodes].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1))).map((n) => n.value);
export const listText = (xs: readonly number[]): string => (xs.length ? xs.join(", ") : "empty");

const ROLE_TONE: Record<string, Tone> = { active: "hit", compared: "warn", created: "warn", swapped: "good", found: "good" };
/** A colour per node from the highlights the algorithm already gives. */
export function heapTones(step: Step): Record<string, Tone> {
  const tones: Record<string, Tone> = {};
  for (const h of step.highlights) {
    if (h.target.kind !== "node") continue;
    const t = ROLE_TONE[h.role];
    if (t) tones[h.target.id] = t;
  }
  return tones;
}
export const hasRole = (step: Step, role: string): boolean => step.highlights.some((h) => h.role === role);
/** Characters may only stand on nodes that exist at this step. */
export function standOn(step: Step, actors: readonly ChainActor[]): ChainActor[] {
  const ids = new Set(step.state.nodes.map((n) => n.id));
  return actors.filter((a) => ids.has(a.node));
}
export const lastVariable = (steps: readonly Step[], upTo: number, name: string): number | undefined => {
  for (let i = upTo; i >= 0; i--) {
    const v = steps[i]!.variables.find((x) => x.name === name)?.value;
    if (typeof v === "number") return v;
  }
  return undefined;
};

const TREE_ROLE_TONE: Record<string, Tone> = { active: "hit", compared: "warn", created: "warn", swapped: "good", found: "good", visited: "dim", pointer: "dim", queued: "warn" };
/** A colour per node from the highlights of any tree trace (also the roles visited, pointer and queued). */
export function treeTones(step: Step): Record<string, Tone> {
  const tones: Record<string, Tone> = {};
  for (const h of step.highlights) {
    if (h.target.kind !== "node") continue;
    const t = h.label === "queued" ? "warn" : TREE_ROLE_TONE[h.role];
    if (t) tones[h.target.id] = t;
  }
  return tones;
}
