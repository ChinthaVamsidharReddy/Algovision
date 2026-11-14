import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTrace, defaultTexts } from "../src/lib/build-trace";
import { describeArray } from "../src/lib/describe";
import { layoutArray } from "../src/lib/array-layout";
import { getAlgorithm, LIMIT_PROFILES } from "@algovision/algorithms";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/algorithms/is-palindrome-string",
}));

import { Workspace } from "../src/components/workspace/workspace";

beforeEach(() => window.history.replaceState(null, "", "/"));

describe("text input (schema 1.3 character cells)", () => {
  it("describes and lays out character arrays as letters", () => {
    const state = { kind: "array" as const, values: [97, 98], pointers: { i: 1 }, chars: true };
    expect(describeArray(state)).toBe('["a", "b"]; i → index 1 (value "b")');
    expect(describeArray({ kind: "array", values: [], pointers: {}, chars: true })).toBe('empty string ""');
    expect(layoutArray(state, []).cells.map((c) => c.text)).toEqual(["a", "b"]);
    expect(layoutArray({ kind: "array", values: [7], pointers: {} }, []).cells[0]!.text).toBe("7");
  });

  it("buildTrace keeps the text as a string and reports bad characters on the field", () => {
    const { content } = getAlgorithm("longest-repeating-replacement")!;
    expect(defaultTexts(content)).toEqual({ s: "aababba", k: "1" });
    const good = buildTrace(content, { s: "aababba", k: "1" }, LIMIT_PROFILES.standard);
    expect(good.ok && good.trace.summary.result).toBe(4);
    const bad = buildTrace(content, { s: "Hello 1", k: "1" }, LIMIT_PROFILES.standard);
    expect(!bad.ok && bad.kind === "input" && bad.errors.s).toMatch(/lowercase letters/i);
  });

  it("the workspace draws letters, validates the field and has no axe violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId="is-palindrome-string" />);
    const cells = [...container.querySelectorAll("[data-cell-index]")].map((g) => g.querySelector("text")?.textContent);
    expect(cells.join("")).toContain("racecar");
    expect(screen.getByText(/Lowercase letters a to z only/)).toBeInTheDocument();
    const box = screen.getByLabelText("Text");
    await user.clear(box);
    await user.type(box, "ABC");
    await user.click(screen.getByRole("button", { name: /Visuali/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/lowercase/i);
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
});
