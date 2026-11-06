import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTree } from "../../../packages/algorithms/src/algorithms/binary-tree-inorder";
import { describeTree } from "../src/lib/describe";
import { layoutTree, X_STEP, Y_STEP } from "../src/lib/tree-layout";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/algorithms/binary-tree-inorder",
}));

import { Workspace } from "../src/components/workspace/workspace";

const ID = "binary-tree-inorder";
beforeEach(() => window.history.replaceState(null, "", "/"));

const stateOf = (values: number[]) => {
  const { nodes, root } = buildTree(values);
  return { kind: "tree" as const, nodes, root, current: null, callStack: [], output: [] };
};

describe("layoutTree", () => {
  it("places nodes by in-order rank and depth, with parents between their subtrees", () => {
    const layout = layoutTree(stateOf([5, 3, 8, 1, 4]));
    const byValue = new Map(layout.nodes.map((n) => [n.value, n]));
    const xs = [1, 3, 4, 5, 8].map((v) => byValue.get(v)!.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(new Set(xs).size).toBe(5);
    expect(byValue.get(5)!.y).toBeLessThan(byValue.get(3)!.y);
    expect(byValue.get(3)!.y).toBe(byValue.get(8)!.y);
    expect(byValue.get(3)!.x).toBeGreaterThan(byValue.get(1)!.x);
    expect(byValue.get(3)!.x).toBeLessThan(byValue.get(4)!.x);
    expect(layout.edges).toHaveLength(4);
  });

  it("never overlaps two nodes, even for chains and duplicates", () => {
    for (const values of [[1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1], [4, 2, 4, 2, 4], [4, 2, 6, 1, 3, 5, 7]]) {
      const { nodes, width, height } = layoutTree(stateOf(values));
      for (const a of nodes) {
        expect(a.x).toBeGreaterThanOrEqual(0);
        expect(a.x).toBeLessThanOrEqual(width);
        expect(a.y).toBeLessThanOrEqual(height);
        for (const b of nodes) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(Math.min(X_STEP, Y_STEP));
      }
    }
  });

  it("handles an empty tree and is deterministic", () => {
    expect(layoutTree(stateOf([])).nodes).toEqual([]);
    expect(layoutTree(stateOf([3, 1, 2]))).toEqual(layoutTree(stateOf([3, 1, 2])));
  });
});

describe("describeTree", () => {
  it("lists the tree, call stack and output as text", () => {
    const s = { ...stateOf([5, 3, 8]), callStack: ["t1", "t2", null], output: [3] };
    expect(describeTree(s)).toBe("root 5 (left 3, right 8); call stack: visit(5) → visit(3) → visit(null); output: [3]");
    expect(describeTree(stateOf([]))).toBe("empty tree");
  });
});

describe("Workspace: binary-tree-inorder", () => {
  it("renders the tree, an empty call stack and an empty output at step 1", () => {
    render(<Workspace algorithmId={ID} />);
    expect(screen.getByRole("img", { name: /^Binary tree\./ })).toBeInTheDocument();
    expect(screen.getByTestId("call-stack-empty")).toBeInTheDocument();
    expect(screen.getByTestId("tree-output")).toHaveTextContent("[ ]");
    expect(screen.getByText(/They are inserted into a binary search tree first/)).toBeInTheDocument();
  });

  it("the call stack grows on a call, and the output fills in order at the end", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(within(screen.getByTestId("call-stack")).getAllByRole("listitem")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(within(screen.getByTestId("call-stack")).getAllByRole("listitem")).toHaveLength(2);
    expect(within(screen.getByTestId("call-stack")).getAllByRole("listitem")[0]).toHaveTextContent("visit(3)");
    fireEvent.keyDown(document.body, { key: "End" });
    expect(screen.getByTestId("tree-output")).toHaveTextContent("[1, 3, 4, 5, 8]");
    expect(screen.getByTestId("call-stack-empty")).toBeInTheDocument();
  });

  it("highlights a line in each of the four languages", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId={ID} />);
    await user.click(screen.getByRole("button", { name: /Next/ }));
    for (const lang of ["Java", "Python", "C++", "C"]) {
      await user.click(screen.getByRole("tab", { name: lang }));
      expect(container.querySelectorAll('[data-active="true"]').length).toBeGreaterThan(0);
    }
  });

  it("accepts an empty tree and rejects too many values", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    const box = screen.getByLabelText("Values to insert (in order)");
    await user.clear(box);
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    expect(screen.getByRole("img", { name: /empty tree/ })).toBeInTheDocument();
    await user.type(box, Array.from({ length: 16 }, (_, i) => i).join(","));
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    expect(await screen.findByText(/The tree can have at most 15 values/)).toBeInTheDocument();
  });

  it("has no axe violations at the first and a middle step", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId={ID} />);
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);
    for (let i = 0; i < 6; i++) await user.click(screen.getByRole("button", { name: /Next/ }));
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);
  });
});
