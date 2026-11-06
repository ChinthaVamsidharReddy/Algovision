import { describe, expect, it } from "vitest";
import { LIMIT_PROFILES, parseInt10, parseIntList, resolveLimits, runAlgorithm } from "../src";

describe("limit profiles", () => {
  it("lite is strictly tighter than standard", () => {
    expect(LIMIT_PROFILES.lite.maxSteps).toBeLessThan(LIMIT_PROFILES.standard.maxSteps);
    expect(LIMIT_PROFILES.lite.maxListNodes).toBeLessThan(LIMIT_PROFILES.standard.maxListNodes);
  });
  it("resolveLimits falls back to standard for unknown names", () => {
    expect(resolveLimits("lite").id).toBe("lite");
    expect(resolveLimits("nonsense").id).toBe("standard");
    expect(resolveLimits(undefined).id).toBe("standard");
    expect(resolveLimits(null).id).toBe("standard");
  });
});

describe("parseIntList / parseInt10", () => {
  it("parses commas, spaces, signs and empty text", () => {
    expect(parseIntList("3, 5,8")).toEqual({ ok: true, values: [3, 5, 8] });
    expect(parseIntList("  -1 +2  3 ")).toEqual({ ok: true, values: [-1, 2, 3] });
    expect(parseIntList("")).toEqual({ ok: true, values: [] });
    expect(parseIntList("   ")).toEqual({ ok: true, values: [] });
  });
  it("rejects non-integers with a helpful message", () => {
    for (const bad of ["1, x", "1.5", "1;2", "1e3"]) {
      const r = parseIntList(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toMatch(/whole number/);
    }
  });
  it("parseInt10", () => {
    expect(parseInt10(" 42 ")).toEqual({ ok: true, value: 42 });
    expect(parseInt10("4 2").ok).toBe(false);
    expect(parseInt10("").ok).toBe(false);
  });
});

describe("runAlgorithm input validation", () => {
  const std = LIMIT_PROFILES.standard;
  const lite = LIMIT_PROFILES.lite;
  const errorsFor = (raw: unknown, limits = std) => {
    const r = runAlgorithm("linked-list-insert-head", raw, limits);
    return r.ok ? [] : r.errors;
  };

  it("accepts the largest allowed input", () => {
    const values = Array.from({ length: std.maxListNodes }, (_, i) => i);
    expect(runAlgorithm("linked-list-insert-head", { values, value: std.maxAbsValue }, std).ok).toBe(true);
  });
  it("rejects too many nodes, and the lite profile rejects what standard accepts", () => {
    const tooMany = { values: Array.from({ length: std.maxListNodes + 1 }, () => 1), value: 1 };
    expect(errorsFor(tooMany)[0]?.message).toMatch(/at most 15 nodes/);
    const mid = { values: Array.from({ length: lite.maxListNodes + 1 }, () => 1), value: 1 };
    expect(errorsFor(mid, std)).toEqual([]);
    expect(errorsFor(mid, lite)[0]?.message).toMatch(/at most 8 nodes/);
  });
  it("rejects out-of-range, fractional, missing and wrongly-typed values", () => {
    expect(errorsFor({ values: [], value: 1000 })[0]).toMatchObject({ field: "value" });
    expect(errorsFor({ values: [], value: -1000 })[0]).toMatchObject({ field: "value" });
    expect(errorsFor({ values: [1.5], value: 1 })[0]).toMatchObject({ field: "values" });
    expect(errorsFor({ values: [], value: 1.5 })[0]).toMatchObject({ field: "value" });
    expect(errorsFor({ values: [] }).length).toBeGreaterThan(0);
    expect(errorsFor({ values: "1,2", value: 1 })[0]).toMatchObject({ field: "values" });
    expect(errorsFor({ values: [], value: "1" })[0]).toMatchObject({ field: "value" });
    expect(errorsFor(null).length).toBeGreaterThan(0);
  });
  it("rejects unknown fields rather than ignoring them", () => {
    expect(errorsFor({ values: [], value: 1, extra: true }).length).toBeGreaterThan(0);
  });
  it("reports an unknown algorithm", () => {
    const r = runAlgorithm("nope", {}, std);
    expect(r.ok).toBe(false);
  });
  it("turns a step-limit overrun into an input error instead of throwing", () => {
    const tiny = { ...std, maxSteps: 2 };
    const r = runAlgorithm("linked-list-insert-head", { values: [1], value: 2 }, tiny);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.message).toMatch(/more than 2 steps/);
  });
});
