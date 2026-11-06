import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExecutionTrace } from "@algovision/trace-schema";

export const contentRoot = join(dirname(fileURLToPath(import.meta.url)), "../content");

export interface Vector {
  name: string;
  input: { values: number[]; value?: number; target?: number };
  expected: number | number[];
}

export const algorithmDirs = (): string[] => readdirSync(contentRoot).sort();
export const readVectors = (id: string): Vector[] =>
  JSON.parse(readFileSync(join(contentRoot, id, "vectors.json"), "utf8")) as Vector[];

/** Walks head -> next of the final snapshot. */
export function finalList(trace: ExecutionTrace): number[] {
  const state = trace.steps[trace.steps.length - 1]!.state;
  if (state.kind !== "linkedList") throw new Error("expected a linked list state");
  const byId = new Map(state.nodes.map((n) => [n.id, n]));
  const out: number[] = [];
  let id = state.head;
  while (id !== null) {
    const node = byId.get(id)!;
    out.push(node.value);
    id = node.next;
  }
  return out;
}

export function listStates(trace: ExecutionTrace) {
  return trace.steps.map((s) => {
    if (s.state.kind !== "linkedList") throw new Error("expected a linked list state");
    return s.state;
  });
}

export function arrayStates(trace: ExecutionTrace) {
  return trace.steps.map((s) => {
    if (s.state.kind !== "array") throw new Error("expected an array state");
    return s.state;
  });
}
