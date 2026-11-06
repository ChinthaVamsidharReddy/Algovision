import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAlgorithm } from "@algovision/algorithms";

let search = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
  usePathname: () => "/algorithms/linked-list-insert-head",
}));

import { Workspace } from "../src/components/workspace/workspace";

const ID = "linked-list-insert-head";
const content = getAlgorithm(ID)!.content;
const activeLines = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-active="true"]')].map((el) => Number((el as HTMLElement).dataset.line));
const text = (id: string) => screen.getByTestId(id).textContent;

beforeEach(() => {
  search = "";
  window.history.replaceState(null, "", "/algorithms/linked-list-insert-head");
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});
afterEach(() => vi.useRealTimers());

describe("Workspace: first complete visualization", () => {
  it("renders the default example at step 1 with code, variables and explanation", () => {
    render(<Workspace algorithmId={ID} />);
    expect(screen.getByRole("heading", { level: 1, name: /Insert at Beginning/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Step 1 of 5" })).toBeInTheDocument();
    expect(text("explanation")).toMatch(/\[3, 5, 8\].*insert 1/);
    expect(text("state-text")).toBe("head → 3 → 5 → 8 → null");
    expect(screen.getByRole("img", { name: /Linked list\. head → 3/ })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("Next walks all five steps; the highlighted line follows the anchor in Java", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId={ID} />);
    const java = content.code.java.anchors;
    const expected = ["entry", "create-node", "link-next", "move-head", "finish"];
    for (let i = 0; i < 5; i++) {
      expect(screen.getByRole("heading", { name: `Step ${i + 1} of 5` })).toBeInTheDocument();
      const lines = java[expected[i]!]!.flatMap((r) => Array.from({ length: r.end - r.start + 1 }, (_, k) => r.start + k));
      expect(activeLines(container)).toEqual(lines);
      if (i < 4) await user.click(screen.getByRole("button", { name: /Next/ }));
    }
    expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
  });

  it("the visualization changes meaningfully: new node appears detached, then becomes head", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId={ID} />);
    const node = (id: string) => container.querySelector(`[data-node-id="${id}"]`);
    expect(node("n4")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(node("n4")).not.toBeNull();
    expect(node("n4")).toHaveAttribute("data-role", "created");
    expect(text("state-text")).toContain("detached node 1");
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(container.querySelector('[data-edge="n4>n1"]')).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(text("state-text")).toMatch(/^head → 1 → 3 → 5 → 8 → null/);
    expect(container.querySelector('[data-pointer="head"]')).not.toBeNull();
  });

  it("switching language keeps the step and re-highlights the equivalent line", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId={ID} />);
    await user.click(screen.getByRole("button", { name: /Next/ }));
    await user.click(screen.getByRole("button", { name: /Next/ }));
    for (const [tab, id] of [["Python", "python"], ["C++", "cpp"], ["C", "c"], ["Java", "java"]] as const) {
      await user.click(screen.getByRole("tab", { name: tab }));
      expect(screen.getByRole("heading", { name: "Step 3 of 5" })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: new RegExp(`${tab.replace("+", "\\+")} source code`) })).toBeInTheDocument();
      const r = content.code[id].anchors["link-next"]![0]!;
      expect(activeLines(container)).toEqual([r.start]);
      const line = container.querySelector(`[data-line="${r.start}"]`)!;
      expect(line.textContent).toContain("next");
    }
  });

  it("tabs support arrow-key navigation and are labelled correctly", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Java", "Python", "C++", "C"]);
    tabs[0]!.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Python" })).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Python" }));
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "C" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Java" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "tab-java");
  });

  it("Play advances automatically and finishes; Pause stops it", () => {
    vi.useFakeTimers();
    render(<Workspace algorithmId={ID} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.getByRole("heading", { name: "Step 2 of 5" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => void vi.advanceTimersByTime(5000));
    expect(screen.getByRole("heading", { name: "Step 2 of 5" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    // Effects re-arm the timer between renders, so advance the clock one interval at a time.
    for (let i = 0; i < 3; i++) act(() => void vi.advanceTimersByTime(1000));
    expect(screen.getByRole("heading", { name: "Step 5 of 5" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Replay" })).toBeInTheDocument();
  });

  it("speed changes the tick interval without losing position", () => {
    vi.useFakeTimers();
    render(<Workspace algorithmId={ID} />);
    fireEvent.change(screen.getByLabelText("Speed"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => void vi.advanceTimersByTime(500));
    expect(screen.getByRole("heading", { name: "Step 2 of 5" })).toBeInTheDocument();
  });

  it("rapid Next while playing never skips or double-advances", () => {
    vi.useFakeTimers();
    render(<Workspace algorithmId={ID} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => void vi.advanceTimersByTime(900));
    fireEvent.click(screen.getByRole("button", { name: /Next/ })); // pauses, cancels pending tick
    act(() => void vi.advanceTimersByTime(5000));
    expect(screen.getByRole("heading", { name: "Step 2 of 5" })).toBeInTheDocument();
  });

  it("slider jumps and keyboard shortcuts work", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    fireEvent.change(screen.getByRole("slider", { name: "Step" }), { target: { value: "4" } });
    expect(screen.getByRole("heading", { name: "Step 4 of 5" })).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("heading", { name: "Step 3 of 5" })).toBeInTheDocument();
    await user.keyboard("{End}");
    expect(screen.getByRole("heading", { name: "Step 5 of 5" })).toBeInTheDocument();
    await user.keyboard("r");
    expect(screen.getByRole("heading", { name: "Step 1 of 5" })).toBeInTheDocument();
  });

  it("shortcuts are ignored while typing in an input", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    await user.click(screen.getByLabelText("List values"));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("heading", { name: "Step 1 of 5" })).toBeInTheDocument();
  });
});

describe("Workspace: input handling", () => {
  it("applies new input, resets playback and rebuilds the trace", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    await user.click(screen.getByRole("button", { name: /Next/ }));
    const values = screen.getByLabelText("List values");
    await user.clear(values);
    await user.type(values, "10, 20");
    const value = screen.getByLabelText("Value to insert");
    await user.clear(value);
    await user.type(value, "-4");
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    expect(screen.getByRole("heading", { name: "Step 1 of 5" })).toBeInTheDocument();
    expect(text("state-text")).toBe("head → 10 → 20 → null");
    expect(text("explanation")).toContain("-4");
  });

  it("accepts an empty list", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    await user.clear(screen.getByLabelText("List values"));
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    expect(text("state-text")).toBe("head → null");
    expect(screen.getByText("The list is empty")).toBeInTheDocument();
  });

  it("shows accessible errors for bad input and keeps the previous visualization", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    const values = screen.getByLabelText("List values");
    await user.clear(values);
    await user.type(values, "1, x");
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/not a whole number/);
    expect(values).toHaveAttribute("aria-invalid", "true");
    expect(values.getAttribute("aria-describedby")).toContain(alert.id);
    expect(text("state-text")).toBe("head → 3 → 5 → 8 → null");
  });

  it("enforces limits: too many nodes, out-of-range values", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    const values = screen.getByLabelText("List values");
    await user.clear(values);
    await user.type(values, Array.from({ length: 16 }, (_, i) => i).join(","));
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    expect(screen.getByRole("alert")).toHaveTextContent("at most 15 nodes");
    await user.clear(values);
    await user.type(values, "1");
    const value = screen.getByLabelText("Value to insert");
    await user.clear(value);
    await user.type(value, "1000");
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/between -999 and 999/);
  });

  it("Reset to example restores defaults", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    const values = screen.getByLabelText("List values");
    await user.clear(values);
    await user.type(values, "7");
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    await user.click(screen.getByRole("button", { name: "Reset to example" }));
    expect(text("state-text")).toBe("head → 3 → 5 → 8 → null");
    expect(screen.getByLabelText("List values")).toHaveValue("3, 5, 8");
  });
});

describe("Workspace: URL state", () => {
  it("restores language, step, speed and input from the URL", () => {
    search = "lang=python&step=3&speed=2&values=1,2&value=9";
    render(<Workspace algorithmId={ID} />);
    expect(screen.getByRole("tab", { name: "Python" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Step 3 of 5" })).toBeInTheDocument();
    expect(screen.getByLabelText("Speed")).toHaveValue("2");
    expect(screen.getByLabelText("List values")).toHaveValue("1,2");
    expect(text("state-text")).toContain("detached node 9");
  });

  it("falls back to the default example and explains when URL input is invalid", () => {
    search = "values=1,abc&value=2";
    render(<Workspace algorithmId={ID} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/not a whole number/);
    expect(text("state-text")).toBe("head → 3 → 5 → 8 → null");
  });

  it("clamps an out-of-range step from the URL", () => {
    search = "step=999";
    render(<Workspace algorithmId={ID} />);
    expect(screen.getByRole("heading", { name: "Step 5 of 5" })).toBeInTheDocument();
  });

  it("writes state back to the URL as the user navigates (defaults omitted)", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    expect(window.location.search).toBe("");
    await user.click(screen.getByRole("button", { name: /Next/ }));
    await user.click(screen.getByRole("tab", { name: "C" }));
    expect(new URLSearchParams(window.location.search).get("step")).toBe("2");
    expect(new URLSearchParams(window.location.search).get("lang")).toBe("c");
  });

  it("lite limits from the URL tighten what is accepted", async () => {
    search = "limits=lite";
    const user = userEvent.setup();
    render(<Workspace algorithmId={ID} />);
    expect(screen.getByText(/lite mode/)).toBeInTheDocument();
    const values = screen.getByLabelText("List values");
    await user.clear(values);
    await user.type(values, "1,2,3,4,5,6,7,8,9");
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    expect(screen.getByRole("alert")).toHaveTextContent("at most 8 nodes");
  });
});

describe("Workspace: accessibility (axe-core)", () => {
  async function violations(el: HTMLElement) {
    // color-contrast needs real layout/CSS; it is covered by the token contrast tests instead.
    const r = await axe.run(el, { rules: { "color-contrast": { enabled: false } } });
    return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  }

  it("has no violations on a fresh render", async () => {
    const { container } = render(<Workspace algorithmId={ID} />);
    expect(await violations(container)).toEqual([]);
  });
  it("has no violations at the last step in Python, and with an input error shown", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId={ID} />);
    await user.click(screen.getByRole("tab", { name: "Python" }));
    await user.keyboard("{End}");
    expect(await violations(container)).toEqual([]);
    const values = screen.getByLabelText("List values");
    await user.clear(values);
    await user.type(values, "q");
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    expect(await violations(container)).toEqual([]);
  });
  it("controls have accessible names and the code region is focusable", () => {
    render(<Workspace algorithmId={ID} />);
    for (const b of within(screen.getByRole("group", { name: "Playback controls" })).getAllByRole("button")) {
      expect(b).toHaveAccessibleName();
    }
    expect(screen.getByRole("region", { name: /Java source code/ })).toHaveAttribute("tabindex", "0");
  });
});
