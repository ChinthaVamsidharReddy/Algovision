import { describe, expect, it } from "vitest";
import { ints, msg, rng, run, within } from "./testkit";

interface N { v: number; l: N | null; r: N | null }
const build = (vals: readonly number[]): N | null => {
  let root: N | null = null;
  for (const x of vals) {
    const n: N = { v: x, l: null, r: null };
    if (!root) { root = n; continue; }
    let c = root;
    for (;;) {
      const side = x < c.v ? "l" : "r";
      if (!c[side]) { c[side] = n; break; }
      c = c[side]!;
    }
  }
  return root;
};
const pre = (n: N | null): number[] => (n ? [n.v, ...pre(n.l), ...pre(n.r)] : []);
const post = (n: N | null): number[] => (n ? [...post(n.l), ...post(n.r), n.v] : []);
const ino = (n: N | null): number[] => (n ? [...ino(n.l), n.v, ...ino(n.r)] : []);
const height = (n: N | null): number => (n ? 1 + Math.max(height(n.l), height(n.r)) : 0);
const leaves = (n: N | null): number => (n ? (!n.l && !n.r ? 1 : leaves(n.l) + leaves(n.r)) : 0);
const level = (n: N | null): number[] => {
  const out: number[] = [];
  const q = n ? [n] : [];
  while (q.length) { const x = q.shift()!; out.push(x.v); if (x.l) q.push(x.l); if (x.r) q.push(x.r); }
  return out;
};
const trees = (r: () => number, f: (v: number[]) => void, count = 200, min = 0, max = 15) => {
  for (let k = 0; k < count; k++) f(ints(r, min + Math.floor(r() * (max - min + 1)), -6, 6));
};

describe("wave E: trees", () => {
  it("preorder, postorder and level-order equal the reference traversals", () => {
    trees(rng(31), (values) => {
      const root = build(values);
      expect(run("binary-tree-preorder", { values }).summary.result).toEqual(pre(root));
      expect(run("binary-tree-postorder", { values }).summary.result).toEqual(post(root));
      expect(run("level-order-traversal", { values }).summary.result).toEqual(level(root));
    });
  });
  it("traversals end with an empty call stack and the output grows by one per visit", () => {
    trees(rng(32), (values) => {
      for (const id of ["binary-tree-preorder", "binary-tree-postorder"]) {
        const t = run(id, { values });
        const last = t.steps.at(-1)!.state as { callStack: unknown[]; output: number[] };
        expect(last.callStack).toEqual([]);
        expect(last.output.length).toBe(values.length);
      }
    }, 80);
  });
  it("bst-search finds exactly the stored values; the path never repeats a node", () => {
    const r = rng(33);
    trees(r, (values) => {
      const value = ints(r, 1, -7, 7)[0]!;
      const t = run("bst-search", { values, value });
      expect(t.summary.result).toBe(values.includes(value) ? 1 : 0);
      const out = (t.steps.at(-1)!.state as { output: number[] }).output;
      expect(out.length).toBeLessThanOrEqual(height(build(values)));
    });
  });
  it("bst-insert: the in-order listing equals the sorted values and the new node is attached once", () => {
    const r = rng(34);
    trees(r, (values) => {
      const value = ints(r, 1, -7, 7)[0]!;
      const t = run("bst-insert", { values, value });
      expect(t.summary.result).toEqual(ino(build([...values, value])));
      expect((t.steps.at(-1)!.state as { nodes: unknown[] }).nodes.length).toBe(values.length + 1);
    }, 200, 0, 14);
    expect(msg("bst-insert", { values: Array(15).fill(1), value: 1 })).toContain("at most 14");
  });
  it("tree-height and count-leaves equal the references; the stack peaks at height + 1", () => {
    trees(rng(35), (values) => {
      const root = build(values);
      const h = run("tree-height", { values });
      expect(h.summary.result).toBe(height(root));
      expect(Math.max(0, ...h.steps.map((s) => (s.state as { callStack: unknown[] }).callStack.length))).toBe(height(root) + 1);
      expect(run("count-leaves", { values }).summary.result).toBe(leaves(root));
    });
  });
  it("bst-find-min-max returns [min, max] and needs at least one value", () => {
    trees(rng(36), (values) => expect(run("bst-find-min-max", { values }).summary.result).toEqual([Math.min(...values), Math.max(...values)]), 200, 1);
    expect(msg("bst-find-min-max", { values: [] })).toContain("at least one");
  });
  it("worst cases fit the standard step limit", () => {
    const chain = Array.from({ length: 15 }, (_, i) => i);
    for (const id of ["binary-tree-preorder", "binary-tree-postorder", "level-order-traversal", "tree-height", "count-leaves", "bst-find-min-max"]) within(id, { values: chain });
    within("bst-search", { values: chain, value: 99 });
    within("bst-insert", { values: chain.slice(0, 14), value: 99 });
  });
});
