import { describe, expect, it } from "vitest";
import type { LinkedListState } from "@algovision/trace-schema";
import { describeLinkedList } from "../src/lib/describe";
import { NODE_W, SLOT_W, layoutLinkedList } from "../src/lib/linked-list-layout";
import { tokenize } from "../src/lib/tokenize";

const list = (vals: number[], extra: Partial<LinkedListState> = {}): LinkedListState => ({
  kind: "linkedList",
  nodes: vals.map((value, i) => ({ id: `n${i + 1}`, value, next: i + 1 < vals.length ? `n${i + 2}` : null })),
  head: vals.length ? "n1" : null,
  pointers: {},
  ...extra,
});

describe("layoutLinkedList", () => {
  it("places the chain left to right in one row", () => {
    const l = layoutLinkedList(list([1, 2, 3]));
    const xs = l.nodes.map((n) => n.x);
    expect(xs[1]! - xs[0]!).toBe(SLOT_W);
    expect(new Set(l.nodes.map((n) => n.y)).size).toBe(1);
    expect(l.edges).toHaveLength(2);
    expect(l.width).toBeGreaterThanOrEqual(xs[2]! + NODE_W);
  });
  it("handles the empty list", () => {
    const l = layoutLinkedList(list([]));
    expect(l.nodes).toEqual([]);
    expect(l.pointers[0]).toMatchObject({ name: "head", nullTarget: true });
    expect(l.width).toBeGreaterThan(0);
  });
  it("puts a detached node in the row above, with a vertical edge down to its target", () => {
    const s = list([1, 2]);
    s.nodes.push({ id: "n3", value: 9, next: "n1" });
    const l = layoutLinkedList(s);
    const n3 = l.nodes.find((n) => n.id === "n3")!;
    const n1 = l.nodes.find((n) => n.id === "n1")!;
    expect(n3.row).toBe(1);
    expect(n3.y).toBeLessThan(n1.y);
    const edge = l.edges.find((e) => e.from === "n3")!;
    expect(edge.x1).toBe(edge.x2);
    expect(edge.y2).toBe(n1.y);
  });
  it("is stable under a cycle (never loops forever)", () => {
    const s = list([1, 2]);
    s.nodes[1]!.next = "n1";
    expect(layoutLinkedList(s).nodes).toHaveLength(2);
  });
  it("positions extra pointers above their node", () => {
    const l = layoutLinkedList(list([1], { pointers: { cur: "n1" } }));
    expect(l.pointers.find((p) => p.name === "cur")).toMatchObject({ side: "above" });
  });
});

describe("describeLinkedList", () => {
  it("describes chain, detached nodes and pointers", () => {
    const s = list([3, 5]);
    s.nodes.push({ id: "n3", value: 1, next: "n1" });
    s.pointers = { node: "n3" };
    expect(describeLinkedList(s)).toBe("head → 3 → 5 → null; detached node 1 (next → 3); node → 1");
  });
  it("describes empty", () => expect(describeLinkedList(list([]))).toBe("head → null"));
});

describe("tokenize", () => {
  const kinds = (line: string, lang: "java" | "python" | "cpp" | "c") => tokenize(line, lang).map((t) => `${t.kind}:${t.text}`);
  it("splits keywords, types, numbers and trailing comments", () => {
    expect(kinds("Node n = new Node(1); // hi", "java")).toEqual([
      "type:Node", "plain: n = ", "keyword:new", "plain: ", "type:Node", "plain:(", "number:1", "plain:); ", "comment:// hi",
    ]);
  });
  it("uses # for Python comments, not //", () => {
    expect(tokenize("x = 1  # c", "python").at(-1)).toEqual({ text: "# c", kind: "comment" });
    expect(tokenize("a // b", "python").some((t) => t.kind === "comment")).toBe(false);
  });
  it("treats #include as preprocessor in C but not Python/Java", () => {
    expect(tokenize("#include <stdlib.h>", "c")).toEqual([{ text: "#include <stdlib.h>", kind: "preproc" }]);
    expect(tokenize("# note", "python")[0]!.kind).toBe("comment");
  });
  it("round-trips text exactly", () => {
    for (const line of ['    Node *node = malloc(sizeof(Node));', "  return;", 'x = "a#b"  # c']) {
      for (const lang of ["java", "python", "cpp", "c"] as const) expect(tokenize(line, lang).map((t) => t.text).join("")).toBe(line);
    }
  });
  it("does not split identifiers containing digits", () => {
    expect(tokenize("n1 = 2", "python").filter((t) => t.kind === "number").map((t) => t.text)).toEqual(["2"]);
  });
});
