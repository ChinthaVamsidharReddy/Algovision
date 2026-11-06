import { describe, expect, it } from "vitest";
import { assertValidTrace, validateTrace, type ExecutionTrace } from "@algovision/trace-schema";
import { LIMIT_PROFILES, TraceLimitError, getAlgorithm } from "../src";
import { buildTree } from "../src/algorithms/binary-tree-inorder";
import { readVectors } from "./helpers";

const ID = "binary-tree-inorder";
const limits = LIMIT_PROFILES.standard;
const entry = getAlgorithm(ID)!;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function run(input: Record<string, unknown>, profile = limits): ExecutionTrace {
  const parsed = entry.definition.parseInput(input, profile);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed));
  return entry.definition.run(parsed.value, profile);
}
const treeSteps = (t: ExecutionTrace) =>
  t.steps.map((s) => {
    if (s.state.kind !== "tree") throw new Error("wrong state kind");
    return { event: s.event, anchor: s.source.kind === "anchor" ? s.source.id : "?", state: s.state };
  });

function height(values: number[]): number {
  const { nodes, root } = buildTree(values);
  const h = (id: string | null): number => {
    if (id === null) return 0;
    const n = nodes.find((x) => x.id === id)!;
    return 1 + Math.max(h(n.left), h(n.right));
  };
  return h(root);
}

describe(ID, () => {
  for (const v of readVectors(ID)) {
    it(`${v.name}: valid trace, output equals the sorted values`, () => {
      const trace = run(v.input);
      const result = validateTrace(trace, { maxSteps: limits.maxSteps });
      expect(result.ok ? [] : result.issues).toEqual([]);
      expect(trace.summary.result).toEqual(v.expected);
      expect(treeSteps(trace).at(-1)!.state.output).toEqual(v.expected);
      expect(() => assertValidTrace(JSON.parse(JSON.stringify(trace)))).not.toThrow();
    });
  }

  it("random trees: sorted output, balanced calls and returns, stack depth equals height + 1", () => {
    const rand = mulberry32(2026);
    for (let k = 0; k < 300; k++) {
      const values = Array.from({ length: Math.floor(rand() * 16) }, () => Math.floor(rand() * 21) - 10);
      const trace = run({ values });
      const steps = treeSteps(trace);
      expect(trace.summary.result).toEqual([...values].sort((a, b) => a - b));
      const calls = steps.filter((s) => s.event.type === "call").length;
      const returns = steps.filter((s) => s.event.type === "return").length;
      expect(calls).toBe(2 * values.length + 1);
      expect(returns).toBe(calls);
      expect(steps.filter((s) => s.event.type === "visit")).toHaveLength(values.length);
      expect(steps.at(-1)!.state.callStack).toEqual([]);
      const maxDepth = Math.max(...steps.map((s) => s.state.callStack.length));
      expect(maxDepth).toBe(height(values) + 1);
      expect(trace.steps.length).toBe(5 * values.length + 3);
      // the tree never changes while it is traversed
      for (const s of steps) expect(s.state.nodes).toEqual(steps[0]!.state.nodes);
    }
  });

  it("builds a binary search tree: left < node <= right, duplicates go right", () => {
    const { nodes } = buildTree([4, 2, 4, 2, 4]);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    for (const n of nodes) {
      if (n.left) expect(byId.get(n.left)!.value).toBeLessThan(n.value);
      if (n.right) expect(byId.get(n.right)!.value).toBeGreaterThanOrEqual(n.value);
    }
  });

  it("the call stack grows on every call and shrinks on every return", () => {
    const steps = treeSteps(run({ values: [5, 3, 8, 1, 4] }));
    steps.forEach((s, i) => {
      if (i === 0) return;
      const delta = s.state.callStack.length - steps[i - 1]!.state.callStack.length;
      if (s.event.type === "call") expect(delta).toBe(1);
      else if (s.event.type === "return") expect(delta).toBe(-1);
      else expect(delta).toBe(0);
    });
  });

  it("visit happens after the left subtree and before the right subtree", () => {
    const steps = treeSteps(run({ values: [5, 3, 8] }));
    const order = steps.filter((s) => s.event.type === "visit").map((s) => s.state.output.at(-1));
    expect(order).toEqual([3, 5, 8]);
    const visit5 = steps.findIndex((s) => s.event.type === "visit" && s.state.output.at(-1) === 5);
    const callRight = steps.findIndex((s) => s.anchor === "go-right" && s.state.callStack.at(-1) === "t3");
    const callLeft = steps.findIndex((s) => s.anchor === "go-left" && s.state.callStack.at(-1) === "t2");
    expect(callLeft).toBeLessThan(visit5);
    expect(visit5).toBeLessThan(callRight);
  });

  it("does not mutate its input and is deterministic", () => {
    const input = { values: [5, 3, 8] };
    const frozen = JSON.stringify(input);
    expect(JSON.stringify(run(input))).toBe(JSON.stringify(run(input)));
    expect(JSON.stringify(input)).toBe(frozen);
  });

  it("rejects too many values, out-of-range values and unknown fields", () => {
    const p = (i: Record<string, unknown>, profile = limits) => entry.definition.parseInput(i, profile);
    expect(p({ values: Array(LIMIT_PROFILES.lite.maxArrayLength + 1).fill(1) }, LIMIT_PROFILES.lite).ok).toBe(false);
    expect(JSON.stringify(p({ values: Array(16).fill(1) }))).toContain("The tree can have at most 15 values");
    expect(p({ values: [1000] }).ok).toBe(false);
    expect(p({ values: [1], target: 1 }).ok).toBe(false);
  });

  it("throws TraceLimitError when the step budget is too small, and the maximum input fits", () => {
    expect(() => run({ values: [1, 2, 3] }, { ...limits, maxSteps: 5 })).toThrow(TraceLimitError);
    const worst = run({ values: Array.from({ length: 15 }, (_, i) => i) });
    expect(worst.steps.length).toBe(78);
    expect(worst.steps.length).toBeLessThanOrEqual(limits.maxSteps);
  });
});
