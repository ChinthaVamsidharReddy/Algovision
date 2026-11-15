import { describe, expect, it } from "vitest";
import { assertValidTrace, type ArrayState, type GraphState, type TreeState } from "@algovision/trace-schema";
import { LIMIT_PROFILES } from "../src";
import * as S from "../src/algorithms/interview-structures";
import { rng } from "./testkit";

const std = LIMIT_PROFILES.standard;
const lite = LIMIT_PROFILES.lite;
const must = <T,>(r: { ok: boolean } & Record<string, unknown>): T => {
  if (!r.ok) throw new Error(JSON.stringify(r));
  return r.value as T;
};
const ri = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const sum = (a: readonly number[]) => a.reduce((x, y) => x + y, 0);

/** Random graph: distinct unordered pairs, random direction, optional weights. */
const rgraph = (r: () => number, n: number, edges: number, weighted: boolean): number[] => {
  const pairs: [number, number][] = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) pairs.push([a, b]);
  for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j]!, pairs[i]!]; }
  return pairs.slice(0, Math.min(edges, pairs.length)).flatMap(([a, b]) => { const [x, y] = r() < 0.5 ? [a, b] : [b, a]; return weighted ? [x!, y!, ri(r, 1, 30)] : [x!, y!]; });
};

describe("fenwick-tree-prefix-sum", () => {
  it("returns the prefix sum, and the tree cells follow the lowest-set-bit rule once built", () => {
    const r = rng(21);
    for (let t = 0; t < 150; t++) {
      const values = Array.from({ length: ri(r, 1, 15) }, () => ri(r, -20, 20));
      const index = ri(r, 0, values.length - 1);
      const trace = S.runFenwick(must(S.fenwickTreePrefixSum.parseInput({ values, index }, std)), std);
      assertValidTrace(trace);
      expect(trace.summary.result, JSON.stringify({ values, index })).toBe(sum(values.slice(0, index + 1)));
      const queryStart = trace.steps.find((s) => s.source.kind === "anchor" && s.source.id === "query")!;
      const tree = (queryStart.state as ArrayState).values;
      tree.forEach((cellValue, k) => {
        const j = k + 1;
        expect(cellValue, `position ${j}`).toBe(sum(values.slice(j - (j & -j), j)));
      });
    }
  });
  it("rejects an index outside the array and an empty array", () => {
    expect(S.fenwickTreePrefixSum.parseInput({ values: [1, 2], index: 2 }, std).ok).toBe(false);
    expect(S.fenwickTreePrefixSum.parseInput({ values: [1, 2], index: -1 }, std).ok).toBe(false);
    expect(S.fenwickTreePrefixSum.parseInput({ values: [], index: 0 }, std).ok).toBe(false);
  });
  it("stays inside the step budget", () => {
    expect(S.runFenwick({ values: Array.from({ length: 15 }, (_, i) => i + 1), index: 14 }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(S.runFenwick({ values: Array.from({ length: 8 }, (_, i) => i + 1), index: 7 }, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});

describe("segment-tree-range-sum", () => {
  it("returns the range sum, and every built node stores the sum of its range", () => {
    const r = rng(22);
    for (let t = 0; t < 150; t++) {
      const values = Array.from({ length: ri(r, 1, 15) }, () => ri(r, -20, 20));
      const left = ri(r, 0, values.length - 1);
      const right = ri(r, left, values.length - 1);
      const trace = S.runSegment(must(S.segmentTreeRangeSum.parseInput({ values, left, right }, std)), std);
      assertValidTrace(trace);
      expect(trace.summary.result, JSON.stringify({ values, left, right })).toBe(sum(values.slice(left, right + 1)));
      const built = trace.steps.find((s) => s.source.kind === "anchor" && s.source.id === "query")!.state as TreeState;
      expect(built.nodes.length).toBe(2 * values.length - 1);
      expect(built.nodes.find((n) => n.id === built.root)!.value).toBe(sum(values));
      for (const n of built.nodes) if (n.left && n.right) expect(n.value).toBe(built.nodes.find((x) => x.id === n.left)!.value + built.nodes.find((x) => x.id === n.right)!.value);
    }
  });
  it("rejects left bigger than right or outside the array", () => {
    expect(S.segmentTreeRangeSum.parseInput({ values: [1, 2, 3], left: 2, right: 1 }, std).ok).toBe(false);
    expect(S.segmentTreeRangeSum.parseInput({ values: [1, 2, 3], left: 0, right: 3 }, std).ok).toBe(false);
    expect(S.segmentTreeRangeSum.parseInput({ values: [1, 2, 3], left: 0, right: 2 }, std).ok).toBe(true);
  });
  it("stays inside the step budget", () => {
    expect(S.runSegment({ values: Array.from({ length: 15 }, (_, i) => i + 1), left: 1, right: 13 }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(S.runSegment({ values: Array.from({ length: 8 }, (_, i) => i + 1), left: 1, right: 6 }, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});

/** Independent reference: grow a tree from each unvisited vertex, always taking the cheapest edge that reaches a new vertex. */
const primForest = (values: readonly number[], n: number): number => {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (let k = 0; k < values.length; k += 3) { adj[values[k]!]!.push([values[k + 2]!, values[k + 1]!]); adj[values[k + 1]!]!.push([values[k + 2]!, values[k]!]); }
  const seen = new Set<number>();
  let total = 0;
  for (let s = 0; s < n; s++) {
    if (seen.has(s)) continue;
    seen.add(s);
    let cand = [...adj[s]!];
    while (cand.length) {
      cand.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const [w, u] = cand.shift()!;
      if (seen.has(u)) continue;
      seen.add(u);
      total += w;
      cand = cand.concat(adj[u]!);
    }
  }
  return total;
};
describe("kruskal-mst", () => {
  it("matches an independent Prim reference and lists the accepted weights", () => {
    const r = rng(23);
    for (let t = 0; t < 150; t++) {
      const n = ri(r, 1, 8);
      const values = rgraph(r, n, ri(r, 0, 10), true);
      const trace = S.runKruskal(must(S.kruskalMst.parseInput({ values, vertices: n }, std)), std);
      assertValidTrace(trace);
      expect(trace.summary.result, JSON.stringify({ values, n })).toBe(primForest(values, n));
      const last = trace.steps[trace.steps.length - 1]!.state as GraphState;
      expect(sum(last.output)).toBe(trace.summary.result);
      expect(last.output.length).toBeLessThanOrEqual(Math.max(0, n - 1));
    }
  });
  it("rejects non-triples and weights outside 1 to 99", () => {
    expect(S.kruskalMst.parseInput({ values: [0, 1], vertices: 2 }, std).ok).toBe(false);
    expect(S.kruskalMst.parseInput({ values: [0, 1, 0], vertices: 2 }, std).ok).toBe(false);
    expect(S.kruskalMst.parseInput({ values: [0, 1, 5], vertices: 2 }, std).ok).toBe(true);
  });
  it("stays inside the step budget with the most edges allowed", () => {
    const r = rng(24);
    expect(S.runKruskal(must(S.kruskalMst.parseInput({ values: rgraph(r, 8, 10, true), vertices: 8 }, std)), std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(S.runKruskal(must(S.kruskalMst.parseInput({ values: rgraph(r, 5, 5, true), vertices: 5 }, lite)), lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});

/** Independent reference: transitive closure, then count the classes of mutually reachable vertices. */
const sccRef = (values: readonly number[], n: number): number => {
  const reach = Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => a === b));
  for (let k = 0; k < values.length; k += 2) reach[values[k]!]![values[k + 1]!] = true;
  for (let k = 0; k < n; k++) for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (reach[a]![k] && reach[k]![b]) reach[a]![b] = true;
  const seen = new Set<number>();
  let count = 0;
  for (let a = 0; a < n; a++) {
    if (seen.has(a)) continue;
    count++;
    for (let b = 0; b < n; b++) if (reach[a]![b] && reach[b]![a]) seen.add(b);
  }
  return count;
};
describe("strongly-connected-components", () => {
  it("matches the transitive-closure reference and labels every vertex with a component", () => {
    const r = rng(25);
    for (let t = 0; t < 200; t++) {
      const n = ri(r, 1, 8);
      const values = rgraph(r, n, ri(r, 0, 15), false);
      const trace = S.runScc(must(S.stronglyConnectedComponents.parseInput({ values, vertices: n }, std)), std);
      assertValidTrace(trace);
      expect(trace.summary.result, JSON.stringify({ values, n })).toBe(sccRef(values, n));
      const last = trace.steps[trace.steps.length - 1]!.state as GraphState;
      expect(Object.values(last.marks).every((m) => m !== null)).toBe(true);
      expect(new Set(Object.values(last.marks)).size).toBe(trace.summary.result);
      expect([...last.output].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
    }
  });
  it("stays inside the step budget with the most edges allowed", () => {
    const r = rng(26);
    for (let t = 0; t < 30; t++) expect(S.runScc(must(S.stronglyConnectedComponents.parseInput({ values: rgraph(r, 8, 15, false), vertices: 8 }, std)), std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    for (let t = 0; t < 30; t++) expect(S.runScc(must(S.stronglyConnectedComponents.parseInput({ values: rgraph(r, 6, 8, false), vertices: 6 }, lite)), lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});
