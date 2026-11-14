import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAlgorithm, LIMIT_PROFILES } from "@algovision/algorithms";
import { buildTrace, defaultTexts } from "../src/lib/build-trace";
import { describeGrid } from "../src/lib/describe";
import { layoutGrid } from "../src/lib/grid-layout";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/algorithms/number-of-islands",
}));

import { Workspace } from "../src/components/workspace/workspace";

beforeEach(() => window.history.replaceState(null, "", "/"));

describe("grid state (schema 1.4)", () => {
  it("lays out cells row-major with index or label headers", () => {
    const plain = { kind: "grid" as const, rows: 2, cols: 3, cells: [1, 0, 1, null, 2, 3] };
    const l = layoutGrid(plain, [{ target: { kind: "index", index: 4 }, role: "found", label: "x" }]);
    expect(l.cells.map((c) => c.text)).toEqual(["1", "0", "1", "", "2", "3"]);
    expect(l.cells[4]).toMatchObject({ row: 1, col: 1, role: "found", label: "x" });
    expect(l.colHeaders.map((h) => h.text)).toEqual(["0", "1", "2"]);
    const table = layoutGrid({ kind: "grid", rows: 2, cols: 2, cells: [0, 0, 0, null], rowLabels: ["", "a"], colLabels: ["", "b"] }, []);
    expect(table.rowHeaders.map((h) => h.text)).toEqual(["·", "a"]);
    expect(describeGrid({ kind: "grid", rows: 2, cols: 2, cells: [0, 0, 0, null], rowLabels: ["", "a"], colLabels: ["", "b"] })).toBe("2 by 2 grid; columns: none b; row 0 (none): 0 0; row 1 (a): 0 empty");
    expect(describeGrid({ kind: "grid", rows: 0, cols: 0, cells: [] })).toBe("empty grid");
  });

  it("turns row text into a grid and explains a bad row", () => {
    const { content } = getAlgorithm("number-of-islands")!;
    expect(defaultTexts(content).grid).toBe("1100, 1001, 0011, 0000");
    const good = buildTrace(content, { grid: "110 011" }, LIMIT_PROFILES.standard);
    expect(good.ok && good.trace.summary.result).toBe(1);
    expect(buildTrace(content, { grid: "" }, LIMIT_PROFILES.standard)).toMatchObject({ ok: true });
    const bad = buildTrace(content, { grid: "1a0" }, LIMIT_PROFILES.standard);
    expect(!bad.ok && bad.kind === "input" && bad.errors.grid).toMatch(/digits/i);
    const ragged = buildTrace(content, { grid: "11, 1" }, LIMIT_PROFILES.standard);
    expect(!ragged.ok && ragged.kind === "input" && ragged.errors.grid).toMatch(/same number/i);
    const big = buildTrace(content, { grid: "1, 1, 1, 1, 1, 1, 1" }, LIMIT_PROFILES.standard);
    expect(!big.ok && big.kind === "input" && big.errors.grid).toMatch(/at most 6 rows/);
  });

  it("the workspace draws the grid, validates the field and has no axe violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId="number-of-islands" />);
    expect(container.querySelectorAll("[data-cell-index]").length).toBe(16);
    expect(screen.getByText(/Rows of digits, separated by commas or spaces/)).toBeInTheDocument();
    const box = screen.getByLabelText("Grid");
    await user.clear(box);
    await user.type(box, "12x");
    await user.click(screen.getByRole("button", { name: /Visuali/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/digits/i);
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });

  it("a two-string table shows the letters as headers", () => {
    const { container } = render(<Workspace algorithmId="edit-distance" />);
    const headers = [...container.querySelectorAll("svg text")].map((t) => t.textContent);
    expect(headers).toEqual(expect.arrayContaining(["h", "o", "r", "s", "e", "·"]));
  });
});
