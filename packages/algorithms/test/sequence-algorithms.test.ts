import { describe, expect, it } from "vitest";
import { assertValidTrace, validateTrace, type ExecutionTrace } from "@algovision/trace-schema";
import { LIMIT_PROFILES, TraceLimitError, getAlgorithm } from "../src";
import { readVectors } from "./helpers";

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

const CASES = [
  { id: "stack-push-pop", count: "pops", kind: "stack", add: "push", remove: "pop", removeAt: (size: number) => size, reference: (v: number[], c: number) => v.slice(0, Math.max(0, v.length - c)) },
  { id: "queue-enqueue-dequeue", count: "removes", kind: "queue", add: "enqueue", remove: "dequeue", removeAt: () => 0, reference: (v: number[], c: number) => v.slice(Math.min(c, v.length)) },
] as const;

function run(id: string, input: Record<string, unknown>, profile = limits): ExecutionTrace {
  const entry = getAlgorithm(id)!;
  const parsed = entry.definition.parseInput(input, profile);
  if (!parsed.ok) throw new Error(`invalid input: ${JSON.stringify(parsed)}`);
  return entry.definition.run(parsed.value, profile);
}
const items = (t: ExecutionTrace) =>
  t.steps.map((s) => {
    if (s.state.kind !== "stack" && s.state.kind !== "queue") throw new Error("wrong state kind");
    return s.state.items;
  });
const anchors = (t: ExecutionTrace) => t.steps.map((s) => (s.source.kind === "anchor" ? s.source.id : "?"));

for (const c of CASES) {
  describe(`${c.id}`, () => {
    const entry = getAlgorithm(c.id)!;

    for (const v of readVectors(c.id)) {
      it(`${v.name}: valid trace, result equals the reference`, () => {
        const trace = run(c.id, v.input);
        const result = validateTrace(trace, { maxSteps: limits.maxSteps });
        expect(result.ok ? [] : result.issues).toEqual([]);
        expect(trace.summary.result).toEqual(v.expected);
        expect(items(trace).at(-1)).toEqual(v.expected);
        expect(() => assertValidTrace(JSON.parse(JSON.stringify(trace)))).not.toThrow();
      });
    }

    it("random inputs agree with the reference and every step is a legal move", () => {
      const rand = mulberry32(c.id.length * 101);
      for (let k = 0; k < 300; k++) {
        const values = Array.from({ length: Math.floor(rand() * 16) }, () => Math.floor(rand() * 41) - 20);
        const count = Math.floor(rand() * 16);
        const trace = run(c.id, { values, [c.count]: count });
        expect(trace.summary.result).toEqual(c.reference(values, count));
        const states = items(trace);
        const names = anchors(trace);
        names.forEach((a, i) => {
          if (a === c.add) {
            expect(states[i]!.length).toBe(states[i - 1]!.length + 1);
            expect(states[i]!.slice(0, -1)).toEqual(states[i - 1]);
          }
          if (a === c.remove) {
            expect(states[i]!.length).toBe(states[i - 1]!.length - 1);
          }
          if (a === "underflow") expect(states[i]).toEqual([]);
        });
        // an underflow can only happen when more removals were asked for than items exist
        expect(names.includes("underflow")).toBe(count > values.length);
        // underflow ends the run
        if (names.includes("underflow")) expect(names.at(-2)).toBe("underflow");
        expect(names.at(-1)).toBe("finish");
      }
    });

    it("keeps first-in-first-out / last-in-first-out order", () => {
      const trace = run(c.id, { values: [1, 2, 3, 4], [c.count]: 1 });
      const removed = trace.steps.find((s) => s.source.kind === "anchor" && s.source.id === c.remove)!;
      const popped = removed.variables.find((v) => v.name === (c.kind === "stack" ? "popped" : "dequeued"))!.value;
      expect(popped).toBe(c.kind === "stack" ? 4 : 1);
    });

    it("does not mutate its input and is deterministic", () => {
      const input = { ...entry.content.meta.defaultInput };
      const frozen = JSON.stringify(input);
      expect(JSON.stringify(run(c.id, input))).toBe(JSON.stringify(run(c.id, input)));
      expect(JSON.stringify(input)).toBe(frozen);
    });

    it("rejects bad counts, too many values and out-of-range values", () => {
      const p = (input: Record<string, unknown>, profile = limits) => entry.definition.parseInput(input, profile);
      expect(p({ values: [1], [c.count]: -1 }).ok).toBe(false);
      expect(p({ values: [1], [c.count]: 1.5 }).ok).toBe(false);
      expect(p({ values: [1], [c.count]: limits.maxArrayLength + 1 }).ok).toBe(false);
      expect(p({ values: Array(LIMIT_PROFILES.lite.maxArrayLength + 1).fill(1), [c.count]: 0 }, LIMIT_PROFILES.lite).ok).toBe(false);
      expect(p({ values: [1000], [c.count]: 0 }).ok).toBe(false);
      expect(p({ values: [1], [c.count]: 0, extra: 1 }).ok).toBe(false);
    });

    it("throws TraceLimitError when the step budget is too small", () => {
      expect(() => run(c.id, { values: [1, 2, 3], [c.count]: 1 }, { ...limits, maxSteps: 2 })).toThrow(TraceLimitError);
    });

    it("maximum-size input stays inside the step budget", () => {
      const trace = run(c.id, { values: Array.from({ length: 15 }, (_, i) => i), [c.count]: 15 });
      expect(trace.steps.length).toBeLessThanOrEqual(limits.maxSteps);
      expect(trace.steps.length).toBe(1 + 15 + 30 + 1);
    });
  });
}
