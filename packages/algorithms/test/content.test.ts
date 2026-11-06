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
        // An empty array is only required when the algorithm accepts one (e.g. find-maximum needs a value).
        const extras = Object.fromEntries(Object.keys(entry.content.meta.defaultInput).map((k) => [k, 0]));
        const acceptsEmpty = entry.definition.parseInput({ ...extras, values: [] }, LIMIT_PROFILES.standard).ok;
        if (acceptsEmpty) expect(vs.some((v) => v.input.values.length === 0)).toBe(true);
        expect(vs.some((v) => v.input.values.length === 1)).toBe(true);
        expect(vs.some((v) => v.input.values.some((x) => Math.abs(x) === LIMIT_PROFILES.standard.maxAbsValue))).toBe(true);
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
