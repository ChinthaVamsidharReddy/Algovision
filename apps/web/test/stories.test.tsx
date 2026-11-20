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
import { STORIES, storyFor as anyStoryFor } from "../src/lib/stories";
import type { Story } from "../src/lib/stories";

/** The row-of-cells story for an algorithm (these tests drive it with array traces). */
const storyFor = (id: string): Story | undefined => {
  const s = anyStoryFor(id);
  return s && s.kind !== "linkedList" && s.kind !== "tree" && s.kind !== "graph" && s.kind !== "grid" && s.kind !== "pile" ? s : undefined;
};

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

describe("batch 2: each story agrees with the algorithm's real answer", () => {
  const lastFrame = (id: string, input: unknown) => {
    const trace = traceOf(id, input);
    return storyFor(id)!.frame(trace.steps[trace.steps.length - 1]! as ExecutionStep<"array">, trace);
  };

  it("binary-search reports the right book, or that it is absent", () => {
    for (const v of vectors("binary-search")) {
      const f = lastFrame("binary-search", v.input);
      const target = (v.input as { target: number }).target;
      if (v.expected === -1) expect(f.banner, v.name).toEqual({ kind: "bad", text: `${target} is not on the shelf.` });
      else expect(f.banner, v.name).toEqual({ kind: "good", text: `Found ${target} on book ${(v.expected as number) + 1}.` });
    }
  });

  it("binary-search only crosses out books outside the flags, and the peek is inside them", () => {
    const trace = traceOf("binary-search", { values: [2, 5, 8, 12, 16, 23, 38], target: 23 });
    const story = storyFor("binary-search")!;
    for (const step of trace.steps) {
      const f = story.frame(step as ExecutionStep<"array">, trace);
      const low = step.variables.find((x) => x.name === "low")?.value as number | undefined;
      const high = step.variables.find((x) => x.name === "high")?.value as number | undefined;
      if (low === undefined || high === undefined) continue;
      f.cells.forEach((c, i) => expect(c.tone === "dim", `step ${step.index} cell ${i}`).toBe(i < low || i > high));
    }
  });

  it("dutch-national-flag ends with the socks in the expected order and every cell marked done", () => {
    const EMOJI = ["🔴", "⚪", "🔵"];
    for (const v of vectors("dutch-national-flag")) {
      const f = lastFrame("dutch-national-flag", v.input);
      expect(f.cells.map((c) => c.main), v.name).toEqual((v.expected as number[]).map((x) => EMOJI[x]));
      expect(f.cells.every((c) => c.tone === "good"), v.name).toBe(true);
      expect(f.banner?.kind, v.name).toBe("good");
    }
  });

  it("dutch-national-flag zones are consistent: done zones hold the right colours at every step", () => {
    const trace = traceOf("dutch-national-flag", { values: [2, 0, 2, 1, 1, 0, 1] });
    const story = storyFor("dutch-national-flag")!;
    for (const step of trace.steps) {
      const low = step.variables.find((x) => x.name === "low")?.value as number | undefined;
      const mid = step.variables.find((x) => x.name === "mid")?.value as number | undefined;
      const high = step.variables.find((x) => x.name === "high")?.value as number | undefined;
      const src = step.source;
      if (low === undefined || mid === undefined || high === undefined || (src.kind === "anchor" && src.id === "finish")) continue;
      const vals = step.state.values;
      for (let i = 0; i < vals.length; i++) {
        if (i < low) expect(vals[i], `step ${step.index} red zone`).toBe(0);
        else if (i < mid) expect(vals[i], `step ${step.index} white zone`).toBe(1);
        else if (i > high) expect(vals[i], `step ${step.index} blue zone`).toBe(2);
      }
      story.frame(step as ExecutionStep<"array">, trace);
    }
  });

  it("container-with-most-water names the expected best pond, and draws a strip per post", () => {
    for (const v of vectors("container-with-most-water")) {
      const f = lastFrame("container-with-most-water", v.input);
      expect(f.banner, v.name).toEqual({ kind: "good", text: `The biggest pond holds ${v.expected}.` });
    }
    const trace = traceOf("container-with-most-water", { values: [1, 8, 6, 2, 5, 4, 8] });
    const f = storyFor("container-with-most-water")!.frame(trace.steps[2] as ExecutionStep<"array">, trace);
    expect(f.cells.map((c) => c.bar)).toEqual([1 / 8, 1, 6 / 8, 2 / 8, 5 / 8, 4 / 8, 1]);
  });

  it("container-with-most-water always moves the shorter post (in the story and in the trace)", () => {
    const trace = traceOf("container-with-most-water", { values: [1, 8, 6, 2, 5, 4, 8, 3, 7] });
    const steps = trace.steps;
    for (let i = 1; i < steps.length; i++) {
      const src = steps[i]!.source;
      const id = src.kind === "anchor" ? src.id : "";
      if (id !== "move-left" && id !== "move-right") continue;
      const prev = steps[i - 1]!;
      const l = prev.variables.find((x) => x.name === "left")!.value as number;
      const r = prev.variables.find((x) => x.name === "right")!.value as number;
      const vals = prev.state.values;
      if (id === "move-left") expect(vals[l]!, `step ${i}`).toBeLessThan(vals[r]!);
      else expect(vals[r]!, `step ${i}`).toBeLessThanOrEqual(vals[l]!);
    }
  });

  it("reverse-in-place ends reversed, with the books in the expected order and no hands left", () => {
    for (const v of vectors("reverse-in-place")) {
      const f = lastFrame("reverse-in-place", v.input);
      expect(f.cells.map((c) => c.main), v.name).toEqual((v.expected as number[]).map(String));
      expect(f.actors, v.name).toEqual([]);
      if ((v.expected as number[]).length > 0) expect(f.banner?.kind, v.name).toBe("good");
    }
  });
});

describe("batch 3: each story agrees with the algorithm's real answer", () => {
  const lastFrame = (id: string, input: unknown) => {
    const trace = traceOf(id, input);
    return storyFor(id)!.frame(trace.steps[trace.steps.length - 1]! as ExecutionStep<"array">, trace);
  };
  const SORTS = ["bubble-sort", "selection-sort", "insertion-sort"];
  for (const id of SORTS) {
    it(`${id} ends sorted and every cell is marked done`, () => {
      for (const v of vectors(id)) {
        const f = lastFrame(id, v.input);
        expect(f.cells.map((c) => c.main), `${id} ${v.name}`).toEqual((v.expected as number[]).map(String));
        expect(f.cells.every((c) => c.tone === "good"), `${id} ${v.name}`).toBe(true);
      }
    });
  }

  it("bubble-sort: the settled (green) kids at the back really are in their final places at every step", () => {
    const trace = traceOf("bubble-sort", { values: [5, 2, 9, 1, 6, 3] });
    const sorted = [...(trace.steps[0]!.state.values as number[])].sort((x, y) => x - y);
    for (const step of trace.steps) {
      const f = storyFor("bubble-sort")!.frame(step as ExecutionStep<"array">, trace);
      f.cells.forEach((c, i) => c.tone === "good" && expect(step.state.values[i], `step ${step.index}`).toBe(sorted[i]));
    }
  });

  it("selection-sort: green cells (the settled front) are the smallest values, in order, at every step", () => {
    const trace = traceOf("selection-sort", { values: [64, 25, 12, 22, 11, 90, 3] });
    const sorted = [...(trace.steps[0]!.state.values as number[])].sort((x, y) => x - y);
    for (const step of trace.steps) {
      const f = storyFor("selection-sort")!.frame(step as ExecutionStep<"array">, trace);
      f.cells.forEach((c, i) => c.tone === "good" && expect(step.state.values[i], `step ${step.index}`).toBe(sorted[i]));
    }
  });

  it("insertion-sort: the green hand is always sorted, and the card in hand is shown", () => {
    const trace = traceOf("insertion-sort", { values: [12, 11, 13, 5, 6] });
    for (const step of trace.steps) {
      const f = storyFor("insertion-sort")!.frame(step as ExecutionStep<"array">, trace);
      const green = f.cells.map((c, i) => (c.tone === "good" ? step.state.values[i]! : null)).filter((x): x is number => x !== null);
      expect(green, `step ${step.index}`).toEqual([...green].sort((x, y) => x - y));
      const id = step.source.kind === "anchor" ? step.source.id : "";
      if (id === "pick-key") expect(f.board?.label).toBe("Card in hand");
    }
  });

  it("move-zeroes ends with the passengers first in order, the empty seats last", () => {
    for (const v of vectors("move-zeroes")) {
      const f = lastFrame("move-zeroes", v.input);
      expect(f.cells.map((c) => c.main), v.name).toEqual((v.expected as number[]).map(String));
      expect(f.cells.filter((c) => c.tone === "good").length, v.name).toBe((v.expected as number[]).filter((x) => x !== 0).length);
    }
  });

  it("remove-duplicates-sorted keeps exactly the expected values", () => {
    for (const v of vectors("remove-duplicates-sorted")) {
      const f = lastFrame("remove-duplicates-sorted", v.input);
      const kept = f.cells.filter((c) => c.tone === "good").map((c) => c.main);
      expect(kept, v.name).toEqual((v.expected as number[]).map(String));
      expect(f.cells.filter((c) => c.tone === "dim").length, v.name).toBe(f.cells.length - kept.length);
    }
  });

  it("linear-search names the right locker or says it is missing", () => {
    for (const v of vectors("linear-search")) {
      const f = lastFrame("linear-search", v.input);
      const target = (v.input as { target: number }).target;
      if (v.expected === -1) expect(f.banner, v.name).toEqual({ kind: "bad", text: `${target} is not in any locker.` });
      else expect(f.banner, v.name).toEqual({ kind: "good", text: `Found ${target} in locker ${(v.expected as number) + 1}.` });
    }
  });

  it("two-sum-hash reports the expected pair, and the notebook only ever holds coins already passed", () => {
    for (const v of vectors("two-sum-hash")) {
      const f = lastFrame("two-sum-hash", v.input);
      const e = v.expected as number[];
      if (e.length === 2) expect(f.banner, v.name).toEqual({ kind: "good", text: `Places ${e[0]! + 1} and ${e[1]! + 1} make ${(v.input as { target: number }).target}.` });
      else expect(f.banner?.kind, v.name).toBe("bad");
    }
    const trace = traceOf("two-sum-hash", { values: [4, 9, 4, 1, 7], target: 8 });
    for (const step of trace.steps) {
      const f = storyFor("two-sum-hash")!.frame(step as ExecutionStep<"array">, trace);
      const j = step.variables.find((x) => x.name === "j")?.value;
      const id = step.source.kind === "anchor" ? step.source.id : "";
      if (typeof j !== "number" || !f.board) continue;
      const places = [...f.board.text.matchAll(/place (\d+)/g)].map((m) => Number(m[1]) - 1);
      for (const p of places) expect(p, `step ${step.index}`).toBeLessThanOrEqual(id === "store" ? j : j - 1);
    }
  });

  it("kadane: the green best streak adds up to the expected sum, and agrees with the trace's own start and end", () => {
    for (const v of vectors("kadane-max-subarray")) {
      const trace = traceOf("kadane-max-subarray", v.input);
      const last = trace.steps[trace.steps.length - 1]! as ExecutionStep<"array">;
      const f = storyFor("kadane-max-subarray")!.frame(last, trace);
      const nums = (v.input as { values: number[] }).values;
      const green = f.cells.map((c, i) => (c.tone === "good" ? i : -1)).filter((i) => i >= 0);
      expect(green.reduce((sum, i) => sum + nums[i]!, 0), v.name).toBe(v.expected);
      const ptr = (last.state as { pointers?: Record<string, number | null> }).pointers;
      if (ptr && typeof ptr.start === "number" && typeof ptr.end === "number") expect([green[0], green[green.length - 1]], v.name).toEqual([ptr.start, ptr.end]);
      expect(f.banner?.kind, v.name).toBe("good");
    }
  });

  it("kadane: the story drops a streak exactly when its total is negative", () => {
    const trace = traceOf("kadane-max-subarray", { values: [-2, 1, -3, 4, -1, 2, 1, -5, 4] });
    for (const step of trace.steps) {
      const id = step.source.kind === "anchor" ? step.source.id : "";
      if (id !== "decide") continue;
      const cur = step.variables.find((x) => x.name === "current")!.value as number;
      const f = storyFor("kadane-max-subarray")!.frame(step as ExecutionStep<"array">, trace);
      expect(/drop it/.test(f.says), `step ${step.index}`).toBe(cur < 0);
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
    render(<Workspace algorithmId="prefix-sum" />);
    expect(screen.queryByTestId("story")).toBeNull();
  });
});

// ---------- linked-list (chain) stories ----------
import { ChainPanel } from "../src/components/story/chain-panel";
import { CHAIN_STORIES } from "../src/lib/stories";
import { chainValues, type LinkedListTrace } from "../src/lib/stories/types";

const chainTraceOf = (id: string, input: unknown): LinkedListTrace => traceOf(id, input) as unknown as LinkedListTrace;
const chainStory = (id: string) => CHAIN_STORIES.find((s) => s.id === id)!;
const lastBanner = (id: string, input: unknown) => {
  const t = chainTraceOf(id, input);
  return { t, f: chainStory(id).frame(t.steps[t.steps.length - 1]!, t) };
};

describe("every chain story frame, on every test vector", () => {
  for (const story of CHAIN_STORIES) {
    it(`${story.id}: each step has clean text and actors on real nodes`, () => {
      expect(vectors(story.id).length).toBeGreaterThan(3);
      for (const v of vectors(story.id)) {
        const trace = chainTraceOf(story.id, v.input);
        for (const step of trace.steps) {
          const f = story.frame(step, trace);
          const where = `${story.id} / ${v.name} / step ${step.index}`;
          const ids = new Set(step.state.nodes.map((n) => n.id));
          for (const a of f.actors) expect(a.node === "end" || ids.has(a.node), `${where}: actor ${a.id} on ${a.node}`).toBe(true);
          for (const id of Object.keys(f.tones)) expect(ids.has(id), `${where}: tone for ${id}`).toBe(true);
          // The story words must be clean; the code line may legitimately say "null" (it quotes the real code).
          expect([f.says, f.banner?.text ?? ""].join(" "), where).not.toMatch(/undefined|NaN|null|\[object/);
          expect(f.inCode ?? "", where).not.toMatch(/undefined|NaN|\[object/);
          expect(f.says.length, where).toBeGreaterThan(15);
        }
      }
    });
  }
});

describe("chain stories agree with the algorithm's real answer", () => {
  it("reverse ends with the new front dancer and a fully reversed state", () => {
    for (const v of vectors("linked-list-reverse")) {
      const expected = v.expected as number[];
      const { t, f } = lastBanner("linked-list-reverse", v.input);
      const last = t.steps[t.steps.length - 1]!;
      if (expected.length === 0) continue;
      expect(chainValues(last.state), v.name).toEqual(expected);
      expect(f.banner?.text, v.name).toContain(`dancer ${expected[0]}`);
    }
  });
  it("find-middle names the expected middle value", () => {
    for (const v of vectors("linked-list-find-middle")) {
      const { f } = lastBanner("linked-list-find-middle", v.input);
      expect(f.banner?.text, v.name).toBe(`The middle coach holds ${v.expected}.`);
    }
  });
  it("search reports the expected index or not found", () => {
    for (const v of vectors("linked-list-search")) {
      const { f } = lastBanner("linked-list-search", v.input);
      if (v.expected === -1) expect(f.banner?.kind, v.name).toBe("bad");
      else expect(f.banner?.text, v.name).toContain(`number ${v.expected} `);
    }
  });
  it("insert-head ends with the new value at the front", () => {
    for (const v of vectors("linked-list-insert-head")) {
      const { t, f } = lastBanner("linked-list-insert-head", v.input);
      expect(chainValues(t.steps[t.steps.length - 1]!.state), v.name).toEqual(v.expected);
      expect(f.banner?.kind, v.name).toBe("good");
    }
  });
  it("delete-value and remove-nth finish on the expected list", () => {
    for (const id of ["linked-list-delete-value", "linked-list-remove-nth-from-end"]) {
      for (const v of vectors(id)) {
        const { t } = lastBanner(id, v.input);
        expect(chainValues(t.steps[t.steps.length - 1]!.state), `${id} ${v.name}`).toEqual(v.expected);
      }
    }
  });
});

describe("the chain panel", () => {
  it("draws the nodes, the characters and the narration", () => {
    const trace = chainTraceOf("linked-list-find-middle", { values: [1, 2, 3, 4] });
    render(<ChainPanel story={chainStory("linked-list-find-middle")} step={trace.steps[4]!} trace={trace} />);
    expect(screen.getAllByTestId("story-node")).toHaveLength(4);
    expect(screen.getByTestId("actor-t")).toBeInTheDocument();
    expect(screen.getByTestId("actor-r")).toBeInTheDocument();
    expect(screen.getByTestId("story-says")).toHaveTextContent(/Rabbit/);
  });
  it("is mounted by the workspace for a linked-list algorithm and has no accessibility violations", async () => {
    const { container } = render(<Workspace algorithmId="linked-list-reverse" />);
    expect(screen.getByTestId("story")).toBeInTheDocument();
    expect(screen.getAllByTestId("story-node").length).toBeGreaterThan(0);
    const r = await axe.run(container, { runOnly: ["wcag2a", "wcag2aa"], rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((x) => x.id)).toEqual([]);
  });
});

// ---------- binary-tree stories ----------
import { TreePanel } from "../src/components/story/tree-panel";
import { TREE_STORIES } from "../src/lib/stories";
import type { TreeTrace } from "../src/lib/stories/types";

const treeTraceOf = (id: string, input: unknown): TreeTrace => traceOf(id, input) as unknown as TreeTrace;
const treeStory = (id: string) => TREE_STORIES.find((s) => s.id === id)!;
const treeLast = (id: string, input: unknown) => {
  const t = treeTraceOf(id, input);
  return treeStory(id).frame(t.steps[t.steps.length - 1]!, t);
};

describe("every tree story frame, on every test vector", () => {
  for (const story of TREE_STORIES) {
    it(`${story.id}: each step has clean text and characters on real nodes`, () => {
      expect(vectors(story.id).length).toBeGreaterThan(3);
      for (const v of vectors(story.id)) {
        const trace = treeTraceOf(story.id, v.input);
        for (const step of trace.steps) {
          const f = story.frame(step, trace);
          const where = `${story.id} / ${v.name} / step ${step.index}`;
          const ids = new Set(step.state.nodes.map((n) => n.id));
          for (const a of f.actors) expect(ids.has(a.node), `${where}: actor ${a.id} on ${a.node}`).toBe(true);
          for (const id of Object.keys(f.tones)) expect(ids.has(id), `${where}: tone for ${id}`).toBe(true);
          expect([f.says, f.banner?.text ?? "", f.board?.text ?? ""].join(" "), where).not.toMatch(/undefined|NaN|null|\[object/);
          expect(f.inCode ?? "", where).not.toMatch(/undefined|NaN|\[object/);
          expect(f.says.length, where).toBeGreaterThan(15);
        }
      }
    });
  }
});

describe("tree stories agree with the algorithm's real answer", () => {
  it("the three tours end with the expected order on the board and in the banner", () => {
    for (const id of ["binary-tree-inorder", "binary-tree-preorder", "binary-tree-postorder"]) {
      for (const v of vectors(id)) {
        const expected = v.expected as number[];
        const f = treeLast(id, v.input);
        if (expected.length === 0) continue;
        expect(f.banner?.text, `${id} ${v.name}`).toContain(expected.join(", "));
        expect(f.board?.text, `${id} ${v.name}`).toBe(expected.join(", "));
      }
    }
  });
  it("every room is marked done at the end of a tour", () => {
    for (const id of ["binary-tree-inorder", "binary-tree-preorder", "binary-tree-postorder"]) {
      for (const v of vectors(id)) {
        const t = treeTraceOf(id, v.input);
        const last = t.steps[t.steps.length - 1]!;
        const f = treeStory(id).frame(last, t);
        expect(Object.values(f.tones).filter((x) => x === "good").length, `${id} ${v.name}`).toBe(last.state.nodes.length);
      }
    }
  });
  it("bst-search reports found or not found exactly as the vector expects", () => {
    for (const v of vectors("bst-search")) {
      const f = treeLast("bst-search", v.input);
      expect(f.banner?.kind, v.name).toBe(v.expected === 1 ? "good" : "bad");
    }
  });
  it("bst-insert ends with the new house built, and the tree holds the expected values", () => {
    for (const v of vectors("bst-insert")) {
      const t = treeTraceOf("bst-insert", v.input);
      const f = treeStory("bst-insert").frame(t.steps[t.steps.length - 1]!, t);
      expect(f.banner?.kind, v.name).toBe("good");
      expect(t.steps[t.steps.length - 1]!.state.output, v.name).toEqual(v.expected);
    }
  });
  it("tree-height states the expected number of generations", () => {
    for (const v of vectors("tree-height")) {
      const f = treeLast("tree-height", v.input);
      if (v.expected === 0) continue;
      expect(f.banner?.text, v.name).toContain(`is ${v.expected} generation`);
    }
  });
});

describe("the tree panel", () => {
  it("draws the rooms, the walker and the guest book", () => {
    const trace = treeTraceOf("binary-tree-inorder", { values: [5, 3, 8] });
    render(<TreePanel story={treeStory("binary-tree-inorder")} step={trace.steps[5]!} trace={trace} />);
    expect(screen.getAllByTestId("story-node")).toHaveLength(3);
    expect(screen.getByTestId("actor-w")).toBeInTheDocument();
    expect(screen.getByTestId("story-board")).toHaveTextContent("Guest book: 3");
  });
  it("is mounted by the workspace for a tree algorithm and has no accessibility violations", async () => {
    const { container } = render(<Workspace algorithmId="bst-search" />);
    expect(screen.getByTestId("story")).toBeInTheDocument();
    expect(screen.getAllByTestId("story-node").length).toBeGreaterThan(0);
    const r = await axe.run(container, { runOnly: ["wcag2a", "wcag2aa"], rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((x) => x.id)).toEqual([]);
  });
});

// ---------- graph stories ----------
import { GraphPanel } from "../src/components/story/graph-panel";
import { GRAPH_STORIES } from "../src/lib/stories";
import type { GraphTrace } from "../src/lib/stories/types";

const graphTraceOf = (id: string, input: unknown): GraphTrace => traceOf(id, input) as unknown as GraphTrace;
const graphStory = (id: string) => GRAPH_STORIES.find((s) => s.id === id)!;
const graphLast = (id: string, input: unknown) => {
  const t = graphTraceOf(id, input);
  return { t, last: t.steps[t.steps.length - 1]!, f: graphStory(id).frame(t.steps[t.steps.length - 1]!, t) };
};

describe("every graph story frame, on every test vector", () => {
  for (const story of GRAPH_STORIES) {
    it(`${story.id}: each step has clean text and characters on real vertices`, () => {
      expect(vectors(story.id).length).toBeGreaterThan(3);
      for (const v of vectors(story.id)) {
        const trace = graphTraceOf(story.id, v.input);
        for (const step of trace.steps) {
          const f = story.frame(step, trace);
          const where = `${story.id} / ${v.name} / step ${step.index}`;
          const ids = new Set(step.state.nodes.map((n) => n.id));
          for (const a of f.actors) expect(ids.has(a.node), `${where}: actor ${a.id} on ${a.node}`).toBe(true);
          for (const id of Object.keys(f.tones)) expect(ids.has(id), `${where}: tone for ${id}`).toBe(true);
          for (const id of Object.keys(f.badges ?? {})) expect(ids.has(id), `${where}: badge for ${id}`).toBe(true);
          expect([f.says, f.banner?.text ?? "", f.board?.text ?? ""].join(" "), where).not.toMatch(/undefined|NaN|null|\[object/);
          expect(f.inCode ?? "", where).not.toMatch(/undefined|NaN|\[object/);
          expect(f.says.length, where).toBeGreaterThan(15);
        }
      }
    });
  }
});

describe("graph stories agree with the algorithm's real answer", () => {
  it("the two traversals name the expected visiting order", () => {
    for (const id of ["bfs-traversal", "dfs-traversal"]) {
      for (const v of vectors(id)) {
        const { f } = graphLast(id, v.input);
        expect(f.banner?.text, `${id} ${v.name}`).toContain((v.expected as number[]).join(", "));
      }
    }
  });
  it("shortest path and Dijkstra name every expected distance", () => {
    for (const id of ["bfs-shortest-path", "dijkstra"]) {
      for (const v of vectors(id)) {
        const { f } = graphLast(id, v.input);
        const parts = (v.expected as number[]).map((d, i) => `${i}: ${d === -1 ? "no route" : d}`);
        expect(f.banner?.text, `${id} ${v.name}`).toContain(parts.join(", "));
      }
    }
  });
  it("topological sort gives a valid order, or says no order exists", () => {
    for (const v of vectors("topological-sort-kahn")) {
      const { t, last, f } = graphLast("topological-sort-kahn", v.input);
      const n = t.steps[0]!.state.nodes.length;
      if (last.state.output.length === n) expect(f.banner, v.name).toEqual({ kind: "good", text: `A valid order: ${last.state.output.join(", ")}.` });
      else expect(f.banner?.kind, v.name).toBe("bad");
      expect(last.state.output, v.name).toEqual(v.expected);
    }
  });
});

describe("the graph panel", () => {
  it("draws the vertices, the active edge, the badges and the characters", () => {
    const trace = graphTraceOf("dijkstra", { values: [0, 1, 4, 0, 2, 1, 2, 1, 2, 1, 3, 5], vertices: 4, start: 0 });
    render(<GraphPanel story={graphStory("dijkstra")} step={trace.steps[8]!} trace={trace} />);
    expect(screen.getAllByTestId("story-node")).toHaveLength(4);
    expect(screen.getByTestId("actor-d")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-story-active="true"]')).toHaveLength(1);
    expect(screen.getByTestId("story-board")).toBeInTheDocument();
  });
  it("is mounted by the workspace for a graph algorithm and has no accessibility violations", async () => {
    const { container } = render(<Workspace algorithmId="bfs-traversal" />);
    expect(screen.getByTestId("story")).toBeInTheDocument();
    expect(screen.getAllByTestId("story-node").length).toBeGreaterThan(0);
    const r = await axe.run(container, { runOnly: ["wcag2a", "wcag2aa"], rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((x) => x.id)).toEqual([]);
  });
});

// ---------- grid stories ----------
import { GridPanel } from "../src/components/story/grid-panel";
import { GRID_STORIES } from "../src/lib/stories";
import type { GridTrace } from "../src/lib/stories/types";

const gridTraceOf = (id: string, input: unknown): GridTrace => traceOf(id, input) as unknown as GridTrace;
const gridStory = (id: string) => GRID_STORIES.find((s) => s.id === id)!;
const gridLast = (id: string, input: unknown) => {
  const t = gridTraceOf(id, input);
  const last = t.steps[t.steps.length - 1]!;
  return { t, last, f: gridStory(id).frame(last, t) };
};

describe("every grid story frame, on every test vector", () => {
  for (const story of GRID_STORIES) {
    it(`${story.id}: each step has clean text and characters on real cells`, () => {
      expect(vectors(story.id).length).toBeGreaterThan(3);
      for (const v of vectors(story.id)) {
        const trace = gridTraceOf(story.id, v.input);
        for (const step of trace.steps) {
          const f = story.frame(step, trace);
          const where = `${story.id} / ${v.name} / step ${step.index}`;
          const ids = new Set(step.state.cells.map((_, i) => String(i)));
          for (const a of f.actors) expect(ids.has(a.node), `${where}: actor ${a.id} on ${a.node}`).toBe(true);
          for (const id of Object.keys(f.tones)) expect(ids.has(id), `${where}: tone for ${id}`).toBe(true);
          for (const id of Object.keys(f.cells ?? {})) expect(ids.has(id), `${where}: caption for ${id}`).toBe(true);
          expect([f.says, f.banner?.text ?? "", f.board?.text ?? ""].join(" "), where).not.toMatch(/undefined|NaN|null|\[object|\?/);
          expect(f.inCode ?? "", where).not.toMatch(/undefined|NaN|\[object/);
          expect(f.says.length, where).toBeGreaterThan(15);
        }
      }
    });
  }
});

describe("grid stories agree with the algorithm's real answer", () => {
  it("min-path-sum, LCS and edit distance state the expected number", () => {
    for (const id of ["min-path-sum", "longest-common-subsequence", "edit-distance"]) {
      for (const v of vectors(id)) {
        const { f, last } = gridLast(id, v.input);
        if (last.state.cells.length === 0) continue;
        expect(f.banner?.text ?? f.says, `${id} ${v.name}`).toMatch(new RegExp(`\\b${v.expected}\\b|already the same|share ${v.expected}`));
      }
    }
  });
  it("number-of-islands and max-area-of-island state the expected count or size", () => {
    for (const id of ["number-of-islands", "max-area-of-island"]) {
      for (const v of vectors(id)) {
        const { f, last } = gridLast(id, v.input);
        if (last.state.cells.length === 0) continue;
        expect(f.banner?.text, `${id} ${v.name}`).toMatch(new RegExp(`(^|\\s)${v.expected} `));
      }
    }
  });
  it("rotting-oranges says minutes, or that some can never rot", () => {
    for (const v of vectors("rotting-oranges")) {
      const { f, last } = gridLast("rotting-oranges", v.input);
      if (last.state.cells.length === 0) continue;
      if (v.expected === -1) expect(f.banner?.kind, v.name).toBe("bad");
      else expect(f.banner?.text, v.name).toMatch(v.expected === 0 ? /0 minutes/ : new RegExp(`after ${v.expected} minute`));
    }
  });
  it("spiral-order lists the cells in the expected order", () => {
    for (const v of vectors("spiral-order")) {
      const { f, last } = gridLast("spiral-order", v.input);
      if (last.state.cells.length === 0) continue;
      expect(f.banner?.text, v.name).toBe(`Spiral order: ${(v.expected as number[]).join(", ")}.`);
    }
  });
});

describe("the grid panel", () => {
  it("draws the cells, pictures, captions and the character", () => {
    const trace = gridTraceOf("number-of-islands", { grid: [[1, 1, 0], [0, 0, 1], [1, 0, 1]] });
    render(<GridPanel story={gridStory("number-of-islands")} step={trace.steps[4]!} trace={trace} />);
    expect(screen.getAllByTestId("story-node")).toHaveLength(9);
    expect(screen.getByTestId("actor-w")).toBeInTheDocument();
    expect(screen.getByTestId("story-board")).toHaveTextContent("Islands counted: 1");
  });
  it("is mounted by the workspace for a grid algorithm and has no accessibility violations", async () => {
    const { container } = render(<Workspace algorithmId="edit-distance" />);
    expect(screen.getByTestId("story")).toBeInTheDocument();
    expect(screen.getAllByTestId("story-node").length).toBeGreaterThan(0);
    const r = await axe.run(container, { runOnly: ["wcag2a", "wcag2aa"], rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((x) => x.id)).toEqual([]);
  });
});

// ---------- stack and queue (pile) stories ----------
import { PilePanel } from "../src/components/story/pile-panel";
import { PILE_STORIES } from "../src/lib/stories";
import type { PileTrace } from "../src/lib/stories/types";

const pileTraceOf = (id: string, input: unknown): PileTrace => traceOf(id, input) as unknown as PileTrace;
const pileStory = (id: string) => PILE_STORIES.find((s) => s.id === id)!;
const pileLast = (id: string, input: unknown) => {
  const t = pileTraceOf(id, input);
  const last = t.steps[t.steps.length - 1]!;
  return { t, last, f: pileStory(id).frame(last, t) };
};

describe("every pile story frame, on every test vector", () => {
  it("registers the eight stack and queue stories", () => {
    expect(PILE_STORIES.map((s) => s.id).sort()).toEqual(["evaluate-postfix", "largest-rectangle-histogram", "next-greater-element", "queue-enqueue-dequeue", "sliding-window-maximum", "stack-push-pop", "stock-span", "valid-parentheses"]);
  });
  for (const story of PILE_STORIES) {
    it(`${story.id}: each step has clean text and a pile that matches the state`, () => {
      expect(vectors(story.id).length).toBeGreaterThan(3);
      for (const v of vectors(story.id)) {
        const trace = pileTraceOf(story.id, v.input);
        for (const step of trace.steps) {
          const f = story.frame(step, trace);
          const where = `${story.id} / ${v.name} / step ${step.index}`;
          expect(f.pile.length, where).toBe(step.state.items.length);
          for (const p of f.pile) expect(p.text, where).toMatch(/^-?\d+$|^[()[\]{}]$|^[+\-−×÷]$/);
          const text = [f.says, f.banner?.text ?? "", f.board?.text ?? "", ...f.pile.map((p) => `${p.text} ${p.sub ?? ""}`), ...(f.strip?.items.map((i) => i.text) ?? [])].join(" ");
          expect(text, where).not.toMatch(/undefined|NaN|null|\[object|\?/);
          expect(f.inCode ?? "", where).not.toMatch(/undefined|NaN|\[object/);
          expect(f.says.length, where).toBeGreaterThan(8);
          if (f.strip) {
            expect(f.strip.items.length, where).toBe((v.input as { values: unknown[] }).values.length);
            if (f.strip.at !== undefined) expect(f.strip.at, where).toBeLessThan(Math.max(1, f.strip.items.length));
          }
        }
      }
    });
  }
});

describe("pile stories agree with the algorithm's real answer", () => {
  it("stack and queue say what is left", () => {
    for (const id of ["stack-push-pop", "queue-enqueue-dequeue"]) {
      for (const v of vectors(id)) {
        const { f } = pileLast(id, v.input);
        const left = v.expected as number[];
        expect(f.banner?.text, `${id} ${v.name}`).toMatch(left.length ? new RegExp(`${left.join(", ")}\\.$`) : /is empty\.$/);
      }
    }
  });
  it("valid-parentheses says balanced or not", () => {
    for (const v of vectors("valid-parentheses")) {
      const { f } = pileLast("valid-parentheses", v.input);
      expect(f.banner?.kind, v.name).toBe(v.expected === 1 ? "good" : "bad");
      expect(f.banner?.text, v.name).toMatch(v.expected === 1 ? /^Balanced/ : /^Not balanced/);
    }
  });
  it("evaluate-postfix states the result", () => {
    for (const v of vectors("evaluate-postfix")) {
      const { f } = pileLast("evaluate-postfix", v.input);
      expect(f.banner?.text, v.name).toBe(`The expression equals ${v.expected}.`);
    }
  });
  it("next-greater-element, stock-span and sliding-window-maximum list the expected answers", () => {
    for (const [id, prefix] of [["next-greater-element", "The next taller height for each person: "], ["stock-span", "The streak for each day: "], ["sliding-window-maximum", "The tallest in each window: "]] as const) {
      for (const v of vectors(id)) {
        const { f } = pileLast(id, v.input);
        const exp = v.expected as number[];
        if (exp.length === 0) continue;
        expect(f.banner?.text, `${id} ${v.name}`).toBe(`${prefix}${exp.join(", ")}.`);
      }
    }
  });
  it("largest-rectangle-histogram states the best area", () => {
    for (const v of vectors("largest-rectangle-histogram")) {
      const { f } = pileLast("largest-rectangle-histogram", v.input);
      expect(f.banner?.text, v.name).toBe(`The biggest rectangle has area ${v.expected}.`);
    }
  });
});

describe("the pile panel", () => {
  it("draws the strip, the pile and the pointer", () => {
    const trace = pileTraceOf("next-greater-element", { values: [4, 5, 2, 25, 7] });
    render(<PilePanel story={pileStory("next-greater-element")} step={trace.steps[6]!} trace={trace} />);
    expect(screen.getAllByTestId("story-strip-cell")).toHaveLength(5);
    expect(screen.getAllByTestId("story-node").length).toBeGreaterThan(0);
  });
  it("is mounted by the workspace for a stack algorithm and has no accessibility violations", async () => {
    const { container } = render(<Workspace algorithmId="valid-parentheses" />);
    expect(screen.getByTestId("story")).toBeInTheDocument();
    const r = await axe.run(container, { runOnly: ["wcag2a", "wcag2aa"], rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((x) => x.id)).toEqual([]);
  });
  it("is mounted by the workspace for a queue algorithm", () => {
    render(<Workspace algorithmId="sliding-window-maximum" />);
    expect(screen.getByTestId("story")).toBeInTheDocument();
  });
});

// ---------- heap stories ----------
describe("heap stories agree with the algorithm's real answer", () => {
  it("heapify-bottom-up and min-heap-build-insert end with the expected heap on the board and in the banner", () => {
    for (const id of ["heapify-bottom-up", "min-heap-build-insert"]) {
      for (const v of vectors(id)) {
        const expected = v.expected as number[];
        const f = treeLast(id, v.input);
        if (expected.length === 0) { expect(f.banner?.kind, `${id} ${v.name}`).toBe("info"); continue; }
        expect(f.banner?.text, `${id} ${v.name}`).toBe(`The finished chart, top desk first: ${expected.join(", ")}.`);
        expect(f.board?.text, `${id} ${v.name}`).toBe(expected.join(", "));
      }
    }
  });
  it("kth-largest-element names the expected value", () => {
    for (const v of vectors("kth-largest-element")) {
      const f = treeLast("kth-largest-element", v.input);
      expect(f.banner?.text, v.name).toMatch(new RegExp(`largest value is ${v.expected}\\.$`));
    }
  });
  it("heap-sort ends with the sorted row", () => {
    for (const v of vectors("heap-sort")) {
      const t = traceOf("heap-sort", v.input);
      const last = t.steps[t.steps.length - 1]!;
      expect(last.state.values, v.name).toEqual(v.expected);
      const f = storyFor("heap-sort")!.frame(last, t);
      expect(f.banner?.kind, v.name).toBe("good");
      if (last.state.values.length > 0) expect(f.cells.every((c) => c.tone === "good"), v.name).toBe(true);
    }
  });
  it("is mounted by the workspace for a heap algorithm and has no accessibility violations", async () => {
    const { container } = render(<Workspace algorithmId="kth-largest-element" />);
    expect(screen.getByTestId("story")).toBeInTheDocument();
    const r = await axe.run(container, { runOnly: ["wcag2a", "wcag2aa"], rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((x) => x.id)).toEqual([]);
  });
});

// ---------- remaining tree stories ----------
describe("batch 10 tree stories agree with the algorithm's real answer", () => {
  it("level-order-traversal ends with the expected order in the banner and the visit book", () => {
    for (const v of vectors("level-order-traversal")) {
      const expected = v.expected as number[];
      const f = treeLast("level-order-traversal", v.input);
      if (expected.length === 0) { expect(f.banner?.kind, v.name).toBe("info"); continue; }
      expect(f.banner?.text, v.name).toBe(`Floor by floor: ${expected.join(", ")}.`);
      expect(f.board?.text, v.name).toBe(expected.join(", "));
    }
  });
  it("count-leaves states the expected number", () => {
    for (const v of vectors("count-leaves")) {
      const f = treeLast("count-leaves", v.input);
      expect(f.banner?.text, v.name).toBe(`The village has ${v.expected} dead-end ${v.expected === 1 ? "house" : "houses"}.`);
    }
  });
  it("bst-find-min-max states the expected smallest and largest", () => {
    for (const v of vectors("bst-find-min-max")) {
      const [lo, hi] = v.expected as number[];
      const f = treeLast("bst-find-min-max", v.input);
      expect(f.banner?.text, v.name).toBe(`Smallest ${lo}, largest ${hi}.`);
    }
  });
  it("avl-tree-insert states the expected height", () => {
    for (const v of vectors("avl-tree-insert")) {
      const f = treeLast("avl-tree-insert", v.input);
      if (v.expected === 0) { expect(f.banner?.kind, v.name).toBe("info"); continue; }
      expect(f.banner?.text, v.name).toBe(`The village is ${v.expected} ${v.expected === 1 ? "level" : "levels"} tall.`);
    }
  });
  it("is mounted by the workspace for an AVL algorithm and has no accessibility violations", async () => {
    const { container } = render(<Workspace algorithmId="avl-tree-insert" />);
    expect(screen.getByTestId("story")).toBeInTheDocument();
    const r = await axe.run(container, { runOnly: ["wcag2a", "wcag2aa"], rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((x) => x.id)).toEqual([]);
  });
});
