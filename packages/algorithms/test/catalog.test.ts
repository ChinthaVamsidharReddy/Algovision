import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CATEGORIES, categoryFor, listAlgorithms, listGroups } from "../src";

describe("catalog", () => {
  it("every registered algorithm belongs to a known category", () => {
    for (const { id, content } of listAlgorithms()) {
      expect(categoryFor(content.meta.category), `${id} -> ${content.meta.category}`).toBeDefined();
    }
  });

  it("groups cover every algorithm exactly once, in learning order", () => {
    const groups = listGroups();
    const ids = groups.flatMap((g) => g.algorithms.map((a) => a.id));
    expect(ids.sort()).toEqual(listAlgorithms().map((a) => a.id).sort());
    const sorts = groups.map((g) => g.category.sort);
    expect(sorts).toEqual([...sorts].sort((a, b) => a - b));
  });

  it("ids, slugs and topic slugs are unique and database-safe", () => {
    const slugRe = /^[a-z][a-z0-9-]*$/;
    for (const key of ["id", "slug"] as const) expect(new Set(CATEGORIES.map((c) => c[key])).size).toBe(CATEGORIES.length);
    expect(new Set(CATEGORIES.map((c) => c.topic.slug)).size).toBe(CATEGORIES.length);
    for (const c of CATEGORIES) {
      expect(c.slug).toMatch(slugRe);
      expect(c.topic.slug).toMatch(slugRe);
      expect(c.topic.objectives.length).toBeGreaterThan(0);
    }
  });

  it("the published SQL sync mentions every category that has algorithms", () => {
    const sql = readFileSync(new URL("../../../apps/api/src/main/resources/db/migration/R__catalog_sync.sql", import.meta.url), "utf8");
    for (const g of listGroups()) expect(sql).toContain(`'${g.category.slug}'`);
  });
});
