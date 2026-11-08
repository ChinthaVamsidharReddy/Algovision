import { describe, expect, it } from "vitest";
import { validateTrace, type ExecutionTrace } from "@algovision/trace-schema";
import { LIMIT_PROFILES, listAlgorithms } from "../src";
import { readVectors } from "./helpers";

/** Generic contract for every algorithm from wave 4 onward: vectors, anchors, determinism and the lite profile. */
const standard = LIMIT_PROFILES.standard;
const lite = LIMIT_PROFILES.lite;
const wave = listAlgorithms().filter((a) => a.content.meta.wave >= 4);
const anchorsOf = (t: ExecutionTrace) => t.steps.map((s) => (s.source.kind === "anchor" ? s.source.id : "?"));

describe("wave 4+ contract", () => {
  it("covers a meaningful number of algorithms", () => {
    expect(wave.length).toBeGreaterThanOrEqual(9);
  });
  for (const a of wave) {
    const id = a.content.meta.id;
    const run = (input: unknown, profile = standard): ExecutionTrace => {
      const p = a.definition.parseInput(input, profile);
      if (!p.ok) throw new Error(`${id}: ${JSON.stringify(p)}`);
      return a.definition.run(p.value as never, profile);
    };
    it(`${id}: every shared vector matches the executor and every trace validates`, () => {
      for (const v of readVectors(id)) {
        const t = run(v.input);
        expect(t.summary.result, `${id} / ${v.name}`).toEqual(v.expected);
        const checked = validateTrace(t);
        expect(checked.ok, `${id} / ${v.name}: ${JSON.stringify(checked)}`).toBe(true);
      }
    });
    it(`${id}: emitted anchors are declared and every declared anchor is reachable`, () => {
      const declared = new Set(a.content.meta.anchors.map((x) => x.id));
      const used = new Set<string>();
      for (const v of [{ input: a.content.meta.defaultInput }, ...readVectors(id)]) {
        for (const anchor of anchorsOf(run(v.input))) {
          expect(declared.has(anchor), `${id}: undeclared anchor ${anchor}`).toBe(true);
          used.add(anchor);
        }
      }
      expect([...declared].filter((x) => !used.has(x)), `${id}: anchors never emitted`).toEqual([]);
    });
    it(`${id}: the default input is deterministic and fits the lite profile`, () => {
      const base = a.content.meta.defaultInput;
      expect(JSON.stringify(run(base))).toBe(JSON.stringify(run(base)));
      expect(run(base, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
    });
    it(`${id}: explanations are non-empty plain text`, () => {
      for (const s of run(a.content.meta.defaultInput).steps) expect(s.explanation.trim().length).toBeGreaterThan(0);
    });
  }
});
