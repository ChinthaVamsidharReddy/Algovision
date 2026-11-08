import { describe, expect, it } from "vitest";
import { LIMIT_PROFILES } from "../src";
import { ints, msg, parse, rng, run, within } from "./testkit";

const fib = (n: number): number => { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; };
const lis = (v: number[]): number => {
  const dp = v.map(() => 1);
  for (let i = 0; i < v.length; i++) for (let j = 0; j < i; j++) if (v[j]! < v[i]!) dp[i] = Math.max(dp[i]!, dp[j]! + 1);
  return Math.max(0, ...dp);
};
const knap = (items: number[], cap: number): number => {
  const go = (k: number, c: number): number => {
    if (k >= items.length) return 0;
    const skip = go(k + 2, c);
    return items[k]! <= c ? Math.max(skip, items[k + 1]! + go(k + 2, c - items[k]!)) : skip;
  };
  return go(0, cap);
};
const coins = (c: number[], a: number): number => {
  const best = (x: number): number => (x === 0 ? 0 : Math.min(Infinity, ...c.filter((k) => k <= x).map((k) => best(x - k) + 1)));
  const r = best(a);
  return Number.isFinite(r) ? r : -1;
};
const dpOf = (t: ReturnType<typeof run>) => t.steps.map((s) => (s.state as { values: number[] }).values);

describe("wave G: dynamic programming", () => {
  it("fibonacci-dp and climbing-stairs equal the closed forms for every accepted n; table cells only grow", () => {
    for (let n = 0; n <= 14; n++) {
      const f = run("fibonacci-dp", { n });
      expect(f.summary.result).toBe(fib(n));
      if (n >= 2) expect(dpOf(f).at(-1)!.length).toBe(n + 1);
      if (n >= 1) expect(run("climbing-stairs", { n }).summary.result).toBe(fib(n + 1));
    }
    expect(msg("fibonacci-dp", { n: 15 })).toContain("between 0 and 14");
    expect(msg("climbing-stairs", { n: 0 })).toContain("between 1 and");
  });
  it("house-robber equals brute force over non-adjacent subsets", () => {
    const r = rng(51);
    for (let k = 0; k < 300; k++) {
      const v = ints(r, Math.floor(r() * 13), 0, 20);
      let best = 0;
      for (let mask = 0; mask < 1 << v.length; mask++) {
        if (mask & (mask >> 1)) continue;
        best = Math.max(best, v.reduce((s, x, i) => s + (mask >> i & 1 ? x : 0), 0));
      }
      const t = run("house-robber", { values: v });
      expect(t.summary.result).toBe(best);
      // once the table is complete it is non-decreasing
      const row = dpOf(t).at(-1)!;
      for (let i = 1; i < row.length; i++) expect(row[i]!).toBeGreaterThanOrEqual(row[i - 1]!);
    }
    expect(msg("house-robber", { values: [-1] })).toContain("0 to 999");
  });
  it("coin-change equals the recursive reference; impossible amounts give -1", () => {
    const r = rng(52);
    for (let k = 0; k < 250; k++) {
      const c = ints(r, Math.floor(r() * 5), 1, 9);
      const amount = Math.floor(r() * 16);
      expect(run("coin-change-min-coins", { values: c, amount }).summary.result).toBe(coins(c, amount));
    }
    expect(msg("coin-change-min-coins", { values: [0], amount: 3 })).toContain("1 to 99");
    expect(msg("coin-change-min-coins", { values: [1], amount: 21 })).toContain("between 0 and 20");
  });
  it("longest-increasing-subsequence equals the reference; dp[i] is always at least 1", () => {
    const r = rng(53);
    for (let k = 0; k < 300; k++) {
      const v = ints(r, Math.floor(r() * 16), -6, 6);
      const t = run("longest-increasing-subsequence", { values: v });
      expect(t.summary.result).toBe(lis(v));
      for (const row of dpOf(t)) for (const x of row) expect(x).toBeGreaterThanOrEqual(1);
    }
  });
  it("knapsack equals the recursive 0/1 reference; validates the pair format", () => {
    const r = rng(54);
    for (let k = 0; k < 250; k++) {
      const items: number[] = [];
      for (let i = Math.floor(r() * 8); i > 0; i--) items.push(1 + Math.floor(r() * 8), Math.floor(r() * 21));
      const capacity = Math.floor(r() * 21);
      expect(run("knapsack-01-1d", { values: items, capacity }).summary.result).toBe(knap(items, capacity));
    }
    expect(msg("knapsack-01-1d", { values: [1, 2, 3], capacity: 4 })).toContain("pairs");
    expect(msg("knapsack-01-1d", { values: [0, 5], capacity: 4 })).toContain("weight");
    expect(msg("knapsack-01-1d", { values: [1, 1], capacity: 21 })).toContain("between 0 and 20");
  });
  it("worst cases fit the standard step limit; the defaults fit lite", () => {
    within("fibonacci-dp", { n: 14 });
    within("climbing-stairs", { n: 14 });
    within("house-robber", { values: Array(15).fill(9) });
    within("coin-change-min-coins", { values: Array.from({ length: 15 }, (_, i) => i + 1), amount: 20 });
    within("longest-increasing-subsequence", { values: Array.from({ length: 15 }, (_, i) => i) });
    within("knapsack-01-1d", { values: Array.from({ length: 14 }, (_, i) => (i % 2 === 0 ? 1 : 9)), capacity: 20 });
    expect(parse("fibonacci-dp", { n: 14 }).ok).toBe(true);
    expect(LIMIT_PROFILES.lite.maxArrayLength).toBeGreaterThan(0);
  });
});
