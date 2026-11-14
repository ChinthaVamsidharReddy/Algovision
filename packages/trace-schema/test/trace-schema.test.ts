import { describe, expect, it } from "vitest";
import {
  assertValidTrace,
  isSupportedSchemaVersion,
  nodeRef,
  TRACE_SCHEMA_VERSION,
  validateTrace,
  type ExecutionTrace,
  type LinkedListState,
} from "../src";

/** Test traces here are linked-list traces; narrow the state union for direct edits. */
function listState(trace: ExecutionTrace): LinkedListState {
  return trace.steps[0]!.state as LinkedListState;
}

function makeTrace(): ExecutionTrace {
  const state = {
    kind: "linkedList" as const,
    nodes: [
      { id: "n1", value: 5, next: "n2" },
      { id: "n2", value: 2, next: null },
    ],
    head: "n1",
    pointers: {},
  };
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    algorithmId: "linked-list-insert-head",
    stateKind: "linkedList",
    input: { values: [5, 2], value: 7 },
    steps: [
      {
        index: 0,
        event: { type: "init" },
        source: { kind: "anchor", id: "enter" },
        explanation: "Start with the list 5 then 2.",
        variables: [{ name: "value", value: 7, changed: false }],
        state,
        changed: [],
        highlights: [{ target: nodeRef("n1"), role: "pointer", label: "head" }],
      },
      {
        index: 1,
        event: { type: "done" },
        source: { kind: "anchor", id: "return-head" },
        explanation: "Return head.",
        variables: [{ name: "value", value: 7, changed: false }],
        state,
        changed: [],
        highlights: [],
      },
    ],
    summary: { time: "O(1)", space: "O(1)", result: [5, 2] },
  };
}

describe("schema version", () => {
  it("accepts the current version and older minors of the same major", () => {
    expect(isSupportedSchemaVersion(TRACE_SCHEMA_VERSION)).toBe(true);
    expect(isSupportedSchemaVersion("1.0.7")).toBe(true);
  });

  it("rejects a newer minor, another major and garbage", () => {
    expect(isSupportedSchemaVersion("1.5.0")).toBe(false);
    expect(isSupportedSchemaVersion("2.0.0")).toBe(false);
    expect(isSupportedSchemaVersion("1.0")).toBe(false);
    expect(isSupportedSchemaVersion("")).toBe(false);
  });
});

describe("validateTrace", () => {
  it("accepts a well-formed trace", () => {
    const result = validateTrace(makeTrace());
    expect(result.ok).toBe(true);
  });

  it("round-trips through JSON without changing", () => {
    const original = makeTrace();
    const result = validateTrace(JSON.parse(JSON.stringify(original)));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.trace).toEqual(original);
  });

  it("rejects non-contiguous step indices", () => {
    const trace = makeTrace();
    trace.steps[1]!.index = 5;
    const result = validateTrace(trace);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]).toMatchObject({ step: 1, path: "steps.1.index" });
  });

  it("rejects an unsupported schema version", () => {
    const trace = makeTrace();
    trace.schemaVersion = "2.0.0";
    const result = validateTrace(trace);
    expect(result.ok).toBe(false);
  });

  it("rejects an empty explanation", () => {
    const trace = makeTrace();
    trace.steps[0]!.explanation = "   ";
    expect(validateTrace(trace).ok).toBe(false);
  });

  it("rejects unknown fields (typos must not pass silently)", () => {
    const trace = makeTrace() as unknown as Record<string, unknown>;
    trace["extra"] = true;
    expect(validateTrace(trace).ok).toBe(false);
  });

  it("rejects a node that points at a missing node", () => {
    const trace = makeTrace();
    listState(trace).nodes[1]!.next = "ghost";
    const result = validateTrace(trace);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.message.includes("ghost"))).toBe(true);
  });

  it("rejects a head that points at a missing node", () => {
    const trace = makeTrace();
    listState(trace).head = "ghost";
    expect(validateTrace(trace).ok).toBe(false);
  });

  it("rejects duplicate node ids", () => {
    const trace = makeTrace();
    listState(trace).nodes[1]!.id = "n1";
    listState(trace).nodes[0]!.next = null;
    expect(validateTrace(trace).ok).toBe(false);
  });

  it("rejects cycles in the next pointers", () => {
    const trace = makeTrace();
    listState(trace).nodes[1]!.next = "n1";
    const result = validateTrace(trace);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.message.includes("cycle"))).toBe(true);
  });

  it("rejects highlights and changed refs to nodes that do not exist", () => {
    const trace = makeTrace();
    trace.steps[0]!.highlights.push({ target: nodeRef("nope"), role: "active" });
    trace.steps[0]!.changed.push(nodeRef("nope2"));
    const result = validateTrace(trace);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects index references in a linked list trace", () => {
    const trace = makeTrace();
    trace.steps[0]!.changed.push({ kind: "index", index: 0 });
    expect(validateTrace(trace).ok).toBe(false);
  });

  it("rejects duplicate variable names within a step", () => {
    const trace = makeTrace();
    trace.steps[0]!.variables.push({ name: "value", value: 1, changed: true });
    expect(validateTrace(trace).ok).toBe(false);
  });

  it("enforces the configurable step limit", () => {
    const trace = makeTrace();
    expect(validateTrace(trace, { maxSteps: 1 }).ok).toBe(false);
    expect(validateTrace(trace, { maxSteps: 2 }).ok).toBe(true);
  });

  it("rejects a trace with no steps", () => {
    const trace = makeTrace();
    trace.steps = [];
    expect(validateTrace(trace).ok).toBe(false);
  });

  it("rejects a link event whose source node is missing", () => {
    const trace = makeTrace();
    trace.steps[0]!.event = { type: "link", from: "ghost", to: null };
    expect(validateTrace(trace).ok).toBe(false);
  });

  it("rejects an event type outside the closed vocabulary", () => {
    const trace = makeTrace() as unknown as { steps: { event: unknown }[] };
    trace.steps[0]!.event = { type: "teleport" };
    expect(validateTrace(trace).ok).toBe(false);
  });
});

describe("assertValidTrace", () => {
  it("returns the trace when valid and throws a readable error when not", () => {
    expect(assertValidTrace(makeTrace()).steps).toHaveLength(2);
    const broken = makeTrace();
    broken.steps[1]!.index = 9;
    expect(() => assertValidTrace(broken)).toThrow(/Invalid execution trace/);
  });
});
