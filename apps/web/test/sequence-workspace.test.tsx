import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAlgorithm } from "@algovision/algorithms";
import { describeQueue, describeStack } from "../src/lib/describe";

let pathname = "/algorithms/stack-push-pop";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => pathname,
}));

import { Workspace } from "../src/components/workspace/workspace";

const text = (id: string) => screen.getByTestId(id).textContent;
beforeEach(() => window.history.replaceState(null, "", "/"));

describe("describe helpers", () => {
  it("reads a stack bottom to top and a queue front to rear", () => {
    expect(describeStack({ kind: "stack", items: [3, 5] })).toBe("bottom → 3, 5 ← top (top is 5)");
    expect(describeStack({ kind: "stack", items: [] })).toBe("empty stack");
    expect(describeQueue({ kind: "queue", items: [3, 5] })).toBe("front → 3, 5 ← rear (front is 3)");
    expect(describeQueue({ kind: "queue", items: [] })).toBe("empty queue");
  });
});

const CASES = [
  { id: "stack-push-pop", label: "Stack", count: "Number of pops", over: /Underflow/i, first: "Push", add: /Push 3/ },
  { id: "queue-enqueue-dequeue", label: "Queue", count: "Number of dequeues", over: /Underflow/i, first: "Enqueue", add: /Enqueue 3/ },
] as const;

for (const c of CASES) {
  describe(`Workspace: ${c.id}`, () => {
    beforeEach(() => {
      pathname = `/algorithms/${c.id}`;
    });
    const { content } = getAlgorithm(c.id)!;

    it("renders the structure, walks to the end and highlights code in all four languages", async () => {
      const user = userEvent.setup();
      const { container } = render(<Workspace algorithmId={c.id} />);
      expect(screen.getByRole("img", { name: new RegExp(`^${c.label}\\.`) })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Next/ }));
      expect(text("explanation")).toMatch(c.add);
      expect(container.querySelectorAll("[data-cell-index]")).toHaveLength(1);
      fireEvent.keyDown(document.body, { key: "End" });
      expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
      for (const lang of ["Java", "Python", "C++", "C"]) {
        await user.click(screen.getByRole("tab", { name: lang }));
        expect(container.querySelectorAll('[data-active="true"]').length).toBeGreaterThan(0);
      }
    });

    it("shows the underflow step when too many removals are requested", async () => {
      const user = userEvent.setup();
      render(<Workspace algorithmId={c.id} />);
      const count = screen.getByLabelText(c.count);
      await user.clear(count);
      await user.type(count, "6");
      await user.click(screen.getByRole("button", { name: "Visualize" }));
      fireEvent.keyDown(document.body, { key: "End" });
      await user.click(screen.getByRole("button", { name: /Previous/ }));
      expect(screen.getByText(c.over, { selector: "span" })).toBeInTheDocument();
      expect(text("state-text")).toMatch(/empty/);
    });

    it("rejects a negative count and too many values with accessible errors", async () => {
      const user = userEvent.setup();
      render(<Workspace algorithmId={c.id} />);
      const count = screen.getByLabelText(c.count);
      await user.clear(count);
      await user.type(count, "-1");
      await user.click(screen.getByRole("button", { name: "Visualize" }));
      expect(await screen.findByText(/cannot be negative/)).toBeInTheDocument();
      await user.clear(count);
      await user.type(count, "1");
      const values = screen.getByLabelText(content.meta.inputs[0]!.label);
      await user.clear(values);
      await user.type(values, Array.from({ length: 16 }, (_, i) => i).join(","));
      await user.click(screen.getByRole("button", { name: "Visualize" }));
      expect(await screen.findByText(/at most 15 values/)).toBeInTheDocument();
    });

    it("has no axe violations", async () => {
      const { container } = render(<Workspace algorithmId={c.id} />);
      const r = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
      expect(r.violations.map((v) => v.id)).toEqual([]);
    });
  });
}
