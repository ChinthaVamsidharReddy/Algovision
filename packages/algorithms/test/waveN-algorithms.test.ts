import { describe, expect, it } from "vitest";
import { assertValidTrace, type ExecutionTrace, type TreeState } from "@algovision/trace-schema";
import { LIMIT_PROFILES } from "../src";
import * as H from "../src/algorithms/interview-heaps";
import { rng } from "./testkit";

const std = LIMIT_PROFILES.standard;
const lite = LIMIT_PROFILES.lite;
const must = <T,>(r: { ok: boolean } & Record<string, unknown>): T => {
  if (!r.ok) throw new Error(JSON.stringify(r));
  return r.value as T;
};
const rlist = (r: () => number, max: number, lo = 0): number[] => Array.from({ length: lo + Math.floor(r() * (max - lo + 1)) }, () => Math.floor(r() * 41) - 20);
const finalTree = (t: ExecutionTrace): TreeState => t.steps[t.steps.length - 1]!.state as TreeState;
/** Node values read back as the heap array: position i is node t{i+1}. */
const heapArray = (s: TreeState): number[] => s.nodes.map((n) => n.value);
const isMinHeap = (a: readonly number[]): boolean => a.every((v, i) => i === 0 || a[(i - 1) >> 1]! <= v);
const buildRef = (values: readonly number[]): number[] => {
  const a: number[] = [];
  for (const v of values) {
    a.push(v);
    let c = a.length - 1;
    while (c > 0 && a[(c - 1) >> 1]! > a[c]!) { [a[(c - 1) >> 1], a[c]] = [a[c]!, a[(c - 1) >> 1]!]; c = (c - 1) >> 1; }
  }
  return a;
};
const heapifyRef = (values: readonly number[]): number[] => {
  const a = [...values];
  const down = (r0: number) => {
    let r = r0;
    for (;;) {
      let m = r;
      for (const ch of [2 * r + 1, 2 * r + 2]) if (ch < a.length && a[ch]! < a[m]!) m = ch;
      if (m === r) return;
      [a[r], a[m]] = [a[m]!, a[r]!];
      r = m;
    }
  };
  for (let s = (a.length >> 1) - 1; s >= 0; s--) down(s);
  return a;
};
const inorder = (s: TreeState, id: string | null, out: number[] = []): number[] => {
  if (id === null) return out;
  const n = s.nodes.find((x) => x.id === id)!;
  inorder(s, n.left, out);
  out.push(n.value);
  inorder(s, n.right, out);
  return out;
};
const treeHeight = (s: TreeState, id: string | null): number => {
  if (id === null) return 0;
  const n = s.nodes.find((x) => x.id === id)!;
  return 1 + Math.max(treeHeight(s, n.left), treeHeight(s, n.right));
};
const balanced = (s: TreeState, id: string | null): boolean => {
  if (id === null) return true;
  const n = s.nodes.find((x) => x.id === id)!;
  return Math.abs(treeHeight(s, n.left) - treeHeight(s, n.right)) <= 1 && balanced(s, n.left) && balanced(s, n.right);
};

describe("min-heap-build-insert", () => {
  it("matches the reference arrangement, is a valid heap, and keeps the same values", () => {
    const r = rng(11);
    for (let t = 0; t < 120; t++) {
      const values = rlist(r, 15);
      const trace = H.runBuild(must(H.minHeapBuildInsert.parseInput({ values }, std)), std);
      assertValidTrace(trace);
      const got = heapArray(finalTree(trace));
      expect(got, JSON.stringify(values)).toEqual(buildRef(values));
      expect(isMinHeap(got)).toBe(true);
      expect([...got].sort((a, b) => a - b)).toEqual([...values].sort((a, b) => a - b));
      expect(trace.summary.result).toEqual(got);
    }
  });
  it("stays inside the step budget for the largest inputs (worst case: descending)", () => {
    const trace = H.runBuild({ values: Array.from({ length: 15 }, (_, i) => 15 - i) }, std);
    expect(trace.steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(H.runBuild({ values: Array.from({ length: 8 }, (_, i) => 8 - i) }, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
  it("handles empty and single inputs", () => {
    expect(H.runBuild({ values: [] }, std).summary.result).toEqual([]);
    expect(H.runBuild({ values: [4] }, std).summary.result).toEqual([4]);
  });
});

describe("heapify-bottom-up", () => {
  it("matches the reference arrangement and yields a valid heap", () => {
    const r = rng(12);
    for (let t = 0; t < 120; t++) {
      const values = rlist(r, 15);
      const trace = H.runHeapify(must(H.heapifyBottomUp.parseInput({ values }, std)), std);
      assertValidTrace(trace);
      const got = heapArray(finalTree(trace));
      expect(got, JSON.stringify(values)).toEqual(heapifyRef(values));
      expect(isMinHeap(got)).toBe(true);
      expect(trace.summary.result).toEqual(got);
    }
  });
  it("starts from the unordered array drawn as a complete tree", () => {
    const trace = H.runHeapify({ values: [9, 5, 6, 2, 3] }, std);
    expect(heapArray(trace.steps[0]!.state as TreeState)).toEqual([9, 5, 6, 2, 3]);
  });
  it("stays inside the step budget", () => {
    expect(H.runHeapify({ values: Array.from({ length: 15 }, (_, i) => 15 - i) }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(H.runHeapify({ values: Array.from({ length: 8 }, (_, i) => 8 - i) }, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});

describe("kth-largest-element", () => {
  it("returns the k-th largest for random inputs, and the heap never exceeds k nodes", () => {
    const r = rng(13);
    for (let t = 0; t < 150; t++) {
      const values = rlist(r, 15, 1);
      const k = 1 + Math.floor(r() * values.length);
      const trace = H.runKth(must(H.kthLargestElement.parseInput({ values, k }, std)), std);
      assertValidTrace(trace);
      expect(trace.summary.result, JSON.stringify({ values, k })).toBe([...values].sort((a, b) => b - a)[k - 1]);
      for (const s of trace.steps) {
        const st = s.state as TreeState;
        expect(st.nodes.length).toBeLessThanOrEqual(k);
        // Between a push or replace and the end of its sift the heap rule is temporarily broken; it must hold when the next value is taken.
        if (s.source.kind === "anchor" && (s.source.id === "next" || s.source.id === "finish")) expect(isMinHeap(heapArray(st)), `step ${s.index}`).toBe(true);
      }
    }
  });
  it("rejects k outside 1..n and an empty array", () => {
    expect(H.kthLargestElement.parseInput({ values: [1, 2, 3], k: 0 }, std).ok).toBe(false);
    expect(H.kthLargestElement.parseInput({ values: [1, 2, 3], k: 4 }, std).ok).toBe(false);
    expect(H.kthLargestElement.parseInput({ values: [], k: 1 }, std).ok).toBe(false);
    expect(H.kthLargestElement.parseInput({ values: [1, 2, 3], k: 3 }, std).ok).toBe(true);
  });
  it("stays inside the step budget", () => {
    for (const k of [1, 8, 15]) expect(H.runKth({ values: Array.from({ length: 15 }, (_, i) => i + 1), k }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(H.runKth({ values: Array.from({ length: 8 }, (_, i) => i + 1), k: 4 }, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});

describe("avl-tree-insert", () => {
  it("keeps a balanced, sorted tree of the distinct values and reports its height", () => {
    const r = rng(14);
    for (let t = 0; t < 150; t++) {
      const values = rlist(r, 15);
      const trace = H.runAvl(must(H.avlTreeInsert.parseInput({ values }, std)), std);
      assertValidTrace(trace);
      for (const s of trace.steps) {
        const st = s.state as TreeState;
        // Mid-rotation states are links being rewired, so only the settled steps (empty call stack) must be balanced.
        if (st.callStack.length === 0 && st.root !== null) {
          expect(balanced(st, st.root), `step ${s.index} ${JSON.stringify(values)}`).toBe(true);
          expect(inorder(st, st.root)).toEqual([...new Set(values.slice(0, st.nodes.length === 0 ? 0 : values.length))].sort((a, b) => a - b).filter((v) => inorder(st, st.root).includes(v)));
        }
      }
      const last = finalTree(trace);
      expect(inorder(last, last.root)).toEqual([...new Set(values)].sort((a, b) => a - b));
      expect(balanced(last, last.root)).toBe(true);
      expect(trace.summary.result).toBe(treeHeight(last, last.root));
    }
  });
  it("fixes the four rotation cases", () => {
    for (const [values, root] of [[[10, 20, 30], 20], [[30, 20, 10], 20], [[30, 10, 20], 20], [[10, 30, 20], 20]] as const) {
      const last = finalTree(H.runAvl({ values }, std));
      expect(last.nodes.find((n) => n.id === last.root)!.value).toBe(root);
      expect(treeHeight(last, last.root)).toBe(2);
    }
  });
  it("sorted input stays logarithmic", () => {
    expect(H.runAvl({ values: Array.from({ length: 15 }, (_, i) => i + 1) }, std).summary.result).toBe(4);
  });
  it("stays inside the step budget", () => {
    expect(H.runAvl({ values: Array.from({ length: 15 }, (_, i) => i + 1) }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(H.runAvl({ values: Array.from({ length: 15 }, (_, i) => 15 - i) }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(H.runAvl({ values: Array.from({ length: 8 }, (_, i) => i + 1) }, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});
