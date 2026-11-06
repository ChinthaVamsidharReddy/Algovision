import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAlgorithm } from "@algovision/algorithms";
import { describeArray } from "../src/lib/describe";
import { layoutArray } from "../src/lib/array-layout";

let pathname = "/algorithms/linear-search";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => pathname,
}));

import { Workspace } from "../src/components/workspace/workspace";

const text = (id: string) => screen.getByTestId(id).textContent;
beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("array helpers", () => {
  it("describeArray lists values and pointers", () => {
    expect(describeArray({ kind: "array", values: [4, 9], pointers: { i: 1, j: null } })).toBe(
      "[4, 9]; i → index 1 (value 9); j → none",
    );
    expect(describeArray({ kind: "array", values: [], pointers: {} })).toBe("empty array []");
  });

  it("layoutArray stacks pointers that share a cell and picks the highest-priority role", () => {
    const layout = layoutArray({ kind: "array", values: [1, 2, 3], pointers: { low: 0, mid: 0, high: 2 } }, [
      { target: { kind: "index", index: 0 }, role: "window" },
      { target: { kind: "index", index: 0 }, role: "active", label: "mid" },
    ]);
    expect(layout.pointers[0]!.names).toEqual(["low", "mid"]);
    expect(layout.cells[0]).toMatchObject({ role: "active", label: "mid" });
    expect(layout.cells[1]!.role).toBe("none");
  });
});

for (const id of ["linear-search", "binary-search", "bubble-sort"]) {
  describe(`Workspace: ${id}`, () => {
    const { content } = getAlgorithm(id)!;
    beforeEach(() => {
      pathname = `/algorithms/${id}`;
    });

    it("renders the array, steps to the end and highlights code in all four languages", async () => {
      const user = userEvent.setup();
      const { container } = render(<Workspace algorithmId={id} />);
      expect(screen.getByRole("img", { name: /^Array\./ })).toBeInTheDocument();
      expect(container.querySelectorAll("[data-cell-index]").length).toBeGreaterThan(0);
      const end = screen.getByRole("slider");
      await user.click(screen.getByRole("button", { name: /Next/ }));
      expect(text("explanation")!.length).toBeGreaterThan(5);
      // jump to the last step
      fireEvent.keyDown(document.body, { key: "End" });
      expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
      expect(end).toBeInTheDocument();
      for (const lang of ["Java", "Python", "C++", "C"]) {
        await user.click(screen.getByRole("tab", { name: lang }));
        expect(container.querySelectorAll('[data-active="true"]').length).toBeGreaterThan(0);
      }
    });

    it("has no axe violations", async () => {
      const { container } = render(<Workspace algorithmId={id} />);
      const r = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
      expect(r.violations.map((v) => v.id)).toEqual([]);
    });

    it("rejects over-long input with the array limit", async () => {
      const user = userEvent.setup();
      render(<Workspace algorithmId={id} />);
      const box = screen.getByLabelText(content.meta.inputs[0]!.label);
      await user.clear(box);
      await user.type(box, Array.from({ length: 16 }, (_, i) => i).join(","));
      await user.click(screen.getByRole("button", { name: /Visuali|Apply|Run/i }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/at most 15/);
    });
  });
}

describe("binary-search input", () => {
  it("shows the ascending-order note and rejects unsorted values", async () => {
    pathname = "/algorithms/binary-search";
    const user = userEvent.setup();
    render(<Workspace algorithmId="binary-search" />);
    expect(screen.getByText(/Must be in ascending order/)).toBeInTheDocument();
    const box = screen.getByLabelText("Sorted array values");
    await user.clear(box);
    await user.type(box, "3,1,2");
    await user.click(screen.getByRole("button", { name: /Visuali|Apply|Run/i }));
    expect(await screen.findByText(/ascending order for binary search/)).toBeInTheDocument();
  });
});
