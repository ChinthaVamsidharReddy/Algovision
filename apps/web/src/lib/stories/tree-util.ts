import type { ExecutionStep } from "@algovision/trace-schema";
import type { TreeTrace } from "./types";

type Step = ExecutionStep<"tree">;

export const valueAt = (step: Step, id: string | null | undefined): number | undefined => (id ? step.state.nodes.find((n) => n.id === id)?.value : undefined);

/** Ids of the nodes whose turn has come (a "visit" event happened at them), up to and including this step, in order. */
export function visitedIds(trace: TreeTrace, step: Step): string[] {
  const out: string[] = [];
  for (const s of trace.steps) {
    if (s.index > step.index) break;
    if (s.event.type === "visit" && s.state.current && !out.includes(s.state.current)) out.push(s.state.current);
  }
  return out;
}

/** The room the walker is in. A call on an empty subtree has no node, so the walker is shown in the room it looked from. */
export function standingAt(step: Step): { node: string | null; emptyAhead: boolean } {
  if (step.state.current) return { node: step.state.current, emptyAhead: false };
  const real = [...step.state.callStack].reverse().find((id) => id !== null) ?? null;
  const emptyAhead = step.state.callStack.length > 0 && step.state.callStack[step.state.callStack.length - 1] === null;
  return { node: real ?? step.state.root, emptyAhead };
}
