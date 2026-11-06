import { describe, expect, it } from "vitest";
import { assertValidTrace, validateTrace, type ExecutionTrace } from "@algovision/trace-schema";
import { LIMIT_PROFILES, TraceLimitError, getAlgorithm } from "../src";
import { arrayStates, readVectors } from "./helpers";

const limits = LIMIT_PROFILES.standard;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runEntry(id: string, input: Record<string, unknown>, profile = limits): ExecutionTrace {
  const entry = getAlgorithm(id)!;
  const parsed = entry.definition.parseInput(input, profile);
  if (!parsed.ok) throw new Error(`invalid input: ${JSON.stringify(parsed)}`);
  return entry.definition.run(parsed.value, profile);
}

const anchors = (t: ExecutionTrace) => t.steps.map((s) => (s.source.kind === "anchor" ? s.source.id : "?"));
const randInts = (rand: () => number, n: number, span = 20) =>
  Array.from({ length: n }, () => Math.floor(rand() * (2 * span + 1)) - span);


for (const id of ["linear-search", "binary-search", "bubble-sort", "selection-sort", "insertion-sort"]) {
  describe(`${id}: shared contract`, () => {
    const entry = getAlgorithm(id)!;
    const withTarget = (input: { values: number[] }): Record<string, unknown> =>
      id.endsWith("search") ? { ...input, target: -1 } : input;
    for (const v of readVectors(id)) {
      it(`${v.name}: valid trace, result equals the reference`, () => {
        const trace = runEntry(id, v.input);
        const result = validateTrace(trace, { maxSteps: limits.maxSteps });
        expect(result.ok ? [] : result.issues).toEqual([]);
        expect(trace.summary.result).toEqual(v.expected);
        expect(() => assertValidTrace(JSON.parse(JSON.stringify(trace)))).not.toThrow();
      });
    }

    it("does not mutate its input and is deterministic", () => {
      const input = { ...entry.content.meta.defaultInput };
      const frozen = JSON.stringify(input);
      const a = runEntry(id, input);
      const b = runEntry(id, input);
      expect(JSON.stringify(input)).toBe(frozen);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });

    it("rejects arrays longer than the profile allows, and out-of-range values", () => {
      const tooLong = Array.from({ length: LIMIT_PROFILES.lite.maxArrayLength + 1 }, (_, i) => i);
      expect(entry.definition.parseInput(withTarget({ values: tooLong }), LIMIT_PROFILES.lite).ok).toBe(false);
      expect(entry.definition.parseInput(withTarget({ values: [1000] }), limits).ok).toBe(false);
    });

    it("throws TraceLimitError when the step budget is too small", () => {
      const input = withTarget({ values: [5, 6, 7, 8, 9] });
      expect(() => runEntry(id, input, { ...limits, maxSteps: 2 })).toThrow(TraceLimitError);
    });

    it("maximum-size input stays inside the step budget", () => {
      const values = Array.from({ length: limits.maxArrayLength }, (_, i) => limits.maxArrayLength - i);
      const sorted = id === "binary-search" ? [...values].reverse() : values;
      const trace = runEntry(id, withTarget({ values: sorted }));
      expect(trace.steps.length).toBeLessThanOrEqual(limits.maxSteps);
    });
  });
}

describe("linear-search", () => {
  it("random inputs agree with indexOf and visit cells in order", () => {
    const rand = mulberry32(11);
    for (let k = 0; k < 300; k++) {
      const values = randInts(rand, Math.floor(rand() * 16), 6);
      const target = Math.floor(rand() * 13) - 6;
      const trace = runEntry("linear-search", { values, target });
      expect(trace.summary.result).toBe(values.indexOf(target));
      const compares = anchors(trace).filter((a) => a === "compare").length;
      const expected = values.indexOf(target) === -1 ? values.length : values.indexOf(target) + 1;
      expect(compares).toBe(expected);
      const last = anchors(trace).at(-1);
      expect(last).toBe(values.indexOf(target) === -1 ? "not-found" : "found");
      for (const s of arrayStates(trace)) expect(s.values).toEqual(values);
    }
  });
});

describe("binary-search", () => {
  it("random sorted inputs agree with a reference and the target stays inside the window", () => {
    const rand = mulberry32(23);
    for (let k = 0; k < 300; k++) {
      const values = [...new Set(randInts(rand, Math.floor(rand() * 16), 30))].sort((a, b) => a - b);
      const target = Math.floor(rand() * 71) - 35;
      const trace = runEntry("binary-search", { values, target });
      const idx = values.indexOf(target);
      expect(trace.summary.result).toBe(idx);
      const states = arrayStates(trace);
      for (const s of states) {
        const { low, high } = s.pointers;
        if (low !== null && low !== undefined && high !== null && high !== undefined && idx !== -1) {
          expect(low).toBeLessThanOrEqual(idx);
          expect(high).toBeGreaterThanOrEqual(idx);
        }
      }
      // O(log n) comparisons
      const compares = anchors(trace).filter((a) => a === "compare").length;
      expect(compares).toBeLessThanOrEqual(Math.floor(Math.log2(values.length || 1)) + 1);
    }
  });

  it("rejects unsorted input with the ascending-order message", () => {
    const parsed = getAlgorithm("binary-search")!.definition.parseInput({ values: [3, 1, 2], target: 1 }, limits);
    expect(parsed.ok).toBe(false);
    expect(JSON.stringify(parsed)).toContain("ascending order");
  });

  it("the window shrinks every iteration", () => {
    const trace = runEntry("binary-search", { values: [1, 3, 5, 7, 9, 11], target: 11 });
    const sizes = arrayStates(trace)
      .filter((_, i) => anchors(trace)[i] === "mid")
      .map((s) => s.pointers.high! - s.pointers.low! + 1);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]!).toBeLessThan(sizes[i - 1]!);
  });
});

describe("bubble-sort", () => {
  it("random inputs agree with Array.sort and every step keeps a permutation", () => {
    const rand = mulberry32(37);
    for (let k = 0; k < 300; k++) {
      const values = randInts(rand, Math.floor(rand() * 16), 8);
      const trace = runEntry("bubble-sort", { values });
      const reference = [...values].sort((a, b) => a - b);
      expect(trace.summary.result).toEqual(reference);
      for (const s of arrayStates(trace)) expect([...s.values].sort((a, b) => a - b)).toEqual(reference);
      expect(arrayStates(trace).at(-1)!.values).toEqual(reference);
    }
  });

  it("swap steps change exactly the compared pair and only when out of order", () => {
    const trace = runEntry("bubble-sort", { values: [4, 3, 2, 1] });
    const states = arrayStates(trace);
    const names = anchors(trace);
    names.forEach((a, i) => {
      if (a !== "swap") return;
      const before = states[i - 1]!.values;
      const after = states[i]!.values;
      const diff = after.map((x, k) => (x !== before[k] ? k : -1)).filter((k) => k >= 0);
      expect(diff).toHaveLength(2);
      expect(diff[1]! - diff[0]!).toBe(1);
      expect(before[diff[0]!]!).toBeGreaterThan(before[diff[1]!]!);
    });
    expect(names.filter((a) => a === "swap")).toHaveLength(6);
  });

  it("an already sorted array performs no swaps", () => {
    expect(anchors(runEntry("bubble-sort", { values: [1, 2, 3, 4] }))).not.toContain("swap");
  });
});
