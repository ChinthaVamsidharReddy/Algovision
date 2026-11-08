import { describe, expect, it } from "vitest";
import { isSupportedSchemaVersion, nodeRef, TRACE_SCHEMA_VERSION, validateTrace, type ExecutionTrace } from "../src";

const nodes = [0, 1, 2].map((i) => ({ id: `g${i}`, value: i }));
const edges = [
  { from: "g0", to: "g1", weight: null },
  { from: "g1", to: "g2", weight: null },
];

function trace(event: Record<string, unknown>, state: Record<string, unknown> = {}, extra: Record<string, unknown> = {}): ExecutionTrace {
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    algorithmId: "bfs-traversal",
    stateKind: "graph",
    input: {},
    steps: [
      {
        index: 0,
        event,
        source: { kind: "anchor", id: "entry" },
        explanation: "A step.",
        variables: [],
        state: { kind: "graph", directed: false, nodes, edges, current: "g0", activeEdge: null, frontier: [], frontierName: "Queue", visited: ["g0"], marks: {}, markName: "", output: [], ...state },
        changed: [],
        highlights: [],
        ...extra,
      },
    ],
    summary: { time: "O(V+E)", space: "O(V)", result: [] },
  } as unknown as ExecutionTrace;
}
const issues = (t: unknown) => {
  const r = validateTrace(t);
  return r.ok ? "" : r.issues.map((i) => i.message).join(" | ");
};

describe("graph traces (schema 1.2)", () => {
  it("the schema is at least 1.2 and a 1.1 trace is still accepted", () => {
    expect(isSupportedSchemaVersion("1.2.0")).toBe(true);
    expect(isSupportedSchemaVersion("1.1.0")).toBe(true);
    expect(isSupportedSchemaVersion("1.3.0")).toBe(false);
  });
  it("accepts a state with an active edge, a frontier, marks and queue events on vertices", () => {
    const ok = trace({ type: "enqueue", element: nodeRef("g1") }, { activeEdge: { from: "g1", to: "g0" }, frontier: ["g1"], marks: { g0: 0, g1: null } }, { highlights: [{ target: nodeRef("g1"), role: "created" }], changed: [nodeRef("g1")] });
    expect(validateTrace(ok).ok).toBe(true);
  });
  it("rejects edges, pointers and references to vertices that do not exist", () => {
    expect(issues(trace({ type: "init" }, { edges: [{ from: "g0", to: "g9", weight: null }] }))).toMatch(/missing node "g9"/);
    expect(issues(trace({ type: "init" }, { frontier: ["gX"] }))).toMatch(/missing node "gX"/);
    expect(issues(trace({ type: "init" }, { marks: { nope: 1 } }))).toMatch(/missing node "nope"/);
    expect(issues(trace({ type: "visit", element: nodeRef("nope") }))).toMatch(/missing node "nope"/);
    expect(issues(trace({ type: "visit", element: { kind: "index", index: 0 } }))).toMatch(/by id/);
  });
  it("rejects an active edge that is not in the graph, duplicate edges and self-loops", () => {
    expect(issues(trace({ type: "init" }, { activeEdge: { from: "g0", to: "g2" } }))).toMatch(/not an edge/);
    expect(issues(trace({ type: "init" }, { edges: [...edges, { from: "g1", to: "g0", weight: null }] }))).toMatch(/duplicate edge/);
    expect(issues(trace({ type: "init" }, { edges: [{ from: "g0", to: "g0", weight: null }] }))).toMatch(/self-loops/);
  });
  it("a directed graph allows both directions as separate edges and only the drawn direction as active", () => {
    const both = [{ from: "g0", to: "g1", weight: 2 }, { from: "g1", to: "g0", weight: 3 }];
    expect(validateTrace(trace({ type: "init" }, { directed: true, edges: both })).ok).toBe(true);
    expect(issues(trace({ type: "init" }, { directed: true, edges: [edges[0]], activeEdge: { from: "g1", to: "g0" } }))).toMatch(/not an edge/);
  });
  it("rejects events that make no sense for a graph", () => {
    expect(issues(trace({ type: "swap", a: nodeRef("g0"), b: nodeRef("g1") }))).toMatch(/cannot use the "swap" event/);
  });
});
