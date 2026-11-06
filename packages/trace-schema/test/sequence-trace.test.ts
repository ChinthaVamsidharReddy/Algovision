import { describe, expect, it } from "vitest";
import { indexRef, TRACE_SCHEMA_VERSION, validateTrace, type ExecutionTrace } from "../src";

function trace(kind: "stack" | "queue", event: Record<string, unknown>, items: number[], extra: Record<string, unknown> = {}): ExecutionTrace {
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    algorithmId: kind === "stack" ? "stack-push-pop" : "queue-enqueue-dequeue",
    stateKind: kind,
    input: {},
    steps: [
      {
        index: 0,
        event,
        source: { kind: "anchor", id: "push" },
        explanation: "A step.",
        variables: [],
        state: { kind, items },
        changed: [],
        highlights: [],
        ...extra,
      },
    ],
    summary: { time: "O(1)", space: "O(n)", result: items },
  } as unknown as ExecutionTrace;
}
const issues = (t: unknown) => {
  const r = validateTrace(t);
  return r.ok ? [] : r.issues.map((i) => i.message);
};

describe("stack traces", () => {
  it("accepts push at the top, pop at the vacated slot, and peek at the top", () => {
    expect(validateTrace(trace("stack", { type: "push", element: indexRef(1) }, [4, 7])).ok).toBe(true);
    expect(validateTrace(trace("stack", { type: "pop", element: indexRef(2) }, [4, 7])).ok).toBe(true);
    expect(validateTrace(trace("stack", { type: "peek", element: indexRef(1) }, [4, 7])).ok).toBe(true);
    expect(validateTrace(trace("stack", { type: "underflow" }, [])).ok).toBe(true);
  });

  it("rejects a push that does not point at the new top", () => {
    expect(issues(trace("stack", { type: "push", element: indexRef(0) }, [4, 7])).join()).toMatch(/must be the last one/);
  });

  it("rejects events that do not belong to stacks and node references", () => {
    expect(issues(trace("stack", { type: "enqueue", element: indexRef(0) }, [4])).join()).toMatch(/cannot use the "enqueue" event/);
    expect(issues(trace("stack", { type: "push", element: { kind: "node", id: "n1" } }, [4])).join()).toMatch(/by index/);
  });

  it("rejects references beyond the vacated slot and extra state fields", () => {
    expect(issues(trace("stack", { type: "pop", element: indexRef(5) }, [4])).join()).toMatch(/outside the stack/);
    expect(validateTrace(trace("stack", { type: "init" }, [1], { state: { kind: "stack", items: [1], pointers: {} } })).ok).toBe(false);
  });

  it("peek must look at the top", () => {
    expect(issues(trace("stack", { type: "peek", element: indexRef(0) }, [4, 7])).join()).toMatch(/peek must look at index 1/);
  });
});

describe("queue traces", () => {
  it("accepts enqueue at the rear, dequeue at the front slot, and peek at the front", () => {
    expect(validateTrace(trace("queue", { type: "enqueue", element: indexRef(1) }, [4, 7])).ok).toBe(true);
    expect(validateTrace(trace("queue", { type: "dequeue", element: indexRef(0) }, [7])).ok).toBe(true);
    expect(validateTrace(trace("queue", { type: "peek", element: indexRef(0) }, [4, 7])).ok).toBe(true);
  });

  it("peek must look at the front and push is not a queue event", () => {
    expect(issues(trace("queue", { type: "peek", element: indexRef(1) }, [4, 7])).join()).toMatch(/peek must look at index 0/);
    expect(issues(trace("queue", { type: "push", element: indexRef(0) }, [4])).join()).toMatch(/cannot use the "push" event/);
  });
});
