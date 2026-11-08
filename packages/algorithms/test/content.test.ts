import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  LANGUAGES,
  LANGUAGE_IDS,
  LIMIT_PROFILES,
  contentIds,
  definitionIds,
  getAlgorithm,
  listAlgorithms,
} from "../src";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { algorithmDirs, contentRoot, readVectors } from "./helpers";

const MetaSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  title: z.string().min(1),
  category: z.string().min(1),
  wave: z.number().int().min(0),
  stateKind: z.enum(["linkedList", "array", "stack", "queue", "tree"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  summary: z.string().min(10),
  complexity: z.strictObject({ time: z.string().min(1), space: z.string().min(1) }),
  defaultInput: z.record(z.string(), z.unknown()),
  inputs: z
    .array(z.strictObject({ name: z.string(), kind: z.enum(["intList", "int"]), label: z.string(), note: z.string().optional(), hint: z.string().optional() }))
    .min(1),
  io: z.strictObject({ inputs: z.array(z.string()).min(1), output: z.enum(["int", "intList"]) }),
  anchors: z.array(z.strictObject({ id: z.string(), label: z.string().min(1) })).min(1),
});

describe("completeness: every algorithm ships everything the contract requires", () => {
  it("content directories, definitions and generated content agree", () => {
    expect([...contentIds()].sort()).toEqual(algorithmDirs());
    expect([...definitionIds()].sort()).toEqual(algorithmDirs());
  });

  it("all four languages are configured", () => {
    expect(LANGUAGE_IDS).toEqual(["java", "python", "cpp", "c"]);
  });

  for (const entry of listAlgorithms()) {
    describe(entry.id, () => {
      it("has valid metadata and a default input the executor accepts", () => {
        expect(MetaSchema.safeParse(entry.content.meta).success).toBe(true);
        const parsed = entry.definition.parseInput(entry.content.meta.defaultInput, LIMIT_PROFILES.lite);
        expect(parsed.ok).toBe(true);
      });

      it("has vectors, harnesses and solution files for every language", () => {
        expect(readVectors(entry.id).length).toBeGreaterThanOrEqual(5);
        const harness: Record<string, string> = { java: "Main.java", python: "main.py", cpp: "main.cpp", c: "main.c" };
        for (const lang of LANGUAGES) {
          expect(existsSync(join(contentRoot, entry.id, `solution.${lang.extension}`))).toBe(true);
          expect(existsSync(join(contentRoot, entry.id, "harness", harness[lang.id]!))).toBe(true);
        }
      });

      it("covers vectors for the empty, single and limit cases", () => {
        const vs = readVectors(entry.id);
        // Scalar-only algorithms (e.g. factorial) have no array: they must cover their smallest and largest accepted value.
        if (!("values" in entry.content.meta.defaultInput)) {
          const candidates = [...Array.from({ length: 2001 }, (_, i) => i - 1000), 999999, 1000000];
          for (const name of Object.keys(entry.content.meta.defaultInput)) {
            const accepted = (x: number) => entry.definition.parseInput({ ...vs[0]!.input, [name]: x }, LIMIT_PROFILES.standard).ok;
            const ok = candidates.filter(accepted);
            const seen = new Set(vs.map((v) => (v.input as unknown as Record<string, number>)[name]));
            expect(seen.has(ok[0]!), `${name}: smallest accepted value ${ok[0]} is covered`).toBe(true);
            expect(seen.has(ok[ok.length - 1]!), `${name}: largest accepted value ${ok[ok.length - 1]} is covered`).toBe(true);
          }
          return;
        }
        // An empty array is only required when the algorithm accepts one (e.g. find-maximum needs a value).
        const extras = Object.fromEntries(Object.keys(entry.content.meta.defaultInput).map((k) => [k, 0]));
        const acceptsEmpty = entry.definition.parseInput({ ...extras, values: [] }, LIMIT_PROFILES.standard).ok;
        if (acceptsEmpty) expect(vs.some((v) => v.input.values.length === 0)).toBe(true);
        // A one-value vector is required only when a one-value array is valid (the knapsack takes weight/value pairs, so it never is).
        const acceptsSingle = entry.definition.parseInput({ ...vs[0]!.input, values: [1] }, LIMIT_PROFILES.standard).ok;
        if (acceptsSingle) expect(vs.some((v) => v.input.values.length === 1)).toBe(true);
        // The limit is the largest magnitude the algorithm accepts: 999 normally, less where the algorithm restricts the range (counting sort).
        const probe = (x: number) => entry.definition.parseInput({ ...vs[0]!.input, values: [x] }, LIMIT_PROFILES.standard).ok;
        let limit = LIMIT_PROFILES.standard.maxAbsValue;
        while (limit > 0 && !probe(limit) && !probe(-limit)) limit--;
        if (limit > 0) expect(vs.some((v) => v.input.values.some((x) => Math.abs(x) === limit))).toBe(true);
      });
    });
  }
});

describe("line maps and displayed source", () => {
  for (const entry of listAlgorithms()) {
    const declared = entry.content.meta.anchors.map((a) => a.id);
    for (const lang of LANGUAGES) {
      describe(`${entry.id} / ${lang.id}`, () => {
        const file = entry.content.code[lang.id];

        it("has exactly the declared anchors", () => {
          expect(Object.keys(file.anchors).sort()).toEqual([...declared].sort());
        });

        it("ranges are in bounds, ordered and non-overlapping", () => {
          const claimed = new Set<number>();
          for (const ranges of Object.values(file.anchors)) {
            for (const r of ranges) {
              expect(r.start).toBeGreaterThanOrEqual(1);
              expect(r.end).toBeLessThanOrEqual(file.lines.length);
              expect(r.end).toBeGreaterThanOrEqual(r.start);
              for (let l = r.start; l <= r.end; l++) {
                expect(claimed.has(l)).toBe(false);
                claimed.add(l);
              }
            }
          }
        });

        it("every anchored line holds real code", () => {
          for (const ranges of Object.values(file.anchors)) {
            for (const r of ranges) {
              for (let l = r.start; l <= r.end; l++) expect(file.lines[l - 1]!.trim()).not.toBe("");
            }
          }
        });

        it("displayed source has no marker comments and no trailing whitespace", () => {
          for (const line of file.lines) {
            expect(line).not.toMatch(/@a\s/);
            expect(line).toBe(line.trimEnd());
          }
        });

        it("matches the source file apart from the markers", () => {
          const raw = readFileSync(join(contentRoot, entry.id, `solution.${lang.extension}`), "utf8");
          const stripped = raw
            .trimEnd()
            .split("\n")
            .map((l) => l.replace(new RegExp(`\\s*${lang.comment.replace("/", "\\/")}\\s*@a\\s+\\S+\\s*$`), "").trimEnd());
          expect(file.lines).toEqual(stripped);
        });
      });
    }
  }

  it("c: consecutive lines with the same anchor merge into one range", () => {
    const c = getAlgorithm("linked-list-insert-head")!.content.code.c;
    expect(c.anchors["create-node"]).toHaveLength(1);
    const range = c.anchors["create-node"]![0]!;
    expect(range.end - range.start).toBe(1);
  });
});
