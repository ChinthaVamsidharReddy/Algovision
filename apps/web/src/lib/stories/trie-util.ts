import type { ExecutionStep } from "@algovision/trace-schema";
import type { ChainActor, Tone, TrieTrace } from "./types";

type Step = ExecutionStep<"trie">;

const ROLE_TONE: Record<string, Tone> = { active: "hit", visited: "dim", found: "good", compared: "warn", created: "warn" };
/** A colour per node from the highlights the algorithm already gives. */
export function trieTones(step: Step): Record<string, Tone> {
  const tones: Record<string, Tone> = {};
  for (const h of step.highlights) {
    if (h.target.kind !== "node") continue;
    const t = ROLE_TONE[h.role];
    if (t) tones[h.target.id] = t;
  }
  return tones;
}
export function numberVar(step: Step, name: string): number | null {
  const v = step.variables.find((x) => x.name === name)?.value;
  return typeof v === "number" ? v : null;
}
/** The letter being looked at in a walk: the j-th letter of the word being inserted or searched. */
export function letterAt(step: Step): string {
  const j = numberVar(step, "j");
  return j !== null && j >= 0 && j < step.state.word.length ? step.state.word[j]! : "";
}
export function anchor(step: Step): string {
  return step.source.kind === "anchor" ? step.source.id : "";
}
export function standOn(step: Step, actors: readonly ChainActor[]): ChainActor[] {
  const ids = new Set(step.state.nodes.map((n) => n.id));
  return actors.filter((a) => ids.has(a.node));
}
export function walker(step: Step): ChainActor[] {
  const cur = step.state.current;
  return cur ? standOn(step, [{ id: "w", emoji: "🚶", name: "Walker", node: cur }]) : [];
}
export const isLast = (step: Step, trace: TrieTrace): boolean => step.index === trace.steps.length - 1;

/** The letters on the way from the root down to a node. */
export function pathText(step: Step, id: string): string {
  const parent = new Map<string, string>();
  for (const n of step.state.nodes) for (const c of n.children) parent.set(c, n.id);
  const byId = new Map(step.state.nodes.map((n) => [n.id, n]));
  let out = "";
  let cur: string | undefined = id;
  while (cur !== undefined && parent.has(cur)) {
    out = (byId.get(cur)?.label ?? "") + out;
    cur = parent.get(cur);
  }
  return out;
}

/** The operation list of the dictionary trace: 1 insert, 2 search, 3 prefix, each followed by its length and letter codes. */
export interface DictOp {
  kind: "insert" | "search" | "prefix";
  word: string;
}
export function decodeOps(trace: TrieTrace): DictOp[] {
  const raw = trace.input.ops;
  const ops: number[] = Array.isArray(raw) ? raw.filter((x): x is number => typeof x === "number") : [];
  const out: DictOp[] = [];
  for (let i = 0; i < ops.length; ) {
    const kind = ops[i]!;
    const len = ops[i + 1] ?? 0;
    const word = String.fromCharCode(...ops.slice(i + 2, i + 2 + len));
    out.push({ kind: kind === 1 ? "insert" : kind === 2 ? "search" : "prefix", word });
    i += 2 + len;
  }
  return out;
}
export function inputText(trace: TrieTrace): string {
  return typeof trace.input.s === "string" ? trace.input.s : "";
}
