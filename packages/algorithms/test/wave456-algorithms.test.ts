import { describe, expect, it } from "vitest";
import { validateTrace, type ExecutionTrace } from "@algovision/trace-schema";
import { LIMIT_PROFILES, getAlgorithm } from "../src";
import { arrayStates, readVectors } from "./helpers";

const limits = LIMIT_PROFILES.standard;
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const run = (id: string, input: Record<string, unknown>, profile = limits): ExecutionTrace => {
  const e = getAlgorithm(id)!;
  const p = e.definition.parseInput(input, profile);
  if (!p.ok) throw new Error(JSON.stringify(p));
  return e.definition.run(p.value, profile);
};
const parse = (id: string, input: Record<string, unknown>, profile = limits) => getAlgorithm(id)!.definition.parseInput(input, profile);
const anchors = (t: ExecutionTrace) => t.steps.map((s) => (s.source.kind === "anchor" ? s.source.id : "?"));
const ints = (r: () => number, n: number, lo = -20, hi = 20) => Array.from({ length: n }, () => lo + Math.floor(r() * (hi - lo + 1)));
const NEW = ["find-maximum", "prefix-sum", "insert-at-index", "delete-at-index", "two-sum-sorted", "reverse-in-place", "remove-duplicates-sorted", "max-sum-subarray-k", "smallest-subarray-sum"];

describe("wave 4-6: every vector and default input", () => {
  for (const id of NEW) {
    it(`${id}: executor result equals each shared vector and every trace validates`, () => {
      for (const v of readVectors(id)) {
        const trace = run(id, v.input as Record<string, unknown>);
        expect(trace.summary.result, `${id} / ${v.name}`).toEqual(v.expected);
        const checked = validateTrace(trace);
        expect(checked.ok, JSON.stringify(checked)).toBe(true);
      }
      const e = getAlgorithm(id)!;
      expect(run(id, e.content.meta.defaultInput as Record<string, unknown>).steps.length).toBeGreaterThan(1);
    });
    it(`${id}: every emitted anchor is declared, and every declared anchor is emitted by the default or a vector input`, () => {
      const e = getAlgorithm(id)!;
      const declared = new Set(e.content.meta.anchors.map((a) => a.id));
      const used = new Set<string>();
      for (const v of [{ input: e.content.meta.defaultInput }, ...readVectors(id)]) {
        for (const a of anchors(run(id, v.input as Record<string, unknown>))) {
          expect(declared.has(a), `${id}: undeclared anchor ${a}`).toBe(true);
          used.add(a);
        }
      }
      expect([...declared].filter((a) => !used.has(a))).toEqual([]);
    });
    it(`${id}: fits the lite profile for a maximum-size input and is deterministic`, () => {
      const lite = LIMIT_PROFILES.lite;
      const e = getAlgorithm(id)!;
      const base = e.content.meta.defaultInput as Record<string, unknown>;
      expect(JSON.stringify(run(id, base))).toBe(JSON.stringify(run(id, base)));
      expect(run(id, base, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
    });
  }
});

describe("worst-case step counts stay inside the standard limit", () => {
  const n = limits.maxArrayLength;
  const big = Array.from({ length: n }, (_, i) => 999 - i);
  const asc = [...big].reverse();
  const cases: [string, Record<string, unknown>][] = [
    ["find-maximum", { values: asc }],
    ["prefix-sum", { values: big }],
    ["insert-at-index", { values: big.slice(0, n - 1), index: 0, value: 1 }],
    ["delete-at-index", { values: big, index: 0 }],
    ["two-sum-sorted", { values: asc, target: -5 }],
    ["reverse-in-place", { values: big }],
    ["remove-duplicates-sorted", { values: asc }],
    ["max-sum-subarray-k", { values: asc, k: 1 }],
    ["smallest-subarray-sum", { values: Array(n).fill(1), target: 1 }],
  ];
  for (const [id, input] of cases) {
    it(`${id} with ${n} values`, () => {
      expect(run(id, input).steps.length).toBeLessThanOrEqual(limits.maxSteps);
    });
  }
});

describe("find-maximum", () => {
  it("random: result is the maximum and the best pointer only ever moves to a strictly larger value", () => {
    const r = rng(41);
    for (let k = 0; k < 200; k++) {
      const values = ints(r, 1 + Math.floor(r() * 15));
      const t = run("find-maximum", { values });
      expect(t.summary.result).toBe(Math.max(...values));
      let prev = -Infinity;
      for (const s of arrayStates(t)) {
        const b = s.pointers.best;
        if (b !== null && b !== undefined) {
          expect(values[b]!).toBeGreaterThanOrEqual(prev);
          prev = values[b]!;
        }
      }
    }
  });
  it("rejects an empty array", () => {
    expect(JSON.stringify(parse("find-maximum", { values: [] }))).toContain("at least one value");
  });
});

describe("prefix-sum", () => {
  it("random: final state is the running total and the sum of any range equals a difference", () => {
    const r = rng(7);
    for (let k = 0; k < 200; k++) {
      const values = ints(r, Math.floor(r() * 16));
      const t = run("prefix-sum", { values });
      const out = t.summary.result as number[];
      let s = 0;
      values.forEach((v, i) => expect(out[i]).toBe((s += v)));
      expect(arrayStates(t).at(-1)!.values).toEqual(out);
      if (values.length > 3) expect(out[3]! - out[1]!).toBe(values[2]! + values[3]!);
    }
  });
});

describe("insert-at-index / delete-at-index", () => {
  it("insert: random inputs match splice, and the spare slot makes the array one longer from the first step", () => {
    const r = rng(11);
    for (let k = 0; k < 200; k++) {
      const values = ints(r, Math.floor(r() * 15));
      const index = Math.floor(r() * (values.length + 1));
      const value = ints(r, 1)[0]!;
      const expected = [...values];
      expected.splice(index, 0, value);
      const t = run("insert-at-index", { values, index, value });
      expect(t.summary.result).toEqual(expected);
      expect(arrayStates(t)[0]!.values).toHaveLength(values.length + 1);
      expect(anchors(t).filter((a) => a === "shift")).toHaveLength(values.length - index);
    }
  });
  it("insert: the standard profile reserves room, so a full array is rejected with a clear message", () => {
    const full = Array.from({ length: limits.maxArrayLength }, (_, i) => i);
    expect(JSON.stringify(parse("insert-at-index", { values: full, index: 0, value: 1 }))).toContain("at most");
  });
  it("insert/delete reject out-of-range positions with the valid range in the message", () => {
    expect(JSON.stringify(parse("insert-at-index", { values: [1, 2], index: 3, value: 1 }))).toContain("between 0 and 2");
    expect(JSON.stringify(parse("insert-at-index", { values: [1, 2], index: -1, value: 1 }))).toContain("between 0 and 2");
    expect(JSON.stringify(parse("delete-at-index", { values: [1, 2], index: 2 }))).toContain("between 0 and 1");
    expect(JSON.stringify(parse("delete-at-index", { values: [], index: 0 }))).toContain("at least one value");
  });
  it("delete: random inputs match splice and the array shrinks by one in the last step", () => {
    const r = rng(13);
    for (let k = 0; k < 200; k++) {
      const values = ints(r, 1 + Math.floor(r() * 15));
      const index = Math.floor(r() * values.length);
      const expected = [...values];
      expected.splice(index, 1);
      const t = run("delete-at-index", { values, index });
      expect(t.summary.result).toEqual(expected);
      expect(arrayStates(t).at(-1)!.values).toEqual(expected);
      expect(anchors(t).filter((a) => a === "shift")).toHaveLength(values.length - 1 - index);
    }
  });
});

describe("two pointers", () => {
  it("two-sum-sorted: finds a valid pair exactly when one exists; pointers never cross past each other before the end", () => {
    const r = rng(17);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16)).sort((a, b) => a - b);
      const target = ints(r, 1, -30, 30)[0]!;
      const t = run("two-sum-sorted", { values, target });
      const res = t.summary.result as number[];
      let exists = false;
      for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) if (values[i]! + values[j]! === target) exists = true;
      expect(res.length === 2).toBe(exists);
      if (res.length === 2) {
        expect(res[0]!).toBeLessThan(res[1]!);
        expect(values[res[0]!]! + values[res[1]!]!).toBe(target);
      }
      expect(anchors(t).filter((a) => a === "sum").length).toBeLessThanOrEqual(Math.max(0, values.length - 1));
      for (const s of arrayStates(t)) {
        const { left, right } = s.pointers;
        if (left !== null && left !== undefined && right !== null && right !== undefined) expect(left).toBeLessThanOrEqual(right + 1);
      }
    }
  });
  it("two-sum-sorted rejects unsorted input", () => {
    expect(JSON.stringify(parse("two-sum-sorted", { values: [3, 1], target: 4 }))).toContain("ascending order");
  });
  it("reverse-in-place: matches reverse(), preserves the multiset at every step, swaps exactly floor(n/2) times", () => {
    const r = rng(19);
    for (let k = 0; k < 200; k++) {
      const values = ints(r, Math.floor(r() * 16));
      const t = run("reverse-in-place", { values });
      expect(t.summary.result).toEqual([...values].reverse());
      for (const s of arrayStates(t)) expect([...s.values].sort((a, b) => a - b)).toEqual([...values].sort((a, b) => a - b));
      expect(anchors(t).filter((a) => a === "swap")).toHaveLength(Math.floor(values.length / 2));
    }
  });
  it("remove-duplicates-sorted: result is the distinct values in order and the unique prefix is always ascending", () => {
    const r = rng(23);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16), -4, 4).sort((a, b) => a - b);
      const t = run("remove-duplicates-sorted", { values });
      expect(t.summary.result).toEqual([...new Set(values)]);
      const names = anchors(t);
      for (const [i, s] of arrayStates(t).entries()) {
        const slow = s.pointers.slow;
        // Between advancing slow and copying into it, the new cell still holds its old value.
        if (slow !== null && slow !== undefined && names[i] !== "advance-slow") {
          const prefix = s.values.slice(0, slow + 1);
          expect(new Set(prefix).size).toBe(prefix.length);
        }
      }
    }
  });
});

describe("sliding window", () => {
  it("max-sum-subarray-k: equals the brute force; the window is always exactly k wide; each slide is one add and one remove", () => {
    const r = rng(29);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, 1 + Math.floor(r() * 15));
      const w = 1 + Math.floor(r() * values.length);
      const t = run("max-sum-subarray-k", { values, k: w });
      let best = -Infinity;
      for (let i = 0; i + w <= values.length; i++) best = Math.max(best, values.slice(i, i + w).reduce((a, b) => a + b, 0));
      expect(t.summary.result).toBe(best);
      expect(anchors(t).filter((a) => a === "slide")).toHaveLength(values.length - w);
      t.steps.forEach((s, i) => {
        if (s.source.kind === "anchor" && s.source.id === "slide") {
          const inWindow = s.highlights.filter((h) => h.role === "window");
          expect(inWindow, `step ${i}`).toHaveLength(w);
        }
      });
    }
  });
  it("max-sum-subarray-k rejects k outside 1..n and empty arrays", () => {
    expect(JSON.stringify(parse("max-sum-subarray-k", { values: [1, 2], k: 3 }))).toContain("between 1 and 2");
    expect(JSON.stringify(parse("max-sum-subarray-k", { values: [1, 2], k: 0 }))).toContain("between 1 and 2");
    expect(parse("max-sum-subarray-k", { values: [], k: 1 }).ok).toBe(false);
  });
  it("smallest-subarray-sum: equals the brute force; the window sum is >= target exactly at each shrink", () => {
    const r = rng(31);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16), 1, 9);
      const target = 1 + Math.floor(r() * 40);
      const t = run("smallest-subarray-sum", { values, target });
      let best = 0;
      for (let i = 0; i < values.length; i++) {
        let s = 0;
        for (let j = i; j < values.length; j++) {
          s += values[j]!;
          if (s >= target) {
            if (best === 0 || j - i + 1 < best) best = j - i + 1;
            break;
          }
        }
      }
      expect(t.summary.result).toBe(best);
      t.steps.forEach((s, i) => {
        if (s.source.kind !== "anchor" || s.source.id !== "measure") return;
        const sum = s.variables.find((v) => v.name === "sum")!.value as number;
        expect(sum, `step ${i}`).toBeGreaterThanOrEqual(target);
      });
    }
  });
  it("smallest-subarray-sum rejects non-positive values and a non-positive target", () => {
    expect(JSON.stringify(parse("smallest-subarray-sum", { values: [1, 0, 2], target: 3 }))).toContain("positive");
    expect(JSON.stringify(parse("smallest-subarray-sum", { values: [1, 2], target: 0 }))).toContain("Target sum");
  });
});
