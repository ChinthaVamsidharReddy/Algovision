import { describe, expect, it } from "vitest";
import { LANGUAGES, LIMIT_PROFILES, listAlgorithms } from "../src";
import { readVectors } from "./helpers";

/**
 * The sync contract: every anchor a trace can emit resolves to at least one real line in EACH of
 * the four languages, and every declared anchor is actually used by some vector's trace.
 */
describe("trace anchors <-> code line maps", () => {
  for (const entry of listAlgorithms()) {
    describe(entry.id, () => {
      const declared = new Set(entry.content.meta.anchors.map((a) => a.id));
      const used = new Set<string>();

      for (const vector of readVectors(entry.id)) {
        it(`${vector.name}: every step resolves in all languages`, () => {
          const parsed = entry.definition.parseInput(vector.input, LIMIT_PROFILES.standard);
          if (!parsed.ok) throw new Error("invalid vector");
          const trace = entry.definition.run(parsed.value, LIMIT_PROFILES.standard);
          for (const step of trace.steps) {
            expect(step.source.kind).toBe("anchor");
            if (step.source.kind !== "anchor") continue;
            used.add(step.source.id);
            expect(declared.has(step.source.id)).toBe(true);
            for (const lang of LANGUAGES) {
              const ranges = entry.content.code[lang.id].anchors[step.source.id];
              expect(ranges?.length ?? 0, `${lang.id} has no line for ${step.source.id}`).toBeGreaterThan(0);
            }
          }
        });
      }

      it("no declared anchor is dead (unused by every vector)", () => {
        expect([...declared].filter((a) => !used.has(a))).toEqual([]);
      });
    });
  }
});
