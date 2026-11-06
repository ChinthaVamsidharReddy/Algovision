import { describe, expect, it } from "vitest";
import { validateTrace, assertValidTrace } from "@algovision/trace-schema";
import { LIMIT_PROFILES, TraceLimitError, linkedListInsertHead as def, getAlgorithm } from "../src";
import { finalList, listStates, readVectors } from "./helpers";

const ID = "linked-list-insert-head";
const limits = LIMIT_PROFILES.standard;
const vectors = readVectors(ID);

describe(`${ID}: executor`, () => {
  for (const v of vectors) {
    describe(v.name, () => {
      const parsed = def.parseInput(v.input, limits);
      if (!parsed.ok) throw new Error("vector must be valid input");
      const trace = def.run(parsed.value, limits);

      it("trace passes schema and semantic validation", () => {
        const result = validateTrace(trace, { maxSteps: limits.maxSteps });
        expect(result.ok ? [] : result.issues).toEqual([]);
        expect(result.ok).toBe(true);
      });

      it("final state matches the reference list", () => {
        expect(finalList(trace)).toEqual(v.expected);
        expect(trace.summary.result).toEqual(v.expected);
      });

      it("keeps the structural invariants", () => {
        const states = listStates(trace);
        const first = states[0]!;
        const last = states[states.length - 1]!;
        expect(last.nodes).toHaveLength(first.nodes.length + 1);
        const newest = last.nodes[last.nodes.length - 1]!;
        expect(last.head).toBe(newest.id);
        expect(newest.value).toBe(v.input.value as number);
        expect(newest.next).toBe(first.head);
        // existing nodes are untouched
        expect(last.nodes.slice(0, -1)).toEqual(first.nodes);
        expect(last.pointers).toEqual({});
      });

      it("follows the expected event and anchor sequence", () => {
        expect(trace.steps.map((s) => s.event.type)).toEqual(["init", "insertNode", "link", "movePointer", "done"]);
        expect(trace.steps.map((s) => (s.source.kind === "anchor" ? s.source.id : "?"))).toEqual([
          "entry",
          "create-node",
          "link-next",
          "move-head",
          "finish",
        ]);
      });

      it("the new node is detached until the link step and head moves only at move-head", () => {
        const [s0, s1, s2, s3] = listStates(trace);
        const oldHead = s0!.head;
        expect(s1!.nodes[s1!.nodes.length - 1]!.next).toBeNull();
        expect(s1!.head).toBe(oldHead);
        expect(s2!.head).toBe(oldHead);
        expect(s3!.head).not.toBe(oldHead);
      });
    });
  }

  it("does not mutate its input and is deterministic", () => {
    const input = { values: [3, 5, 8], value: 1 };
    const frozen = JSON.stringify(input);
    const a = def.run(input, limits);
    const b = def.run(input, limits);
    expect(JSON.stringify(input)).toBe(frozen);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("snapshots are independent (later steps do not rewrite earlier ones)", () => {
    const trace = def.run({ values: [3, 5], value: 1 }, limits);
    const states = listStates(trace);
    expect(states[0]!.nodes).toHaveLength(2);
    expect(states[0]!.head).toBe("n1");
    expect(states[1]!.nodes[2]!.next).toBeNull();
  });

  it("round-trips through JSON and still validates", () => {
    const trace = def.run({ values: [3, 5, 8], value: 1 }, limits);
    expect(() => assertValidTrace(JSON.parse(JSON.stringify(trace)))).not.toThrow();
  });

  it("explanations are non-empty and mention the inserted value on the first step", () => {
    const trace = def.run({ values: [3, 5, 8], value: 42 }, limits);
    for (const s of trace.steps) expect(s.explanation.trim().length).toBeGreaterThan(10);
    expect(trace.steps[0]!.explanation).toContain("42");
  });

  it("marks variables as changed only when their value changed", () => {
    const trace = def.run({ values: [3], value: 1 }, limits);
    const changed = (stepIndex: number, name: string) =>
      trace.steps[stepIndex]!.variables.find((v) => v.name === name)?.changed;
    expect(changed(0, "value")).toBe(true); // first appearance
    expect(changed(1, "value")).toBe(false);
    expect(changed(3, "head")).toBe(true); // head moved
    expect(changed(2, "head")).toBe(false);
  });

  it("throws TraceLimitError when the step budget is too small", () => {
    expect(() => def.run({ values: [1], value: 2 }, { ...limits, maxSteps: 3 })).toThrow(TraceLimitError);
  });

  it("is registered with matching content", () => {
    const entry = getAlgorithm(ID);
    expect(entry?.content.meta.id).toBe(ID);
  });

  it("maximum-size input stays well inside the step budget and runs quickly", () => {
    const input = { values: Array.from({ length: limits.maxListNodes }, (_, i) => i), value: 1 };
    const start = performance.now();
    for (let i = 0; i < 200; i++) def.run(input, limits);
    const perRun = (performance.now() - start) / 200;
    const trace = def.run(input, limits);
    expect(trace.steps.length).toBeLessThanOrEqual(limits.maxSteps);
    expect(perRun).toBeLessThan(5);
  });
});
