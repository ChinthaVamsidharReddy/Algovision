import type { ExecutionStep } from "@algovision/trace-schema";
import { chainIds, pointerOf, type LinkedListTrace } from "./types";

type Step = ExecutionStep<"linkedList">;

/** The value stored in a node, or undefined when the node is not in the state. */
export function valueOf(step: Step, id: string | null | undefined): number | undefined {
  if (!id) return undefined;
  return step.state.nodes.find((n) => n.id === id)?.value;
}
/** The node a pointer leads to next (undefined when there is none). */
export function nextOf(step: Step, id: string | null | undefined): string | null | undefined {
  if (!id) return undefined;
  const n = step.state.nodes.find((x) => x.id === id);
  return n ? n.next : undefined;
}
/** Where a named pointer stands on the stage: a node id, "end" when it points at nothing, undefined when it is not in use. */
export function spot(step: Step, name: string): string | undefined {
  const p = pointerOf(step, name);
  return p === undefined ? undefined : p === null ? "end" : p;
}
/** Nodes that were in the list at the start but are not in it at the end. */
export function removedIds(trace: LinkedListTrace): string[] {
  const first = trace.steps[0]!;
  const last = trace.steps[trace.steps.length - 1]!;
  const kept = new Set(chainIds(last.state));
  return chainIds(first.state).filter((id) => !kept.has(id));
}
export const isLast = (step: Step, trace: LinkedListTrace) => step.index === trace.steps.length - 1;
/** Keep colours only for nodes that exist at this step (a removed node is gone from the final state). */
export function present<T>(step: Step, tones: Record<string, T>): Record<string, T> {
  const ids = new Set(step.state.nodes.map((n) => n.id));
  return Object.fromEntries(Object.entries(tones).filter(([id]) => ids.has(id)));
}
