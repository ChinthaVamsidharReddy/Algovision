import { describe, expect, it } from "vitest";
import { LIMIT_PROFILES, getAlgorithm } from "../src";
import { arrayStates } from "./helpers";

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
const run = (id: string, input: Record<string, unknown>) => {
  const e = getAlgorithm(id)!;
  const p = e.definition.parseInput(input, limits);
  if (!p.ok) throw new Error(JSON.stringify(p));
  return e.definition.run(p.value as never, limits);
};
const parse = (id: string, input: Record<string, unknown>) => getAlgorithm(id)!.definition.parseInput(input, limits);
const ints = (r: () => number, n: number, lo = -20, hi = 20) => Array.from({ length: n }, () => lo + Math.floor(r() * (hi - lo + 1)));
const asc = (a: number[]) => [...a].sort((x, y) => x - y);
const SORTS = ["merge-sort", "quick-sort", "heap-sort", "shell-sort"];

describe("wave A sorts", () => {
  for (const id of [...SORTS, "counting-sort"]) {
    it(`${id}: random arrays end sorted and the final state equals the result`, () => {
      const r = rng(id.length * 101);
      for (let k = 0; k < 150; k++) {
        const values = id === "counting-sort" ? ints(r, Math.floor(r() * 16), 0, 20) : ints(r, Math.floor(r() * 16));
        const t = run(id, { values });
        expect(t.summary.result).toEqual(asc(values));
        if (t.steps.length > 0) expect(arrayStates(t).at(-1)!.values).toEqual(asc(values));
      }
    });
  }
  for (const id of SORTS) {
    // Shell sort holds one value aside in `temp`, so cells briefly repeat a value; the others only swap or buffer.
    if (id !== "shell-sort") it(`${id}: the multiset of values is preserved at every step`, () => {
      const r = rng(id.length * 7);
      for (let k = 0; k < 60; k++) {
        const values = ints(r, 1 + Math.floor(r() * 15));
        const want = asc(values);
        for (const s of arrayStates(run(id, { values }))) expect(asc([...s.values])).toEqual(want);
      }
    });
    it(`${id}: worst-case 15 values (ascending, descending, all equal) stays within maxSteps`, () => {
      const base = Array.from({ length: 15 }, (_, i) => i);
      for (const values of [base, [...base].reverse(), Array(15).fill(3)]) {
        expect(run(id, { values }).steps.length).toBeLessThanOrEqual(limits.maxSteps);
      }
    });
  }
  it("counting-sort rejects values outside 0..20 with a clear message", () => {
    expect(JSON.stringify(parse("counting-sort", { values: [3, 21] }))).toContain("0 to 20");
    expect(JSON.stringify(parse("counting-sort", { values: [-1] }))).toContain("0 to 20");
    expect(run("counting-sort", { values: Array(15).fill(20) }).steps.length).toBeLessThanOrEqual(limits.maxSteps);
  });
  it("merge-sort makes exactly n-1 merges", () => {
    const r = rng(5);
    for (let k = 0; k < 50; k++) {
      const values = ints(r, 1 + Math.floor(r() * 15));
      const merges = run("merge-sort", { values }).steps.filter((s) => s.source.kind === "anchor" && s.source.id === "write-back").length;
      expect(merges).toBe(values.length - 1);
    }
  });
  it("quick-sort places a pivot in its final position at every place-pivot step", () => {
    const r = rng(9);
    for (let k = 0; k < 60; k++) {
      const values = ints(r, 1 + Math.floor(r() * 15));
      const want = asc(values);
      const t = run("quick-sort", { values });
      t.steps.forEach((s, i) => {
        if (s.source.kind === "anchor" && s.source.id === "place-pivot") {
          const hl = s.highlights.find((h) => h.label === "pivot")!;
          const idx = (hl.target as { index: number }).index;
          expect(arrayStates(t)[i]!.values[idx]).toBe(want[idx]);
        }
      });
    }
  });
});

describe("wave A searches", () => {
  it("jump-search finds a valid index exactly when the value exists", () => {
    const r = rng(11);
    for (let k = 0; k < 300; k++) {
      const values = asc(ints(r, Math.floor(r() * 16), -10, 10));
      const target = ints(r, 1, -11, 11)[0]!;
      const res = run("jump-search", { values, target }).summary.result as number;
      if (values.includes(target)) expect(values[res]).toBe(target);
      else expect(res).toBe(-1);
    }
  });
  it("binary-search-first-occurrence equals indexOf on sorted arrays with duplicates", () => {
    const r = rng(13);
    for (let k = 0; k < 400; k++) {
      const values = asc(ints(r, Math.floor(r() * 16), -4, 4));
      const target = ints(r, 1, -5, 5)[0]!;
      expect(run("binary-search-first-occurrence", { values, target }).summary.result).toBe(values.indexOf(target));
    }
  });
  it("search inputs must be sorted", () => {
    expect(JSON.stringify(parse("jump-search", { values: [3, 1], target: 1 }))).toContain("ascending");
    expect(JSON.stringify(parse("binary-search-first-occurrence", { values: [3, 1], target: 1 }))).toContain("ascending");
  });
});
