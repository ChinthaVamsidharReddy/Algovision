import { describe, expect, it } from "vitest";
import { nodeRef, TRACE_SCHEMA_VERSION, validateTrace, type ExecutionTrace } from "../src";

const node = (id: string, label: string, children: string[] = [], count = 1) => ({ id, label, count, children });
const base = [node("n0", "", ["n1", "n2"], 2), node("n1", "a"), node("n2", "b")];

function trace(event: Record<string, unknown>, state: Record<string, unknown> = {}, extra: Record<string, unknown> = {}): ExecutionTrace {
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    algorithmId: "trie-distinct-substrings",
    stateKind: "trie",
    input: {},
    steps: [
      {
        index: 0,
        event,
        source: { kind: "anchor", id: "entry" },
        explanation: "A step.",
        variables: [],
        state: { kind: "trie", nodes: base, root: "n0", current: "n0", word: "ab", position: 0, ...state },
        changed: [],
        highlights: [],
        ...extra,
      },
    ],
    summary: { time: "O(n^2)", space: "O(n^2)", result: 2 },
  } as unknown as ExecutionTrace;
}
const issues = (t: unknown) => {
  const r = validateTrace(t);
  return r.ok ? "" : r.issues.map((i) => i.message).join(" | ");
};

describe("trie traces (schema 1.5)", () => {
  it("accepts a trie with labelled edges, a current node and a word position", () => {
    expect(issues(trace({ type: "init" }))).toBe("");
    expect(issues(trace({ type: "insertNode", node: "n1" }, {}, { changed: [nodeRef("n1")], highlights: [{ target: nodeRef("n1"), role: "found" }] }))).toBe("");
  });
  it("accepts word-end flags and rejects a non-boolean one", () => {
    expect(issues(trace({ type: "init" }, { nodes: [{ ...base[0]!, end: false }, { ...base[1]!, end: true }, base[2]!] }))).toBe("");
    expect(issues(trace({ type: "init" }, { nodes: [{ ...base[0]!, end: "yes" }, base[1]!, base[2]!] }))).not.toBe("");
  });
  it("accepts an empty trie", () => {
    expect(issues(trace({ type: "init" }, { nodes: [], root: null, current: null, word: "", position: null }))).toBe("");
  });
  it("rejects two children with the same letter", () => {
    expect(issues(trace({ type: "init" }, { nodes: [node("n0", "", ["n1", "n2"]), node("n1", "a"), node("n2", "a")] }))).toContain("two children for the letter");
  });
  it("rejects children that are out of alphabetical order", () => {
    expect(issues(trace({ type: "init" }, { nodes: [node("n0", "", ["n2", "n1"]), node("n1", "a"), node("n2", "b")] }))).toContain("alphabetical");
  });
  it("rejects a non-root node without exactly one letter", () => {
    expect(issues(trace({ type: "init" }, { nodes: [node("n0", "", ["n1"]), node("n1", "")] }))).toContain("exactly one letter");
  });
  it("rejects unreachable nodes, a shared child and missing references", () => {
    expect(issues(trace({ type: "init" }, { nodes: [...base, node("n3", "c")] }))).toContain("reachable");
    expect(issues(trace({ type: "init" }, { nodes: [node("n0", "", ["n1", "n2"]), node("n1", "a", ["n3"]), node("n2", "b", ["n3"]), node("n3", "c")] }))).toContain("more than one parent");
    expect(issues(trace({ type: "init" }, { current: "zz" }))).toContain("missing node");
    expect(issues(trace({ type: "init" }, { nodes: [node("n0", "", ["n9"])] }))).toContain("missing node");
  });
  it("rejects a position past the end of the word and foreign events or references", () => {
    expect(issues(trace({ type: "init" }, { position: 3 }))).toContain("past the end");
    expect(issues(trace({ type: "swap", a: { kind: "index", index: 0 }, b: { kind: "index", index: 1 } }))).toContain("cannot use");
    expect(issues(trace({ type: "init" }, {}, { highlights: [{ target: { kind: "index", index: 0 }, role: "active" }] }))).toContain("only reference nodes");
  });
});
