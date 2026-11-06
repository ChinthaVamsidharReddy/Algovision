import { describe, expect, it } from "vitest";
import { indexRef, nodeRef, TRACE_SCHEMA_VERSION, validateTrace, type ExecutionTrace } from "../src";

function arrayTrace(overrides: Record<string, unknown> = {}, stepOverrides: Record<string, unknown> = {}): ExecutionTrace {
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    algorithmId: "linear-search",
    stateKind: "array",
    input: { values: [4, 8, 15], target: 8 },
    steps: [
      {
        index: 0,
        event: { type: "compare", a: indexRef(0), b: indexRef(1) },
        source: { kind: "anchor", id: "compare" },
        explanation: "Compare the first two cells.",
        variables: [{ name: "i", value: 0, changed: true }],
        state: { kind: "array", values: [4, 8, 15], pointers: { i: 0 } },
        changed: [],
        highlights: [{ target: indexRef(0), role: "active" }],
        ...stepOverrides,
      },
    ],
    summary: { time: "O(n)", space: "O(1)", result: 1 },
    ...overrides,
  } as ExecutionTrace;
}

const issuesOf = (trace: unknown) => {
  const r = validateTrace(trace);
  return r.ok ? [] : r.issues.map((i) => i.message);
};

describe("array traces", () => {
  it("accepts a valid array trace", () => {
    expect(validateTrace(arrayTrace()).ok).toBe(true);
  });

  it("rejects an out-of-range pointer", () => {
    const t = arrayTrace({}, { state: { kind: "array", values: [1, 2], pointers: { i: 2 } } });
    expect(issuesOf(t).join()).toMatch(/pointer index 2 is outside the array/);
  });

  it("allows null pointers", () => {
    const t = arrayTrace({}, { state: { kind: "array", values: [1, 2], pointers: { high: null } } });
    expect(validateTrace(t).ok).toBe(true);
  });

  it("rejects negative or fractional indices structurally", () => {
    expect(issuesOf(arrayTrace({}, { state: { kind: "array", values: [1], pointers: { i: -1 } } })).length).toBeGreaterThan(0);
    expect(issuesOf(arrayTrace({}, { state: { kind: "array", values: [1.5], pointers: {} } })).length).toBeGreaterThan(0);
  });

  it("rejects out-of-range highlight, changed and event references", () => {
    expect(issuesOf(arrayTrace({}, { highlights: [{ target: indexRef(3), role: "active" }] })).join()).toMatch(/index 3 is outside/);
    expect(issuesOf(arrayTrace({}, { changed: [indexRef(9)] })).join()).toMatch(/index 9 is outside/);
    expect(issuesOf(arrayTrace({}, { event: { type: "swap", a: indexRef(0), b: indexRef(5) } })).join()).toMatch(/index 5 is outside/);
    expect(issuesOf(arrayTrace({}, { event: { type: "found", element: indexRef(7) } })).join()).toMatch(/index 7 is outside/);
  });

  it("rejects node references in an array trace", () => {
    expect(issuesOf(arrayTrace({}, { highlights: [{ target: nodeRef("n1"), role: "active" }] })).join()).toMatch(/only reference cells by index/);
  });

  it("keeps linked-list traces and array traces distinct by stateKind", () => {
    const wrong = arrayTrace({ stateKind: "linkedList" });
    expect(validateTrace(wrong).ok).toBe(false);
  });
});
