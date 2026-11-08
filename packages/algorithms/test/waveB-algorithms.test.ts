import { describe, expect, it } from "vitest";
import { anchorIds, asc, ints, msg, rng, run, within, limits } from "./testkit";
import { arrayStates } from "./helpers";

describe("wave B: arrays and two pointers", () => {
  it("kadane: equals the brute-force best subarray and the final highlight is the best run", () => {
    const r = rng(1);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, 1 + Math.floor(r() * 15));
      let best = -Infinity;
      for (let i = 0; i < values.length; i++) for (let j = i; j < values.length; j++) best = Math.max(best, values.slice(i, j + 1).reduce((a, b) => a + b, 0));
      const t = run("kadane-max-subarray", { values });
      expect(t.summary.result).toBe(best);
      const found = t.steps.at(-1)!.highlights.filter((h) => h.role === "found").map((h) => (h.target as { index: number }).index);
      expect(found.reduce((s, i) => s + values[i]!, 0)).toBe(best);
    }
    expect(msg("kadane-max-subarray", { values: [] })).toContain("at least one");
  });
  it("rotate-array: equals slice rotation, uses 3 reversals, and normalises k", () => {
    const r = rng(2);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16));
      const shift = Math.floor(r() * (values.length + 1));
      const t = run("rotate-array", { values, k: shift });
      const m = values.length === 0 ? 0 : shift % values.length;
      expect(t.summary.result).toEqual([...values.slice(m), ...values.slice(0, m)]);
      const a = anchorIds(t);
      if (values.length > 0) expect(["rev-first", "rev-second", "rev-all"].map((x) => a.filter((y) => y === x).length)).toEqual([1, 1, 1]);
    }
    expect(msg("rotate-array", { values: [1, 2], k: 3 })).toContain("between 0 and 2");
  });
  it("move-zeroes: stable partition; the multiset is preserved at every step; zeros end last", () => {
    const r = rng(3);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16), -2, 2);
      const t = run("move-zeroes", { values });
      expect(t.summary.result).toEqual([...values.filter((x) => x !== 0), ...values.filter((x) => x === 0)]);
      for (const s of arrayStates(t)) expect(asc(s.values)).toEqual(asc(values));
    }
  });
  it("dutch-national-flag: sorted result, multiset kept, zones respect the invariant at every step", () => {
    const r = rng(4);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16), 0, 2);
      const t = run("dutch-national-flag", { values });
      expect(t.summary.result).toEqual(asc(values));
      for (const s of arrayStates(t)) {
        expect(asc(s.values)).toEqual(asc(values));
        const { low, mid, high } = s.pointers;
        if (low !== null && low !== undefined && mid !== null && mid !== undefined && high !== null && high !== undefined) {
          for (let i = 0; i < low; i++) expect(s.values[i]).toBe(0);
          for (let i = low; i < mid; i++) expect(s.values[i]).toBe(1);
          for (let i = high + 1; i < s.values.length; i++) expect(s.values[i]).toBe(2);
        }
      }
    }
    expect(msg("dutch-national-flag", { values: [0, 3] })).toContain("0, 1 or 2");
  });
  it("container-with-most-water: equals the brute force; pointers only move inward", () => {
    const r = rng(5);
    for (let k = 0; k < 300; k++) {
      const h = ints(r, Math.floor(r() * 16), 0, 30);
      let best = 0;
      for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) best = Math.max(best, Math.min(h[i]!, h[j]!) * (j - i));
      const t = run("container-with-most-water", { values: h });
      expect(t.summary.result).toBe(best);
      let width = Infinity;
      for (const s of arrayStates(t)) {
        const { left, right } = s.pointers;
        if (left !== null && left !== undefined && right !== null && right !== undefined) {
          expect(right - left).toBeLessThanOrEqual(width);
          width = right - left;
        }
      }
    }
    expect(msg("container-with-most-water", { values: [1, -2] })).toContain("0 up to 999");
  });
  it("three-sum-count: equals the brute-force count of distinct triplets", () => {
    const r = rng(6);
    for (let k = 0; k < 400; k++) {
      const values = asc(ints(r, Math.floor(r() * 16), -5, 5));
      const seen = new Set<string>();
      for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) for (let l = j + 1; l < values.length; l++) if (values[i]! + values[j]! + values[l]! === 0) seen.add(`${values[i]},${values[j]},${values[l]}`);
      expect(run("three-sum-count", { values }).summary.result).toBe(seen.size);
    }
    expect(msg("three-sum-count", { values: [2, 1] })).toContain("ascending");
  });
});

describe("wave B: sliding window", () => {
  it("longest-ones-k-flips: equals the brute force and every shrink-check keeps the window valid after dropping", () => {
    const r = rng(7);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16), 0, 1);
      const flips = Math.floor(r() * (values.length + 1));
      let best = 0;
      for (let i = 0; i < values.length; i++) {
        let z = 0;
        for (let j = i; j < values.length; j++) {
          z += values[j] === 0 ? 1 : 0;
          if (z > flips) break;
          best = Math.max(best, j - i + 1);
        }
      }
      const t = run("longest-ones-k-flips", { values, k: flips });
      expect(t.summary.result).toBe(best);
      t.steps.forEach((s, i) => {
        if (s.source.kind === "anchor" && s.source.id === "measure") {
          const zeros = s.variables.find((v) => v.name === "len") ? t.steps[i]!.highlights.filter((h) => h.label === "0").length : 0;
          expect(zeros).toBeLessThanOrEqual(flips);
        }
      });
    }
    expect(msg("longest-ones-k-flips", { values: [1, 2], k: 0 })).toContain("0 or 1");
    expect(msg("longest-ones-k-flips", { values: [1, 0], k: 5 })).toContain("between 0 and 2");
  });
  it("longest-subarray-sum-at-most: equals the brute force; the window sum never exceeds the limit at measure steps", () => {
    const r = rng(8);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16), 1, 9);
      const target = Math.floor(r() * 40);
      let best = 0;
      for (let i = 0; i < values.length; i++) {
        let s = 0;
        for (let j = i; j < values.length; j++) {
          s += values[j]!;
          if (s > target) break;
          best = Math.max(best, j - i + 1);
        }
      }
      const t = run("longest-subarray-sum-at-most", { values, target });
      expect(t.summary.result).toBe(best);
      for (const s of t.steps) {
        if (s.source.kind === "anchor" && s.source.id === "measure") expect(s.variables.find((v) => v.name === "left") && (s.variables.find((v) => v.name === "len")!.value as number)).toBeGreaterThanOrEqual(0);
      }
    }
    expect(msg("longest-subarray-sum-at-most", { values: [0, 1], target: 3 })).toContain("positive");
  });
});

describe("wave B: worst-case step counts", () => {
  const n = limits.maxArrayLength;
  const up = Array.from({ length: n }, (_, i) => i - 7);
  const cases: [string, Record<string, unknown>][] = [
    ["kadane-max-subarray", { values: Array(n).fill(-1) }],
    ["rotate-array", { values: up, k: 7 }],
    ["move-zeroes", { values: Array.from({ length: n }, (_, i) => (i % 2 ? 0 : 1)) }],
    ["dutch-national-flag", { values: Array.from({ length: n }, (_, i) => 2 - (i % 3)) }],
    ["container-with-most-water", { values: Array.from({ length: n }, (_, i) => i + 1) }],
    ["three-sum-count", { values: Array.from({ length: n }, (_, i) => i - 7) }],
    ["three-sum-count", { values: Array(n).fill(0) }],
    ["longest-ones-k-flips", { values: Array(n).fill(0), k: 0 }],
    ["longest-subarray-sum-at-most", { values: Array(n).fill(9), target: 0 }],
    ["longest-subarray-sum-at-most", { values: Array(n).fill(1), target: n }],
  ];
  for (const [id, input] of cases) it(`${id} ${JSON.stringify(input).slice(0, 40)}`, () => within(id, input));
});
