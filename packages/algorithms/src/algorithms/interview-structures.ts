import { type ExecutionTrace, type HighlightRole } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { LimitProfile } from "../limits";
import { cell, fmt } from "./array-common";
import { parseArrayWithFields } from "./array-input";
import { ArrayTrace } from "./array-trace";
import { describeEdges, edgesOf, GraphTrace, parseGraph, ref, type GraphInput } from "./graph-common";
import { TreeTrace } from "./tree-common";

/** Milestone 13 part 2: Fenwick tree (array), segment tree (tree), Kruskal MST and Kosaraju SCC (graph), all on existing state kinds. */
type Mark = { id: string; role: HighlightRole; label?: string };
const mark = (id: string, role: HighlightRole, label?: string): Mark => ({ id, role, ...(label ? { label } : {}) });

// ---------------------------------------------------------------- Fenwick tree
interface RangeIn { readonly values: readonly number[]; readonly index: number }
export const FENWICK_ID = "fenwick-tree-prefix-sum";
export const parseFenwick = (raw: unknown, limits: LimitProfile) =>
  parseArrayWithFields(raw, limits, { noun: "array", minLength: 1, fields: [{ name: "index", label: "Index", min: () => 0, max: (v) => v.length - 1, rangeMessage: (v) => `Index must be between 0 and ${Math.max(v.length - 1, 0)}.` }] }) as ReturnType<AlgorithmDefinition<RangeIn>["parseInput"]>;
export function runFenwick({ values, index }: RangeIn, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  // The array drawn is the tree: position j of the Fenwick tree (1-based) is cell j - 1.
  const T = new ArrayTrace(FENWICK_ID, { values: [...values], index }, new Array<number>(n).fill(0), limits);
  const tree = T.values;
  T.step({ type: "init" }, "entry", `Find the sum of ${fmt(values)} up to and including index ${index}. A Fenwick tree stores partial sums: position j holds the sum of the last (j & -j) values ending at j, so both updating and summing take about log n steps.`, { n, index });
  T.step({ type: "init" }, "init-tree", `Make the tree: ${n} positions (numbered 1 to ${n}), all 0 for now. Cell k of the picture is tree position k + 1.`, { n });
  for (let i = 1; i <= n; i++) {
    let j = i;
    T.step({ type: "init" }, "build", `Add value ${values[i - 1]} (position ${i}) to every tree position that covers it. Start at position ${j}.`, { i, j }, { j: j - 1 }, [cell(j - 1, "active", "start")]);
    while (j <= n) {
      tree[j - 1]! += values[i - 1]!;
      T.step({ type: "assign", target: { kind: "index", index: j - 1 }, value: tree[j - 1]! }, "build-add", `Position ${j} covers position ${i}, so add ${values[i - 1]} to it. It now holds ${tree[j - 1]}.`, { i, j }, { j: j - 1 }, [cell(j - 1, "swapped", "+" + values[i - 1])], [j - 1]);
      const low = j & -j;
      const next = j + low;
      T.step({ type: "init" }, "build-climb", next <= n ? `The lowest set bit of ${j} is ${low}, so jump to position ${j} + ${low} = ${next}, the next position that covers ${i}.` : `The lowest set bit of ${j} is ${low}, so the next jump is ${next}, past the end. Done with value ${i}.`, { i, j, next }, { j: j - 1 }, [cell(j - 1, "compared")]);
      j = next;
    }
  }
  let total = 0;
  let adds = 0;
  let j = index + 1;
  T.step({ type: "init" }, "query", `The tree is built: ${fmt(tree)}. Now sum up to index ${index}, which is position ${j}. Start with total 0.`, { total, j }, { j: j - 1 }, [cell(j - 1, "active", "start")]);
  while (j > 0) {
    total += tree[j - 1]!;
    adds++;
    T.step({ type: "init" }, "query-add", `Position ${j} holds the sum of the last ${j & -j} value${(j & -j) === 1 ? "" : "s"} ending here. Add ${tree[j - 1]}. Total: ${total}.`, { j, total }, { j: j - 1 }, [cell(j - 1, "found", "add")]);
    const low = j & -j;
    j -= low;
    T.step({ type: "init" }, "query-climb", j > 0 ? `Remove the lowest set bit: ${j + low} - ${low} = ${j}. Position ${j} covers the values before that block.` : `Remove the lowest set bit: nothing is left, so every value up to index ${index} has been counted.`, { j, total }, { j: j > 0 ? j - 1 : null }, j > 0 ? [cell(j - 1, "compared")] : []);
  }
  T.step({ type: "done" }, "finish", `The sum of the first ${index + 1} value${index === 0 ? "" : "s"} is ${total}, found with ${adds} addition${adds === 1 ? "" : "s"} instead of ${index + 1}.`, { total, result: total }, {}, []);
  return T.finish(total, "O(n log n)", "O(n)");
}
export const fenwickTreePrefixSum: AlgorithmDefinition<RangeIn> = { id: FENWICK_ID, parseInput: parseFenwick, run: runFenwick };

// ---------------------------------------------------------------- segment tree range sum
interface SegIn { readonly values: readonly number[]; readonly left: number; readonly right: number }
export const SEGMENT_ID = "segment-tree-range-sum";
export const parseSegment = (raw: unknown, limits: LimitProfile): ReturnType<AlgorithmDefinition<SegIn>["parseInput"]> => {
  const p = parseArrayWithFields(raw, limits, {
    noun: "array", minLength: 1,
    fields: [
      { name: "left", label: "Left", min: () => 0, max: (v) => v.length - 1, rangeMessage: (v) => `Left must be between 0 and ${Math.max(v.length - 1, 0)}.` },
      { name: "right", label: "Right", min: () => 0, max: (v) => v.length - 1, rangeMessage: (v) => `Right must be between 0 and ${Math.max(v.length - 1, 0)}.` },
    ],
  }) as ReturnType<AlgorithmDefinition<SegIn>["parseInput"]>;
  if (p.ok && p.value.left > p.value.right) return { ok: false, errors: [{ field: "left", message: "Left must not be bigger than right." }] };
  return p;
};
export function runSegment({ values, left, right }: SegIn, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const T = new TreeTrace(SEGMENT_ID, { values: [...values], left, right }, [], limits);
  const range = new Map<string, [number, number]>();
  const span = (lo: number, hi: number) => (lo === hi ? `[${lo}]` : `[${lo}..${hi}]`);
  T.step({ type: "init" }, "entry", `Sum the values at indexes ${left} to ${right} of ${fmt(values)} with a segment tree: every node stores the sum of a range, and a query combines a few whole nodes instead of adding each value.`, { n, left, right });
  T.step({ type: "init" }, "init-tree", `Build the tree. The root covers all ${n} value${n === 1 ? "" : "s"}; each node splits its range in half, down to single values (the leaves).`, { n });
  function build(lo: number, hi: number, parent: string | null, side: "left" | "right"): string {
    const node = T.create(0);
    T.attach(parent, side, node);
    range.set(node.id, [lo, hi]);
    T.call(node.id, "build", `Build the node for ${span(lo, hi)}. Its sum is not known yet.`, { lo, hi });
    T.step({ type: "init" }, "build", `Node for ${span(lo, hi)} created. Its sum shows 0 until its two halves are built.`, { lo, hi }, [mark(node.id, "created", "?")], [node.id]);
    if (lo === hi) {
      node.value = values[lo]!;
      T.step({ type: "init" }, "build-leaf", `A single value: the leaf for index ${lo} stores ${node.value}.`, { lo, hi, sum: node.value }, [mark(node.id, "found", "leaf")], [node.id]);
    } else {
      const mid = (lo + hi) >> 1;
      T.step({ type: "init" }, "build-children", `Split ${span(lo, hi)} at ${mid}: build ${span(lo, mid)} and ${span(mid + 1, hi)}.`, { lo, hi, mid }, [mark(node.id, "active", "split")]);
      const l = build(lo, mid, node.id, "left");
      const r = build(mid + 1, hi, node.id, "right");
      node.value = T.node(l).value + T.node(r).value;
      T.step({ type: "init" }, "build-sum", `Both halves are built: ${T.node(l).value} + ${T.node(r).value} = ${node.value}, the sum of ${span(lo, hi)}.`, { lo, hi, sum: node.value }, [mark(node.id, "found", "sum"), mark(l, "compared"), mark(r, "compared")], [node.id]);
    }
    T.callStack.pop();
    T.current = T.top();
    T.visited.push(node.id);
    T.step({ type: "return", node: node.id }, "build", `Done with ${span(lo, hi)}.`, { lo, hi }, [mark(node.id, "visited")]);
    return node.id;
  }
  build(0, n - 1, null, "left");
  T.visited.length = 0;
  T.current = null;
  let total = 0;
  T.step({ type: "init" }, "query", `The tree is built. Now sum ${span(left, right)}: visit nodes from the root, taking a node whole when its range lies inside ${span(left, right)}.`, { left, right, total }, [mark(T.root!, "active", "root")]);
  function query(id: string): number {
    const [lo, hi] = range.get(id)!;
    T.call(id, "query", `Ask node ${span(lo, hi)} for the part of ${span(left, right)} it covers.`, { lo, hi, left, right });
    let got: number;
    if (right < lo || hi < left) {
      T.step({ type: "init" }, "query-outside", `${span(lo, hi)} is completely outside ${span(left, right)}. It contributes 0.`, { lo, hi }, [mark(id, "compared", "outside")]);
      got = 0;
    } else if (left <= lo && hi <= right) {
      got = T.node(id).value;
      total += got;
      T.output.push(got);
      T.step({ type: "init" }, "query-inside", `${span(lo, hi)} is completely inside ${span(left, right)}, so take its stored sum ${got} without looking deeper. Total so far: ${total}.`, { lo, hi, got, total }, [mark(id, "found", "take")], [id]);
    } else {
      const node = T.node(id);
      T.step({ type: "init" }, "query-split", `${span(lo, hi)} only partly overlaps ${span(left, right)}, so ask both halves and add their answers.`, { lo, hi }, [mark(id, "active", "split")]);
      got = query(node.left!) + query(node.right!);
    }
    T.callStack.pop();
    T.current = T.top();
    T.step({ type: "return", node: id }, "query", `${span(lo, hi)} returns ${got}.`, { lo, hi, got, total }, [mark(id, "visited")]);
    return got;
  }
  const result = query(T.root!);
  T.current = null;
  T.step({ type: "done" }, "finish", `The sum of indexes ${left} to ${right} is ${result}.`, { result, total }, [mark(T.root!, "found", "root")]);
  return T.finish(result, "O(n) build, O(log n) per query", "O(n)");
}
export const segmentTreeRangeSum: AlgorithmDefinition<SegIn> = { id: SEGMENT_ID, parseInput: parseSegment, run: runSegment };

// ---------------------------------------------------------------- Kruskal minimum spanning tree
export const KRUSKAL_ID = "kruskal-mst";
export const parseKruskal = (raw: unknown, limits: LimitProfile) => parseGraph(raw, limits, { stride: 3, start: false, directed: false });
export function runKruskal(input: GraphInput, limits: LimitProfile): ExecutionTrace {
  const { values, vertices } = input;
  const edges = edgesOf(values, 3);
  const G = new GraphTrace({ id: KRUSKAL_ID, input: { values: [...values], vertices }, vertices, edges, directed: false, weighted: true, frontierName: "", markName: "Group", limits });
  const parent = Array.from({ length: vertices }, (_, i) => i);
  const root = (x: number): number => { let r = x; while (parent[r] !== r) r = parent[r]!; return r; };
  G.marks = [...parent];
  G.step({ type: "init" }, "entry", `Find the cheapest set of edges that connects the graph without a cycle. Edges: ${describeEdges(edges, false, true)}. Kruskal takes edges from cheapest to most expensive and keeps one only if it joins two different groups.`, { vertices, edges: edges.length });
  const order = edges.map((_, i) => i);
  for (let i = 1; i < order.length; i++) {
    let j = i;
    while (j > 0 && edges[order[j - 1]!]!.weight > edges[order[j]!]!.weight) { [order[j - 1], order[j]] = [order[j]!, order[j - 1]!]; j--; }
  }
  G.step({ type: "init" }, "sort-edges", `Sort the edges by weight: ${order.map((k) => `${edges[k]!.from}–${edges[k]!.to} (${edges[k]!.weight})`).join(", ") || "none"}. Equal weights keep their input order.`, { edges: edges.length });
  G.step({ type: "init" }, "init-parents", `Every vertex starts in its own group, shown by its group number. The total weight is 0.`, { total: 0 });
  let total = 0;
  for (const k of order) {
    const e = edges[k]!;
    G.activeEdge = { from: e.from, to: e.to };
    G.step({ type: "init" }, "edge-loop", `Next cheapest edge: ${e.from}–${e.to} with weight ${e.weight}.`, { u: e.from, v: e.to, weight: e.weight, total });
    const a = root(e.from);
    const b = root(e.to);
    G.step({ type: "init" }, "find", `Group of ${e.from} is ${a}; group of ${e.to} is ${b}.`, { a, b, total }, [{ v: e.from, role: "compared" }, { v: e.to, role: "compared" }]);
    if (a === b) {
      G.step({ type: "compare", a: ref(a), b: ref(b) }, "check-roots", `Both ends are already in group ${a}. Adding ${e.from}–${e.to} would make a cycle, so skip it.`, { a, b, total }, [{ v: e.from, role: "swapped" }, { v: e.to, role: "swapped" }]);
      continue;
    }
    G.step({ type: "compare", a: ref(a), b: ref(b) }, "check-roots", `The groups differ (${a} and ${b}), so this edge joins two separate pieces. Keep it.`, { a, b, total }, [{ v: e.from, role: "found" }, { v: e.to, role: "found" }]);
    for (let v = 0; v < vertices; v++) if (parent[v] === b) parent[v] = a;
    parent[b] = a;
    G.marks = vertices > 0 ? Array.from({ length: vertices }, (_, v) => root(v)) : [];
    total += e.weight;
    G.output.push(e.weight);
    G.step({ type: "init" }, "take-edge", `Take ${e.from}–${e.to}: the two groups merge into group ${a}. Total weight: ${total}.`, { a, b, weight: e.weight, total }, [{ v: e.from, role: "created" }, { v: e.to, role: "created" }], [e.from, e.to]);
  }
  G.activeEdge = null;
  G.current = null;
  const pieces = new Set(Array.from({ length: vertices }, (_, v) => root(v))).size;
  G.step({ type: "done" }, "finish", `Done. The cheapest set of edges weighs ${total}, using ${G.output.length} edge${G.output.length === 1 ? "" : "s"}.${pieces > 1 ? ` The graph has ${pieces} separate pieces, so this is the cheapest forest, one tree per piece.` : ""} The list shows the weights taken.`, { total, result: total });
  return G.finish(total, "O(E log E)", "O(V + E)");
}
export const kruskalMst: AlgorithmDefinition<GraphInput> = { id: KRUSKAL_ID, parseInput: parseKruskal, run: runKruskal };

// ---------------------------------------------------------------- Kosaraju strongly connected components
export const SCC_ID = "strongly-connected-components";
export const parseScc = (raw: unknown, limits: LimitProfile) => parseGraph(raw, limits, { stride: 2, start: false, directed: true });
export function runScc(input: GraphInput, limits: LimitProfile): ExecutionTrace {
  const { values, vertices } = input;
  const edges = edgesOf(values, 2);
  const G = new GraphTrace({ id: SCC_ID, input: { values: [...values], vertices }, vertices, edges, directed: true, weighted: false, frontierName: "Call stack", markName: "Component", limits });
  const adj = Array.from({ length: vertices }, () => new Array<boolean>(vertices).fill(false));
  for (const e of edges) adj[e.from]![e.to] = true;
  G.step({ type: "init" }, "entry", `Count the strongly connected components: groups of vertices that can all reach each other. Edges: ${describeEdges(edges, true, false)}. Kosaraju's method runs a depth-first search twice: once to record finish order, then again on the reversed edges.`, { vertices, edges: edges.length });
  G.step({ type: "init" }, "build-graph", `Store the edges in a ${vertices} x ${vertices} table.`, { vertices });
  const seen = new Array<boolean>(vertices).fill(false);
  const order: number[] = [];
  G.step({ type: "init" }, "init-visited", `Nothing is visited yet. First pass: a depth-first search from every unvisited vertex. A vertex is written to the list after everything reachable from it has finished.`, {});
  const first = (u: number): void => {
    seen[u] = true;
    G.visited.push(u);
    G.frontier.push(u);
    G.current = u;
    G.step({ type: "visit", element: ref(u) }, "first-pass", `Visit ${u} and mark it.`, { u, finished: order.length });
    for (let v = 0; v < vertices; v++) {
      if (!adj[u]![v]) continue;
      G.activeEdge = { from: u, to: v };
      G.step({ type: "compare", a: ref(u), b: ref(v) }, "first-pass", seen[v] ? `Edge ${u}→${v}: ${v} was already visited, so do not go there again.` : `Edge ${u}→${v}: ${v} is new. Go deeper.`, { u, v }, [{ v, role: seen[v] ? "compared" : "found" }]);
      G.activeEdge = null;
      if (!seen[v]) first(v);
    }
    G.frontier.pop();
    G.current = G.frontier.length ? G.frontier[G.frontier.length - 1]! : null;
    order.push(u);
    G.output = [...order];
    G.step({ type: "init" }, "finish-time", `Everything reachable from ${u} is done, so record ${u}. Finish order so far: ${order.join(", ")}.`, { u, finished: order.length }, [{ v: u, role: "created" }], [u]);
  };
  for (let u = 0; u < vertices; u++) {
    if (seen[u]) continue;
    G.step({ type: "init" }, "first-loop", `${u} is not visited yet: start a search here.`, { u });
    first(u);
  }
  G.visited = [];
  G.frontier = [];
  G.current = null;
  G.output = [];
  const comp = new Array<number>(vertices).fill(-1);
  G.marks = comp.map((c) => (c < 0 ? null : c));
  let count = 0;
  G.step({ type: "init" }, "second-init", `First pass finished. Finish order: ${order.join(", ")}. Second pass: take vertices from the last finished to the first and search along the reversed edges. Each search collects exactly one component.`, { count });
  const second = (u: number): void => {
    comp[u] = count;
    G.marks = comp.map((c) => (c < 0 ? null : c));
    G.visited.push(u);
    G.frontier.push(u);
    G.current = u;
    G.output.push(u);
    G.step({ type: "visit", element: ref(u) }, "second-pass", `Put ${u} in component ${count}.`, { u, count }, [{ v: u, role: "found" }], [u]);
    for (let v = 0; v < vertices; v++) {
      if (!adj[v]![u]) continue;
      G.activeEdge = { from: v, to: u };
      G.step({ type: "compare", a: ref(v), b: ref(u) }, "second-pass", comp[v]! >= 0 ? `Edge ${v}→${u} points into ${u}; going backwards reaches ${v}, which already has a component.` : `Edge ${v}→${u} points into ${u}; going backwards reaches ${v}, which has no component yet, so it joins component ${count}.`, { u, v, count }, [{ v, role: comp[v]! >= 0 ? "compared" : "found" }]);
      G.activeEdge = null;
      if (comp[v]! < 0) second(v);
    }
    G.frontier.pop();
    G.current = G.frontier.length ? G.frontier[G.frontier.length - 1]! : null;
  };
  for (const u of [...order].reverse()) {
    G.step({ type: "init" }, "second-loop", comp[u]! >= 0 ? `${u} already belongs to component ${comp[u]}. Skip.` : `${u} has no component yet: it starts a new one.`, { u, count });
    if (comp[u]! >= 0) continue;
    second(u);
    count++;
    G.step({ type: "init" }, "new-component", `Component ${count - 1} is complete. The count is now ${count}.`, { count }, [], []);
  }
  G.current = null;
  G.step({ type: "done" }, "finish", `Done. The graph has ${count} strongly connected component${count === 1 ? "" : "s"}. The list shows the vertices grouped by component.`, { count, result: count });
  return G.finish(count, "O(V²)", "O(V)");
}
export const stronglyConnectedComponents: AlgorithmDefinition<GraphInput> = { id: SCC_ID, parseInput: parseScc, run: runScc };
