import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAlgorithm, LIMIT_PROFILES } from "@algovision/algorithms";
import { buildTrace, defaultTexts } from "../src/lib/build-trace";
import { describeTrie } from "../src/lib/describe";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/algorithms/lru-cache",
}));

import { Workspace } from "../src/components/workspace/workspace";

beforeEach(() => window.history.replaceState(null, "", "/"));

describe("operation-list input (kind ops)", () => {
  it("shows the default operations as editable text", () => {
    expect(defaultTexts(getAlgorithm("lru-cache")!.content)).toEqual({ ops: "put 1 1, put 2 2, get 1, put 3 3, get 2, put 3 9, put 4 4, get 3", capacity: "2" });
    expect(defaultTexts(getAlgorithm("trie-insert-search")!.content).ops).toBe("insert apple, insert app, search app, search appl, prefix appl, search bat, insert bat, search bat");
  });
  it("runs text operations and explains mistakes field by field", () => {
    const { content } = getAlgorithm("lru-cache")!;
    const good = buildTrace(content, { ops: "put 1 5, get 1, get 2", capacity: "1" }, LIMIT_PROFILES.standard);
    expect(good.ok && good.trace.summary.result).toBe(4);
    const bad = buildTrace(content, { ops: "put 1, pop 2", capacity: "x" }, LIMIT_PROFILES.standard);
    expect(!bad.ok && bad.kind === "input" && bad.errors.ops).toMatch(/put needs 2 numbers/);
    expect(!bad.ok && bad.kind === "input" && bad.errors.capacity).toBeTruthy();
    const range = buildTrace(content, { ops: "get 1", capacity: "9" }, LIMIT_PROFILES.standard);
    expect(!range.ok && range.kind === "input" && range.errors.capacity).toMatch(/1 to 4/);
    const many = buildTrace(content, { ops: Array(9).fill("get 1").join(", "), capacity: "1" }, LIMIT_PROFILES.lite);
    expect(!many.ok && many.kind === "input" && many.errors.ops).toMatch(/At most 8/);
    const empty = buildTrace(getAlgorithm("trie-insert-search")!.content, { ops: "" }, LIMIT_PROFILES.standard);
    expect(empty.ok && empty.trace.summary.result).toBe(0);
  });
  it("draws the LRU list with key labels, and the word trie with word ends", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId="lru-cache" />);
    expect(screen.getByText(/Operations separated by commas: put key value, or get key/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(container.querySelectorAll("[data-node-id]").length).toBeGreaterThan(0);
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
  it("describes word ends for a screen reader", () => {
    const n = (id: string, label: string, children: string[] = [], end?: boolean) => ({ id, label, count: 0, children, ...(end === undefined ? {} : { end }) });
    const text = describeTrie({ kind: "trie", nodes: [n("n0", "", ["n1"], false), n("n1", "a", ["n2"], true), n("n2", "b", [], false)], root: "n0", current: "n1", word: "a", position: 1 });
    expect(text).toContain("paths: a [word ends], ab");
  });
});
