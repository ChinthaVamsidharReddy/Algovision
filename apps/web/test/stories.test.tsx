import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveLimits, runAlgorithm } from "@algovision/algorithms";
import type { ExecutionStep } from "@algovision/trace-schema";
import type { ArrayTrace } from "../src/lib/stories/types";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(""), usePathname: () => "/algorithms/x" }));

import { StoryPanel } from "../src/components/story/story-panel";
import { Workspace } from "../src/components/workspace/workspace";
import { STORIES, storyFor } from "../src/lib/stories";

interface Vector { name: string; input: unknown; expected: unknown }
const vectors = (id: string): Vector[] => JSON.parse(readFileSync(resolve(process.cwd(), "../../packages/algorithms/content", id, "vectors.json"), "utf8")) as Vector[];
const limits = resolveLimits("standard");
const traceOf = (id: string, input: unknown): ArrayTrace => {
  const r = runAlgorithm(id, input, limits);
  if (!r.ok) throw new Error(`${id}: ${JSON.stringify(r.errors)}`);
  return r.trace as unknown as ArrayTrace;
};

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("every story frame, on every test vector", () => {
  for (const story of STORIES) {
    it(`${story.id}: each step has a clean, consistent frame`, () => {
      expect(vectors(story.id).length).toBeGreaterThan(3);
      for (const v of vectors(story.id)) {
        const trace = traceOf(story.id, v.input);
        for (const step of trace.steps) {
          const f = story.frame(step, trace);
          const where = `${story.id} / ${v.name} / step ${step.index}`;
          expect(f.cells.length, where).toBe(step.state.values.length);
          for (const a of f.actors) expect(a.at >= 0 && a.at < Math.max(f.cells.length, 1), `${where}: actor ${a.id} at ${a.at}`).toBe(true);
          const text = [f.says, f.inCode ?? "", f.banner?.text ?? "", f.meter?.label ?? "", ...f.cells.map((c) => c.main + (c.sub ?? ""))].join(" ");
          expect(text, where).not.toMatch(/undefined|NaN|null|\[object/);
          expect(f.says.length, where).toBeGreaterThan(15);
        }
      }
    });
  }
});

describe("the story always agrees with the algorithm's real answer", () => {
  it("find-duplicate-floyd names the repeated value on the last step", () => {
    for (const v of vectors("find-duplicate-floyd")) {
      const trace = traceOf("find-duplicate-floyd", v.input);
      const last = trace.steps[trace.steps.length - 1]!;
      const f = storyFor("find-duplicate-floyd")!.frame(last, trace);
      expect(f.banner, v.name).toEqual({ kind: "good", text: `The repeated number is ${v.expected}.` });
      // both animals stand on the answer bench
      expect(f.actors.map((a) => a.at), v.name).toEqual([v.expected, v.expected]);
    }
  });

  it("find-duplicate-floyd shows the animals meeting exactly when slow equals fast", () => {
    const trace = traceOf("find-duplicate-floyd", { values: [1, 3, 4, 2, 2] });
    for (const step of trace.steps.filter((s) => s.source.kind === "anchor" && s.source.id === "phase1-loop")) {
      const slow = step.variables.find((x) => x.name === "slow")!.value;
      const fast = step.variables.find((x) => x.name === "fast")!.value;
      const f = storyFor("find-duplicate-floyd")!.frame(step, trace);
      expect(Boolean(f.banner), `slow ${slow} fast ${fast}`).toBe(slow === fast);
    }
  });

  it("two-sum-sorted ends in a found or not-found banner that matches the expected pair", () => {
    for (const v of vectors("two-sum-sorted")) {
      const trace = traceOf("two-sum-sorted", v.input);
      const last = trace.steps[trace.steps.length - 1]!;
      const f = storyFor("two-sum-sorted")!.frame(last, trace);
      const expected = v.expected as number[];
      const target = (v.input as { target: number }).target;
      if (expected.length === 2) {
        expect(f.banner?.kind, v.name).toBe("good");
        expect(f.actors.map((a) => a.at).sort(), v.name).toEqual([...expected].sort());
        expect(f.meter?.verdict, v.name).toBe("match");
        expect(f.banner?.text).toContain(String(target));
      } else {
        expect(f.banner?.kind, v.name).toBe("bad");
      }
    }
  });

  it("two-sum-sorted tells the friend who must move the same way the algorithm does", () => {
    const trace = traceOf("two-sum-sorted", { values: [1, 3, 4, 6, 8, 11], target: 10 });
    const story = storyFor("two-sum-sorted")!;
    for (const step of trace.steps) {
      const f = story.frame(step, trace);
      const id = step.source.kind === "anchor" ? step.source.id : "";
      if (id === "move-right") expect(f.says).toMatch(/Too costly.*Ravi/);
      if (id === "move-left") expect(f.says).toMatch(/Too cheap.*Asha/);
      if (id === "check-less" && f.meter) expect(f.meter.verdict).not.toBe("match");
    }
  });

  it("is-palindrome-string agrees with the expected verdict and marks mismatches in red", () => {
    for (const v of vectors("is-palindrome-string")) {
      const trace = traceOf("is-palindrome-string", v.input);
      const story = storyFor("is-palindrome-string")!;
      const last = trace.steps[trace.steps.length - 1]!;
      expect(story.frame(last, trace).banner?.kind, v.name).toBe(v.expected === 1 ? "good" : "bad");
      if (v.expected === 0) expect(trace.steps.some((s) => story.frame(s, trace).cells.some((c) => c.tone === "warn")), v.name).toBe(true);
      else expect(trace.steps.some((s) => story.frame(s, trace).cells.some((c) => c.tone === "warn")), v.name).toBe(false);
    }
  });
});

describe("story panel", () => {
  it("shows the situation, the cast, moves the actors with the steps, and the moral only at the end", () => {
    const trace = traceOf("find-duplicate-floyd", { values: [1, 3, 4, 2, 2] });
    const story = storyFor("find-duplicate-floyd")!;
    const { rerender, container } = render(<StoryPanel story={story} step={trace.steps[0] as ExecutionStep<"array">} trace={trace} />);
    expect(screen.getByTestId("story-hook")).toHaveTextContent("numbered benches");
    expect(screen.getByRole("list", { name: "Who is who" })).toHaveTextContent("Tortoise");
    expect(screen.getAllByTestId("story-cell")).toHaveLength(5);
    expect(screen.queryByTestId("story-moral")).toBeNull();
    const left = (id: string) => (screen.getByTestId(`actor-${id}`) as HTMLElement).dataset.at;
    expect(left("t")).toBe(left("r")); // both at the gate

    rerender(<StoryPanel story={story} step={trace.steps[3] as ExecutionStep<"array">} trace={trace} />);
    expect(left("t")).not.toBe(left("r")); // slow=3, fast=4
    expect(screen.getByTestId("story-says")).toHaveTextContent("Tortoise: 1 sign, to bench 3");

    rerender(<StoryPanel story={story} step={trace.steps[trace.steps.length - 1] as ExecutionStep<"array">} trace={trace} />);
    expect(screen.getByTestId("story-moral")).toBeInTheDocument();
    expect(screen.getByTestId("story-banner")).toHaveTextContent("The repeated number is 2.");
    return axe.run(container, { rules: { "color-contrast": { enabled: false } } }).then((r) => expect(r.violations.map((v) => v.id)).toEqual([]));
  });

  it("can be hidden and shown again, and remembers the choice", () => {
    const trace = traceOf("is-palindrome-string", { s: "abba" });
    const story = storyFor("is-palindrome-string")!;
    render(<StoryPanel story={story} step={trace.steps[1] as ExecutionStep<"array">} trace={trace} />);
    const btn = screen.getByRole("button", { name: "Hide the story" });
    expect(btn).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: "Show the story" })).toHaveAttribute("aria-expanded", "false");
    expect(localStorage.getItem("av-story")).toBe("hidden");
    expect(screen.getByTestId("story-says")).not.toBeVisible();
  });

  it("shows the budget meter for the shelf story", () => {
    const trace = traceOf("two-sum-sorted", { values: [1, 3, 4, 6, 8, 11], target: 10 });
    const story = storyFor("two-sum-sorted")!;
    const step = trace.steps.find((s) => s.source.kind === "anchor" && s.source.id === "check-less")!;
    render(<StoryPanel story={story} step={step as ExecutionStep<"array">} trace={trace} />);
    expect(screen.getByTestId("story-meter")).toHaveAttribute("data-verdict", "high");
    expect(screen.getByTestId("story-meter")).toHaveTextContent("over budget");
  });
});

describe("the workspace", () => {
  it("shows the story for algorithms that have one, above the normal visualization", () => {
    render(<Workspace algorithmId="find-duplicate-floyd" />);
    expect(screen.getByTestId("story")).toBeInTheDocument();
    expect(screen.getByTestId("state-text")).toBeInTheDocument();
  });
  it("shows no story panel for algorithms without one", () => {
    render(<Workspace algorithmId="binary-search" />);
    expect(screen.queryByTestId("story")).toBeNull();
  });
});
