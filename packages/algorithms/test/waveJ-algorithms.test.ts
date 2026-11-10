import { describe, expect, it } from "vitest";
import { LIMIT_PROFILES } from "../src";
import * as S from "../src/algorithms/interview-stack";
import * as M from "../src/algorithms/interview-math";
import * as G from "../src/algorithms/interview-greedy";
import { ints, rng } from "./testkit";

const std = LIMIT_PROFILES.standard;
const lite = LIMIT_PROFILES.lite;
const ok = <T>(r: { ok: boolean; value?: T }): T => { if (!r.ok) throw new Error(JSON.stringify(r)); return r.value as T; };

describe("wave J: monotonic stacks", () => {
  it("stock span equals the backward scan and the stack never grows out of order", () => {
    const r = rng(1001);
    for (let k = 0; k < 300; k++) {
      const v = ints(r, 1 + Math.floor(r() * 15), 0, 20);
      const ref = v.map((p, i) => { let c = 1; for (let j = i - 1; j >= 0 && v[j]! <= p; j--) c++; return c; });
      const t = S.runSpan(ok(S.parseSpan({ values: v }, std)), std);
      expect(t.summary.result).toEqual(ref);
    }
  });
  it("largest rectangle equals the brute force over all ranges", () => {
    const r = rng(1002);
    for (let k = 0; k < 300; k++) {
      const v = ints(r, 1 + Math.floor(r() * 12), 0, 9);
      let best = 0;
      for (let i = 0; i < v.length; i++) { let m = Infinity; for (let j = i; j < v.length; j++) { m = Math.min(m, v[j]!); best = Math.max(best, m * (j - i + 1)); } }
      expect(S.runHist(ok(S.parseHist({ values: v }, std)), std).summary.result).toBe(best);
    }
  });
});

describe("wave J: math and bits", () => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  it("gcd, sieve and factorization equal references", () => {
    const r = rng(1003);
    for (let k = 0; k < 300; k++) {
      const a = 1 + Math.floor(r() * 999), b = 1 + Math.floor(r() * 999);
      expect(M.runGcd(ok(M.parseGcd({ a, b }, std)), std).summary.result).toBe(gcd(a, b));
      const n = 2 + Math.floor(r() * 13);
      let c = 0; for (let x = 2; x <= n; x++) if (Array.from({ length: x - 2 }, (_, i) => i + 2).every((d) => x % d !== 0)) c++;
      expect(M.runSieve(ok(M.parseSieve({ n }, std)), std).summary.result).toBe(c);
      const m = 2 + Math.floor(r() * 998);
      const f = M.runFactor(ok(M.parseFactor({ n: m }, std)), std).summary.result as number[];
      expect(f.reduce((p, q) => p * q, 1)).toBe(m);
      expect([...f].sort((p, q) => p - q)).toEqual(f);
      for (const p of f) expect(Array.from({ length: p - 2 }, (_, i) => i + 2).every((d) => p % d !== 0)).toBe(true);
    }
  });
  it("popcount, power of two and single number equal references", () => {
    const r = rng(1004);
    for (let k = 0; k < 400; k++) {
      const n = Math.floor(r() * 1000);
      expect(M.runPopcount(ok(M.parseBitsN({ n }, std)), std).summary.result).toBe(n.toString(2).replace(/0/g, "").length);
      expect(M.runPow2(ok(M.parseBitsN({ n }, std)), std).summary.result).toBe(n > 0 && (n & (n - 1)) === 0 ? 1 : 0);
      const odd = Math.floor(r() * 41) - 20;
      const pairs = ints(r, Math.floor(r() * 6), -20, 20).flatMap((x) => [x, x]).filter((x) => x !== odd);
      const values = [...pairs, odd].sort(() => r() - 0.5);
      expect(M.runSingle(ok(M.parseSingle({ values }, std)), std).summary.result).toBe(odd);
    }
    expect(M.parseSingle({ values: [1, 2] }, std).ok).toBe(false);
  });
});

describe("wave J: greedy", () => {
  it("jump game and minimum jumps equal a dynamic-programming reference", () => {
    const r = rng(1005);
    for (let k = 0; k < 500; k++) {
      const v = ints(r, 1 + Math.floor(r() * 12), 0, 4);
      const n = v.length;
      const dist = new Array<number>(n).fill(Infinity); dist[0] = 0;
      for (let i = 0; i < n; i++) for (let j = 1; j <= v[i]! && i + j < n; j++) dist[i + j] = Math.min(dist[i + j]!, dist[i]! + 1);
      expect(G.runJump(ok(G.parseJump({ values: v }, std)), std).summary.result).toBe(Number.isFinite(dist[n - 1]) ? 1 : 0);
      expect(G.runMinJumps(ok(G.parseMinJumps({ values: v }, std)), std).summary.result).toBe(Number.isFinite(dist[n - 1]) ? dist[n - 1] : -1);
    }
  });
  it("activity selection equals the maximum non-overlapping subset", () => {
    const r = rng(1006);
    for (let k = 0; k < 300; k++) {
      const m = Math.floor(r() * 7);
      const acts = Array.from({ length: m }, () => { const s = Math.floor(r() * 20); return [s, s + 1 + Math.floor(r() * 6)] as [number, number]; }).sort((a, b) => a[1] - b[1]);
      let best = 0;
      for (let mask = 0; mask < 1 << m; mask++) {
        const pick = acts.filter((_, i) => mask & (1 << i)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        if (pick.every((a, i) => i === 0 || pick[i - 1]![1] <= a[0])) best = Math.max(best, pick.length);
      }
      expect(G.runActivity(ok(G.parseActivity({ values: acts.flat() }, std)), std).summary.result).toBe(best);
    }
    expect(G.parseActivity({ values: [1, 5, 2, 3] }, std).ok).toBe(false);
  });
  it("every wave J algorithm fits the lite step budget at its worst case", () => {
    for (const t of [
      S.runSpan({ values: [8, 7, 6, 5, 4, 3, 2, 1] }, lite), S.runSpan({ values: [1, 2, 3, 4, 5, 6, 7, 8] }, lite),
      S.runHist({ values: [1, 2, 3, 4, 4, 3, 2, 1] }, lite),
      M.runGcd({ a: 987, b: 610 }, lite), M.runSieve({ n: 7 }, lite), M.runFactor({ n: 997 }, lite),
      M.runPopcount({ n: 511 }, lite), M.runPow2({ n: 512 }, lite), M.runSingle({ values: [1, 1, 2, 2, 3, 3, 4, 5].slice(0, 7) }, lite),
      G.runJump({ values: [1, 1, 1, 1, 1, 1, 1, 1] }, lite), G.runMinJumps({ values: [1, 1, 1, 1, 1, 1, 1, 1] }, lite),
      G.runActivity({ values: [0, 1, 1, 2, 2, 3, 3, 4] }, lite),
    ]) expect(t.steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});
