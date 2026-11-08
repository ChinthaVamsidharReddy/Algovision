import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { describeEdges, edgesOf, GraphTrace, parseGraph, ref, type GraphInput } from "./graph-common";

export const ID = "union-find-components";
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<GraphInput> {
  return parseGraph(raw, limits, { stride: 2, start: false, directed: false });
}

/** Disjoint sets with path halving: parent[x] points toward the root of x's group. */
export function run(input: GraphInput, limits: LimitProfile): ExecutionTrace {
  const { values, vertices } = input;
  const edges = edgesOf(values, 2);
  const G = new GraphTrace({ id: ID, input: { values: [...values], vertices }, vertices, edges, directed: false, weighted: false, frontierName: "", markName: "Parent", limits });
  const parent = Array.from({ length: vertices }, (_, i) => i);
  G.output = [vertices];
  G.step({ type: "init" }, "entry", `Count connected groups by merging them. Each vertex points to a parent; following parents leads to the root that names its group. Edges: ${describeEdges(edges, false, false)}.`, { vertices, edges: edges.length });
  G.marks = [...parent];
  let count = vertices;
  G.step({ type: "init" }, "init-parents", `Start with ${vertices} separate groups: every vertex is its own parent. The group count is ${count}.`, { count }, [], []);
  const find = (x0: number, anchor: string, label: string): number => {
    let x = x0;
    G.current = x;
    G.step({ type: "init" }, anchor, `${label}: find the root of ${x0}.`, { x });
    while (parent[x] !== x) {
      G.current = x;
      G.step({ type: "compare", a: ref(x), b: ref(parent[x]!) }, "find-loop", `${x} is not a root: its parent is ${parent[x]}. Keep climbing.`, { x, parent: parent[x]! }, [{ v: parent[x]!, role: "compared" }]);
      parent[x] = parent[parent[x]!]!;
      G.marks[x] = parent[x]!;
      G.step({ type: "assign", target: ref(x), value: parent[x]! }, "compress", `Path halving: point ${x} directly at its grandparent, ${parent[x]}. Later searches will be shorter.`, { x, parent: parent[x]! }, [], [x]);
      x = parent[x]!;
      G.current = x;
      G.step({ type: "init" }, "climb", `Move up to ${x}.`, { x });
    }
    G.step({ type: "found", element: ref(x) }, "found-root", `${x} is its own parent, so it is the root of ${x0}'s group.`, { x, root: x }, [{ v: x, role: "found" }]);
    return x;
  };
  for (const e of edges) {
    G.activeEdge = { from: e.from, to: e.to };
    G.current = null;
    G.step({ type: "init" }, "edge-loop", `Next edge: ${e.from}–${e.to}. If the two ends are in different groups, this edge merges them.`, { u: e.from, v: e.to, count });
    const a = find(e.from, "find-a", `Left end ${e.from}`);
    const b = find(e.to, "find-b", `Right end ${e.to}`);
    if (a === b) {
      G.step({ type: "compare", a: ref(a), b: ref(b) }, "check-roots", `Both ends have root ${a}, so they are already in the same group. This edge adds nothing.`, { a, b, count }, [{ v: a, role: "found" }]);
      continue;
    }
    G.step({ type: "compare", a: ref(a), b: ref(b) }, "check-roots", `The roots differ (${a} and ${b}), so the ends are in different groups.`, { a, b, count }, [{ v: a, role: "compared" }, { v: b, role: "compared" }]);
    parent[b] = a;
    G.marks[b] = a;
    count--;
    G.output = [count];
    G.step({ type: "assign", target: ref(b), value: a }, "union", `Merge: make ${a} the parent of ${b}. Two groups became one, so the count drops to ${count}.`, { a, b, count }, [{ v: a, role: "created" }], [b]);
  }
  G.activeEdge = null;
  G.current = null;
  G.step({ type: "done" }, "finish", `All edges are processed: the graph has ${count} connected component${count === 1 ? "" : "s"}.`, { count, result: count });
  return G.finish(count, "O(E·α(V))", "O(V)");
}
export const unionFindComponents: AlgorithmDefinition<GraphInput> = { id: ID, parseInput, run };
