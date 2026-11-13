import { describe, expect, it } from "vitest";
import { LIMIT_PROFILES, PATHS, PREREQUISITES, PRACTICE, generateQuiz, listAlgorithms, nextStep, pathsContaining, practiceFor, prerequisitesOf, runAlgorithm } from "../src";

const ids = new Set(listAlgorithms().map((a) => a.id));

describe("learning paths", () => {
  it("only reference algorithms that exist, never repeat a step, and have unique path ids", () => {
    expect(new Set(PATHS.map((p) => p.id)).size).toBe(PATHS.length);
    for (const p of PATHS) {
      expect(p.steps.length).toBeGreaterThanOrEqual(5);
      expect(new Set(p.steps).size).toBe(p.steps.length);
      for (const s of p.steps) expect(ids.has(s), `${p.id}: unknown step ${s}`).toBe(true);
    }
  });
  it("cover every algorithm at least once", () => {
    const missing = [...ids].filter((id) => pathsContaining(id).length === 0);
    expect(missing).toEqual([]);
  });
  it("have prerequisites that exist, are acyclic, and come earlier in a shared path", () => {
    for (const [id, pre] of Object.entries(PREREQUISITES)) {
      expect(ids.has(id), `unknown algorithm ${id}`).toBe(true);
      for (const p of pre) { expect(ids.has(p), `${id} needs unknown ${p}`).toBe(true); expect(p).not.toBe(id); }
    }
    const state = new Map<string, 1 | 2>();
    const visit = (id: string, chain: string[]) => {
      if (state.get(id) === 2) return;
      expect(state.get(id) === 1, `cycle: ${[...chain, id].join(" > ")}`).toBe(false);
      state.set(id, 1);
      for (const p of prerequisitesOf(id)) visit(p, [...chain, id]);
      state.set(id, 2);
    };
    for (const id of ids) visit(id, []);
    const misordered: string[] = [];
    for (const path of PATHS) {
      path.steps.forEach((step, i) => {
        for (const p of prerequisitesOf(step)) {
          const at = path.steps.indexOf(p);
          if (at >= i) misordered.push(`${path.id}: ${p} must come before ${step}`);
        }
      });
    }
    expect(misordered).toEqual([]);
  });
  it("suggest the next unfinished step whose prerequisites are done", () => {
    const sorting = PATHS.find((p) => p.id === "sorting-and-searching")!;
    expect(nextStep(sorting, new Set())).toBe("bubble-sort");
    expect(nextStep(sorting, new Set(["bubble-sort"]))).toBe("selection-sort");
    expect(nextStep(sorting, new Set(sorting.steps))).toBeNull();
  });
});

describe("practice links", () => {
  it("point to algorithms that exist and to https LeetCode problem pages", () => {
    for (const [id, links] of Object.entries(PRACTICE)) {
      expect(ids.has(id), `unknown algorithm ${id}`).toBe(true);
      for (const l of links) expect(l.url).toMatch(/^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/);
    }
    expect(practiceFor("no-such-algorithm")).toEqual([]);
    expect(Object.keys(PRACTICE).length).toBeGreaterThanOrEqual(50);
  });
});

describe("generated quizzes", () => {
  it("are well-formed and true to the trace for every algorithm's default input", () => {
    let total = 0;
    for (const entry of listAlgorithms()) {
      const run = runAlgorithm(entry.id, entry.content.meta.defaultInput, LIMIT_PROFILES.standard);
      expect(run.ok, entry.id).toBe(true);
      if (!run.ok) continue;
      const labels = Object.fromEntries(entry.content.meta.anchors.map((a) => [a.id, a.label]));
      const quiz = generateQuiz(run.trace, labels, { seed: 7, count: 5 });
      expect(quiz.length, `${entry.id} should have questions`).toBeGreaterThanOrEqual(2);
      expect(quiz.length).toBeLessThanOrEqual(5);
      for (const q of quiz) {
        total++;
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.options.length).toBeLessThanOrEqual(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        const next = run.trace.steps[q.step + 1];
        if (q.kind === "next-variable") {
          const name = /what will (.+) be\?/.exec(q.prompt)![1]!;
          expect(String(next!.variables.find((v) => v.name === name)!.value)).toBe(q.options[q.answer]);
        } else if (q.kind === "next-part") {
          const src = next!.source;
          expect(src.kind === "anchor" && labels[src.id]).toBe(q.options[q.answer]);
        } else {
          expect(q.step).toBe(run.trace.steps.length - 1);
          expect(String(run.trace.summary.result)).toBe(q.options[q.answer]);
        }
        expect(q.explanation.length).toBeGreaterThan(0);
      }
    }
    expect(total).toBeGreaterThan(300);
  });
  it("are deterministic for a seed and vary between seeds", () => {
    const entry = listAlgorithms().find((a) => a.id === "binary-search")!;
    const run = runAlgorithm(entry.id, entry.content.meta.defaultInput, LIMIT_PROFILES.standard);
    if (!run.ok) throw new Error("run failed");
    const labels = Object.fromEntries(entry.content.meta.anchors.map((a) => [a.id, a.label]));
    const a = generateQuiz(run.trace, labels, { seed: 1 });
    expect(generateQuiz(run.trace, labels, { seed: 1 })).toEqual(a);
    const seeds = new Set(Array.from({ length: 12 }, (_, s) => JSON.stringify(generateQuiz(run.trace, labels, { seed: s + 1 }).map((q) => [q.step, q.options]))));
    expect(seeds.size).toBeGreaterThan(3);
  });
});
