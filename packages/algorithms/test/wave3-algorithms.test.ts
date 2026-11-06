import { describe, expect, it } from "vitest";
import { validateTrace, type ExecutionTrace } from "@algovision/trace-schema";
import { LIMIT_PROFILES, TraceLimitError, getAlgorithm } from "../src";
import { arrayStates, listStates, readVectors } from "./helpers";

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
function run(id: string, input: Record<string, unknown>, profile = limits): ExecutionTrace {
  const entry = getAlgorithm(id)!;
  const parsed = entry.definition.parseInput(input, profile);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed));
  return entry.definition.run(parsed.value, profile);
}
const anchors = (t: ExecutionTrace) => t.steps.map((s) => (s.source.kind === "anchor" ? s.source.id : "?"));
const sortedCopy = (v: number[]) => [...v].sort((a, b) => a - b);
const randInts = (rand: () => number, n: number) => Array.from({ length: n }, () => Math.floor(rand() * 21) - 10);
const inversions = (v: number[]) => v.reduce((c, x, i) => c + v.slice(i + 1).filter((y) => y < x).length, 0);

describe("selection-sort", () => {
  const ID = "selection-sort";
  it("random inputs: sorted result, n(n-1)/2 compares, one swap step per pass, permutation at every step", () => {
    const rand = mulberry32(5);
    for (let k = 0; k < 300; k++) {
      const values = randInts(rand, Math.floor(rand() * 16));
      const trace = run(ID, { values });
      const names = anchors(trace);
      const n = values.length;
      expect(trace.summary.result).toEqual(sortedCopy(values));
      expect(names.filter((a) => a === "compare")).toHaveLength((n * (n - 1)) / 2);
      expect(names.filter((a) => a === "swap")).toHaveLength(Math.max(0, n - 1));
      for (const s of arrayStates(trace)) expect(sortedCopy(s.values)).toEqual(sortedCopy(values));
    }
  });

  it("after pass i the prefix 0..i holds the i+1 smallest values in order", () => {
    const values = [64, 25, 12, 22, 11, 90, 3];
    const trace = run(ID, { values });
    const states = arrayStates(trace);
    const names = anchors(trace);
    let pass = 0;
    names.forEach((a, i) => {
      if (a !== "swap") return;
      expect(states[i]!.values.slice(0, pass + 1)).toEqual(sortedCopy(values).slice(0, pass + 1));
      pass++;
    });
    expect(pass).toBe(values.length - 1);
  });

  it("a swap with itself changes nothing and reports no changed cells", () => {
    const trace = run(ID, { values: [1, 2, 3] });
    const swaps = trace.steps.filter((s) => s.source.kind === "anchor" && s.source.id === "swap");
    for (const s of swaps) expect(s.changed).toEqual([]);
  });
});

describe("insertion-sort", () => {
  const ID = "insertion-sort";
  it("random inputs: sorted result, shifts equal the number of inversions, permutation at pass boundaries", () => {
    const rand = mulberry32(9);
    for (let k = 0; k < 300; k++) {
      const values = randInts(rand, Math.floor(rand() * 16));
      const trace = run(ID, { values });
      const names = anchors(trace);
      const states = arrayStates(trace);
      expect(trace.summary.result).toEqual(sortedCopy(values));
      expect(names.filter((a) => a === "shift")).toHaveLength(inversions(values));
      expect(names.filter((a) => a === "insert")).toHaveLength(Math.max(0, values.length - 1));
      names.forEach((a, i) => {
        if (a === "insert" || a === "outer-loop" || a === "finish" || a === "entry") {
          expect(sortedCopy(states[i]!.values)).toEqual(sortedCopy(values));
        }
        if (a === "insert") {
          const idx = Number(trace.steps[i]!.variables.find((v) => v.name === "i")!.value);
          const prefix = states[i]!.values.slice(0, idx + 1);
          expect(prefix).toEqual(sortedCopy(prefix));
        }
      });
    }
  });

  it("an already sorted array needs no shifts", () => {
    expect(anchors(run(ID, { values: [1, 2, 3, 4] }))).not.toContain("shift");
  });

  it("reversed input shifts n(n-1)/2 times and ends the inner loop with j off the left edge", () => {
    const trace = run(ID, { values: [4, 3, 2, 1] });
    expect(anchors(trace).filter((a) => a === "shift")).toHaveLength(6);
    expect(arrayStates(trace).some((s) => s.pointers.j === null)).toBe(true);
  });
});

describe("linked-list-insert-tail", () => {
  const ID = "linked-list-insert-tail";
  const chain = (t: ExecutionTrace, at: number) => {
    const s = listStates(t)[at]!;
    const byId = new Map(s.nodes.map((n) => [n.id, n]));
    const out: number[] = [];
    for (let id = s.head; id !== null; id = byId.get(id)!.next) out.push(byId.get(id)!.value);
    return out;
  };

  for (const v of readVectors(ID)) {
    it(`${v.name}: valid trace and final list equals the reference`, () => {
      const trace = run(ID, v.input);
      const r = validateTrace(trace, { maxSteps: limits.maxSteps });
      expect(r.ok ? [] : r.issues).toEqual([]);
      expect(trace.summary.result).toEqual(v.expected);
      expect(chain(trace, trace.steps.length - 1)).toEqual(v.expected);
    });
  }

  it("random lists: appended at the end, one hop per existing node, new node detached until link-tail", () => {
    const rand = mulberry32(13);
    for (let k = 0; k < 300; k++) {
      const values = randInts(rand, Math.floor(rand() * 16));
      const value = Math.floor(rand() * 21) - 10;
      const trace = run(ID, { values, value });
      const names = anchors(trace);
      expect(trace.summary.result).toEqual([...values, value]);
      expect(names.filter((a) => a === "advance")).toHaveLength(Math.max(0, values.length - 1));
      expect(names.filter((a) => a === "loop")).toHaveLength(values.length);
      const linkAt = names.indexOf("link-tail");
      const setAt = names.indexOf("set-head");
      if (values.length === 0) {
        expect(setAt).toBeGreaterThan(-1);
        expect(linkAt).toBe(-1);
      } else {
        for (let i = 0; i < linkAt; i++) expect(chain(trace, i)).toEqual(values);
        expect(chain(trace, linkAt)).toEqual([...values, value]);
        expect(setAt).toBe(-1);
      }
    }
  });

  it("is deterministic, does not mutate input and respects limits", () => {
    const input = { values: [3, 5, 8], value: 1 };
    const frozen = JSON.stringify(input);
    expect(JSON.stringify(run(ID, input))).toBe(JSON.stringify(run(ID, input)));
    expect(JSON.stringify(input)).toBe(frozen);
    expect(() => run(ID, input, { ...limits, maxSteps: 4 })).toThrow(TraceLimitError);
    const worst = run(ID, { values: Array.from({ length: 15 }, (_, i) => i), value: 99 });
    expect(worst.steps.length).toBe(2 * 15 + 5);
    expect(getAlgorithm(ID)!.definition.parseInput({ values: Array(16).fill(1), value: 1 }, limits).ok).toBe(false);
  });
});
