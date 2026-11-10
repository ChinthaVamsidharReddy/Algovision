import { describe, expect, it } from "vitest";
import { LIMIT_PROFILES } from "../src";
import * as BT from "../src/algorithms/interview-backtracking";
import * as DP from "../src/algorithms/interview-dp";
import { ints, rng } from "./testkit";

const std = LIMIT_PROFILES.standard;
const lite = LIMIT_PROFILES.lite;
const ok = <T>(r: { ok: boolean; value?: T }): T => { if (!r.ok) throw new Error(JSON.stringify(r)); return r.value as T; };

describe("wave K: backtracking", () => {
  it("subset-sum-count equals the bitmask enumeration", () => {
    const r = rng(1101);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 7), 0, 9);
      const target = Math.floor(r() * 30);
      let c = 0;
      for (let m = 0; m < 1 << values.length; m++) if (values.reduce((s, v, i) => s + (m & (1 << i) ? v : 0), 0) === target) c++;
      expect(BT.runSubset(ok(BT.parseSubset({ values, target }, std)), std).summary.result).toBe(c);
    }
    expect(BT.parseSubset({ values: [1, 2, 3, 4, 5, 6, 7], target: 5 }, std).ok).toBe(false);
  });
  it("n-queens and parentheses equal the known counts and never leave a queen behind", () => {
    const known = [1, 0, 0, 2, 10, 4, 40];
    for (let n = 1; n <= 5; n++) {
      const t = BT.runQueens({ n }, std);
      expect(t.summary.result).toBe(known[n - 1]);
      expect(JSON.stringify(t.steps.at(-1)!.state)).toContain(JSON.stringify(new Array(n).fill(0)));
    }
    const catalan = [1, 1, 2, 5, 14, 42];
    for (let n = 1; n <= 4; n++) expect(BT.runParens({ n }, std).summary.result).toBe(catalan[n]);
    expect(BT.parseQueens({ n: 6 }, std).ok).toBe(false);
    expect(BT.parseQueens({ n: 5 }, lite).ok).toBe(false);
    expect(BT.parseParens({ n: 4 }, lite).ok).toBe(false);
  });
  it("worst cases fit their own profile's step budget", () => {
    for (const [profile, n, p] of [[lite, 4, 3], [std, 5, 4]] as const) {
      expect(BT.runQueens({ n }, profile).steps.length).toBeLessThanOrEqual(profile.maxSteps);
      expect(BT.runParens({ n: p }, profile).steps.length).toBeLessThanOrEqual(profile.maxSteps);
      expect(BT.runSubset({ values: [0, 0, 0, 0, 0, 0], target: 0 }, profile).steps.length).toBeLessThanOrEqual(profile.maxSteps);
    }
  });
});

describe("wave K: dynamic programming", () => {
  it("unique paths equals the binomial coefficient", () => {
    const C = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
    for (let m = 1; m <= 15; m += 2) for (let n = 1; n <= 15; n += 3) expect(DP.runPaths({ rows: m, cols: n }, std).summary.result).toBe(C(m + n - 2, m - 1));
  });
  it("coin-change ways and subset-sum dp equal brute force", () => {
    const r = rng(1102);
    for (let k = 0; k < 200; k++) {
      const coins = [...new Set(ints(r, 1 + Math.floor(r() * 4), 1, 9))];
      const amount = Math.floor(r() * 21);
      const ways = (i: number, a: number): number => (a === 0 ? 1 : i === coins.length || a < 0 ? 0 : ways(i, a - coins[i]!) + ways(i + 1, a));
      expect(DP.runWays(ok(DP.parseWays({ values: coins, amount }, std)), std).summary.result).toBe(ways(0, amount));
      const values = ints(r, Math.floor(r() * 8), 1, 12);
      const target = Math.floor(r() * 31);
      let can = 0;
      for (let m = 0; m < 1 << values.length; m++) if (values.reduce((s, v, i) => s + (m & (1 << i) ? v : 0), 0) === target) can = 1;
      expect(DP.runSubsetDp(ok(DP.parseSubsetDp({ values, target }, std)), std).summary.result).toBe(can);
    }
    expect(DP.parseWays({ values: [2, 2], amount: 4 }, std).ok).toBe(false);
  });
  it("circular robber, climbing stairs, max product and decode ways equal references", () => {
    const r = rng(1103);
    for (let k = 0; k < 300; k++) {
      const h = ints(r, 1 + Math.floor(r() * 10), 0, 30);
      const line = (a: number[]) => { let p = 0, c = 0; for (const x of a) [p, c] = [c, Math.max(c, p + x)]; return c; };
      expect(DP.runRobber2(ok(DP.parseRobber2({ values: h }, std)), std).summary.result).toBe(h.length === 1 ? h[0] : Math.max(line(h.slice(0, -1)), line(h.slice(1))));
      const cost = ints(r, 2 + Math.floor(r() * 9), 0, 30);
      const f = (i: number): number => (i < 2 ? cost[i]! : cost[i]! + Math.min(f(i - 1), f(i - 2)));
      expect(DP.runClimb(ok(DP.parseClimb({ values: cost }, std)), std).summary.result).toBe(Math.min(f(cost.length - 1), f(cost.length - 2)));
      const v = ints(r, 1 + Math.floor(r() * 10), -4, 4);
      let best = -Infinity;
      for (let i = 0; i < v.length; i++) { let p = 1; for (let j = i; j < v.length; j++) { p *= v[j]!; best = Math.max(best, p); } }
      expect(DP.runProduct(ok(DP.parseProduct({ values: v }, std)), std).summary.result).toBe(best);
      const d = ints(r, 1 + Math.floor(r() * 10), 0, 9);
      const dec = (i: number): number => (i === d.length ? 1 : d[i] === 0 ? 0 : dec(i + 1) + (i + 1 < d.length && d[i]! * 10 + d[i + 1]! <= 26 ? dec(i + 2) : 0));
      expect(DP.runDecode(ok(DP.parseDecode({ values: d }, std)), std).summary.result).toBe(dec(0));
    }
  });
  it("worst cases fit the lite step budget", () => {
    for (const t of [
      DP.runPaths({ rows: 8, cols: 8 }, lite),
      DP.runWays({ values: [1, 2, 3, 4, 5, 6, 7, 8], amount: 20 }, lite),
      DP.runSubsetDp({ values: [1, 1, 1, 1, 1, 1, 1, 1], target: 30 }, lite),
      DP.runRobber2({ values: [1, 2, 3, 4, 5, 6, 7, 8] }, lite),
      DP.runClimb({ values: [1, 2, 3, 4, 5, 6, 7, 8] }, lite),
      DP.runProduct({ values: [1, -2, 3, -4, 1, 2, 3, 4] }, lite),
      DP.runDecode({ values: [1, 1, 1, 1, 1, 1, 1, 1] }, lite),
    ]) expect(t.steps.length).toBeLessThanOrEqual(lite.maxSteps);
    expect(DP.runWays({ values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], amount: 20 }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(DP.runSubsetDp({ values: new Array<number>(15).fill(1), target: 30 }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
  });
});
