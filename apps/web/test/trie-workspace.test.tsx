import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { describeTrie } from "../src/lib/describe";
import { layoutTrie } from "../src/lib/trie-layout";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/algorithms/trie-distinct-substrings",
}));

import { Workspace } from "../src/components/workspace/workspace";

beforeEach(() => window.history.replaceState(null, "", "/"));

const n = (id: string, label: string, children: string[] = [], count = 0) => ({ id, label, count, children });
const state = (over = {}) => ({ kind: "trie" as const, nodes: [n("n0", "", ["n1", "n2"]), n("n1", "a", ["n3"]), n("n2", "b"), n("n3", "c")], root: "n0", current: "n3", word: "abc", position: 2, ...over });

describe("trie state (schema 1.5)", () => {
  it("gives leaves their own columns and centres a parent over its children", () => {
    const l = layoutTrie(state());
    const at = (id: string) => l.nodes.find((x) => x.id === id)!;
    expect(at("n3").x).toBeLessThan(at("n2").x);
    expect(at("n1").x).toBe(at("n3").x);
    expect(at("n0").x).toBe((at("n3").x + at("n2").x) / 2);
    expect(at("n3").y).toBeGreaterThan(at("n1").y);
    expect(l.edges.map((e) => e.letter).sort()).toEqual(["a", "b", "c"]);
    expect(layoutTrie({ ...state(), nodes: [], root: null, current: null }).nodes).toEqual([]);
  });
  it("describes paths, the standing node and the word position for a screen reader", () => {
    const text = describeTrie(state());
    expect(text).toContain("3 nodes");
    expect(text).toContain("standing at ac");
    expect(text).toContain("inserting abc (2 of 3 letters done)");
    expect(text).toContain("paths: a, ac, b");
    expect(describeTrie(state({ nodes: [], root: null, current: null }))).toBe("empty trie");
    expect(describeTrie(state({ nodes: [n("n0", "", ["n1"]), n("n1", "a", [], 3)], current: "n0", position: null }))).toContain("a (3)");
  });
  it("the workspace draws the trie, the suffix and the edge letters, with no axe violations", async () => {
    const { container } = render(<Workspace algorithmId="trie-distinct-substrings" />);
    expect(container.querySelectorAll("[data-node-id]").length).toBe(1);
    expect(screen.getByTestId("trie-word-empty")).toBeInTheDocument();
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});
