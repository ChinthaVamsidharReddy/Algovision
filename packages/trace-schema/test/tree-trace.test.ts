import { describe, expect, it } from "vitest";
import { nodeRef, TRACE_SCHEMA_VERSION, validateTrace, type ExecutionTrace } from "../src";

const nodes = [
  { id: "t1", value: 5, left: "t2", right: "t3" },
  { id: "t2", value: 3, left: null, right: null },
  { id: "t3", value: 8, left: null, right: null },
];

function trace(event: Record<string, unknown>, state: Record<string, unknown> = {}): ExecutionTrace {
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    algorithmId: "binary-tree-inorder",
    stateKind: "tree",
    input: {},
    steps: [
      {
        index: 0,
        event,
        source: { kind: "anchor", id: "entry" },
        explanation: "A step.",
        variables: [],
        state: { kind: "tree", nodes, root: "t1", current: "t1", callStack: ["t1"], output: [], ...state },
        changed: [],
        highlights: [],
      },
    ],
    summary: { time: "O(n)", space: "O(h)", result: [] },
  } as unknown as ExecutionTrace;
}
const issues = (t: unknown) => {
  const r = validateTrace(t);
  return r.ok ? [] : r.issues.map((i) => i.message).join(" | ");
};

describe("tree traces", () => {
  it("accepts calls, returns on empty subtrees and visits", () => {
    expect(validateTrace(trace({ type: "call", node: "t1" })).ok).toBe(true);
    expect(validateTrace(trace({ type: "call", node: null }, { callStack: ["t1", null], current: null })).ok).toBe(true);
    expect(validateTrace(trace({ type: "return", node: null }, { callStack: ["t1"] })).ok).toBe(true);
    expect(validateTrace(trace({ type: "visit", element: nodeRef("t1") }, { output: [3, 5] })).ok).toBe(true);
  });

  it("a call must match the top of the call stack", () => {
    expect(issues(trace({ type: "call", node: "t2" }))).toMatch(/top of the call stack/);
  });

  it("a visit must append the node's value to the output", () => {
    expect(issues(trace({ type: "visit", element: nodeRef("t1") }, { output: [3] }))).toMatch(/last item of the output/);
  });

  it("rejects structural problems: missing child, shared child, unreachable node, cycle", () => {
    const bad = (n: unknown) => issues(trace({ type: "init" }, { nodes: n }));
    expect(bad([{ id: "t1", value: 1, left: "zz", right: null }])).toMatch(/missing node "zz"/);
    expect(bad([{ id: "t1", value: 1, left: "t2", right: "t2" }, { id: "t2", value: 2, left: null, right: null }])).toMatch(/more than one parent/);
    expect(bad([{ id: "t1", value: 1, left: null, right: null }, { id: "t2", value: 2, left: null, right: null }])).toMatch(/reachable/);
    expect(bad([{ id: "t1", value: 1, left: "t2", right: null }, { id: "t2", value: 2, left: "t1", right: null }])).toMatch(/root cannot be a child|reachable/);
  });

  it("rejects call stacks and pointers that reference missing nodes, and foreign events", () => {
    expect(issues(trace({ type: "init" }, { callStack: ["nope"] }))).toMatch(/missing node "nope"/);
    expect(issues(trace({ type: "init" }, { current: "nope" }))).toMatch(/missing node "nope"/);
    expect(issues(trace({ type: "push", element: nodeRef("t1") }))).toMatch(/cannot use the "push" event/);
  });

  it("an empty tree is valid", () => {
    expect(validateTrace(trace({ type: "init" }, { nodes: [], root: null, current: null, callStack: [] })).ok).toBe(true);
  });
});
