import { describe, expect, it } from "vitest";
import { validateTrace } from "@algovision/trace-schema";
import { LIMIT_PROFILES } from "../src";
import * as A from "../src/algorithms/interview-arrays";
import * as B from "../src/algorithms/interview-arrays-b";
import { asc, ints, rng } from "./testkit";

const std = LIMIT_PROFILES.standard;
const lite = LIMIT_PROFILES.lite;
const ok = <T>(r: { ok: boolean; value?: T }): T => { if (!r.ok) throw new Error(JSON.stringify(r)); return r.value as T; };
const check = (t: ReturnType<typeof A.runStock>) => { expect(validateTrace(t).ok ?? validateTrace(t)).toBeTruthy(); return t; };

describe("wave I: array patterns", () => {
  it("majority element equals a counting reference", () => {
    const r = rng(901);
    for (let k = 0; k < 300; k++) {
      const n = 1 + Math.floor(r() * 12);
      const m = Math.floor(r() * 9);
      const values = Array.from({ length: n }, () => (r() < 0.6 ? m : Math.floor(r() * 9)));
      const cnt = new Map<number, number>();
      values.forEach((v) => cnt.set(v, (cnt.get(v) ?? 0) + 1));
      const maj = [...cnt].find(([, c]) => c > n / 2)?.[0];
      const p = A.parseMajority({ values }, std);
      if (maj === undefined) { expect(p.ok).toBe(false); continue; }
      expect(check(A.runMajority(ok(p), std)).summary.result).toBe(maj);
    }
  });
  it("stock profit equals the brute force over all buy/sell pairs", () => {
    const r = rng(902);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, 1 + Math.floor(r() * 12), 0, 30);
      let best = 0;
      for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) best = Math.max(best, values[j]! - values[i]!);
      expect(check(A.runStock(ok(A.parseStock({ values }, std)), std)).summary.result).toBe(best);
    }
  });
  it("trapping rain water equals the prefix/suffix maximum reference", () => {
    const r = rng(903);
    for (let k = 0; k < 300; k++) {
      const h = ints(r, Math.floor(r() * 13), 0, 9);
      let w = 0;
      for (let i = 0; i < h.length; i++) w += Math.max(0, Math.min(Math.max(...h.slice(0, i + 1)), Math.max(...h.slice(i))) - h[i]!);
      expect(check(A.runRain(ok(A.parseRain({ values: h }, std)), std)).summary.result).toBe(w);
    }
  });
  it("merge intervals equals a reference merge and validates its input", () => {
    const r = rng(904);
    for (let k = 0; k < 300; k++) {
      const n = Math.floor(r() * 6);
      const starts = asc(ints(r, n, 0, 30));
      const iv = starts.map((s) => [s, s + Math.floor(r() * 8)] as [number, number]);
      const ref: number[][] = [];
      for (const [s, e] of iv) { const last = ref.at(-1); if (last && s <= last[1]!) last[1] = Math.max(last[1]!, e); else ref.push([s, e]); }
      expect(check(A.runIntervals(ok(A.parseIntervals({ values: iv.flat() }, std)), std)).summary.result).toEqual(ref.flat());
    }
    expect(A.parseIntervals({ values: [1, 2, 3] }, std).ok).toBe(false);
    expect(A.parseIntervals({ values: [5, 2] }, std).ok).toBe(false);
    expect(A.parseIntervals({ values: [4, 5, 1, 2] }, std).ok).toBe(false);
  });
  it("missing number equals the set difference", () => {
    const r = rng(905);
    for (let k = 0; k < 200; k++) {
      const n = 1 + Math.floor(r() * 10);
      const all = Array.from({ length: n + 1 }, (_, i) => i);
      const miss = Math.floor(r() * (n + 1));
      const values = all.filter((x) => x !== miss).sort(() => r() - 0.5);
      expect(check(A.runMissing(ok(A.parseMissing({ values }, std)), std)).summary.result).toBe(miss);
    }
    expect(A.parseMissing({ values: [0, 0] }, std).ok).toBe(false);
    expect(A.parseMissing({ values: [5] }, std).ok).toBe(false);
  });
  it("Floyd duplicate finder equals the repeated value", () => {
    const r = rng(906);
    for (let k = 0; k < 300; k++) {
      const n = 2 + Math.floor(r() * 10);
      const dup = 1 + Math.floor(r() * (n - 1));
      const base = Array.from({ length: n - 1 }, (_, i) => i + 1);
      const values = [...base, dup].sort(() => r() - 0.5);
      expect(check(A.runDuplicate(ok(A.parseDuplicate({ values }, std)), std)).summary.result).toBe(dup);
    }
  });
});

describe("wave I: binary search variants and permutations", () => {
  it("next permutation equals the reference and ends at the sorted array after wrap", () => {
    const r = rng(907);
    const ref = (a: number[]) => {
      const x = [...a]; let i = x.length - 2;
      while (i >= 0 && x[i]! >= x[i + 1]!) i--;
      if (i >= 0) { let j = x.length - 1; while (x[j]! <= x[i]!) j--; [x[i], x[j]] = [x[j]!, x[i]!]; }
      return [...x.slice(0, i + 1), ...x.slice(i + 1).reverse()];
    };
    for (let k = 0; k < 300; k++) {
      const values = ints(r, 1 + Math.floor(r() * 8), 0, 5);
      const t = B.runNextPerm(ok(B.parseNextPerm({ values }, std)), std);
      expect(t.summary.result).toEqual(ref(values));
      expect([...(t.summary.result as number[])].sort((p, q) => p - q)).toEqual(asc(values));
    }
    expect(B.runNextPerm({ values: [3, 2, 1] }, std).summary.result).toEqual([1, 2, 3]);
  });
  it("lower and upper bound equal the linear scans", () => {
    const r = rng(908);
    for (let k = 0; k < 400; k++) {
      const values = asc(ints(r, Math.floor(r() * 12), 0, 9));
      const target = Math.floor(r() * 12) - 1;
      let lo = values.findIndex((v) => v >= target); if (lo < 0) lo = values.length;
      let up = values.findIndex((v) => v > target); if (up < 0) up = values.length;
      expect(B.runLowerBound(ok(B.parseBound({ values, target }, std)), std).summary.result).toBe(lo);
      expect(B.runUpperBound(ok(B.parseBound({ values, target }, std)), std).summary.result).toBe(up);
    }
    expect(B.parseBound({ values: [3, 1], target: 1 }, std).ok).toBe(false);
  });
  it("rotated search equals indexOf and rejects an unrotatable array", () => {
    const r = rng(909);
    for (let k = 0; k < 400; k++) {
      const n = 1 + Math.floor(r() * 10);
      const sorted = Array.from({ length: n }, (_, i) => i * 2 + 1);
      const rot = Math.floor(r() * n);
      const values = [...sorted.slice(rot), ...sorted.slice(0, rot)];
      const target = Math.floor(r() * (2 * n + 2));
      const t = B.runRotated(ok(B.parseRotated({ values, target }, std)), std);
      expect(t.summary.result).toBe(values.indexOf(target));
    }
    expect(B.parseRotated({ values: [3, 1, 2, 0], target: 1 }, std).ok).toBe(false);
    expect(B.parseRotated({ values: [1, 1], target: 1 }, std).ok).toBe(false);
  });
  it("find peak returns a real peak", () => {
    const r = rng(910);
    for (let k = 0; k < 400; k++) {
      const n = 1 + Math.floor(r() * 12);
      const values: number[] = [];
      for (let i = 0; i < n; i++) { let v = Math.floor(r() * 20); while (i > 0 && v === values[i - 1]) v = (v + 1) % 20; values.push(v); }
      const p = B.runPeak(ok(B.parsePeak({ values }, std)), std).summary.result as number;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p === 0 || values[p]! > values[p - 1]!).toBe(true);
      expect(p === n - 1 || values[p]! > values[p + 1]!).toBe(true);
    }
  });
  it("every algorithm fits the lite profile at its worst case", () => {
    const eight = [1, 2, 3, 4, 5, 6, 7, 8];
    const desc = [...eight].reverse();
    for (const t of [
      A.runMajority({ values: [1, 1, 1, 1, 1, 1, 1, 1] }, lite),
      A.runStock({ values: desc }, lite),
      A.runRain({ values: [8, 0, 7, 0, 6, 0, 5, 0] }, lite),
      A.runIntervals({ values: [1, 2, 3, 4, 5, 6, 7, 8] }, lite),
      A.runMissing({ values: [1, 2, 3, 4, 5, 6, 7, 8] }, lite),
      A.runDuplicate({ values: [2, 3, 4, 5, 6, 7, 8, 1, 1].slice(0, 8) }, lite),
      B.runNextPerm({ values: desc }, lite),
      B.runLowerBound({ values: eight, target: 9 }, lite),
      B.runUpperBound({ values: eight, target: 0 }, lite),
      B.runRotated({ values: [5, 6, 7, 8, 1, 2, 3, 4], target: 4 }, lite),
      B.runPeak({ values: eight, }, lite),
    ]) expect(t.steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});
