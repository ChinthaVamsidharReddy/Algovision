import { describe, expect, it } from "vitest";
import { listAlgorithms } from "@algovision/algorithms";
import { RESERVED_KEYS, parseUrlState, serializeUrlState } from "../src/lib/url-state";

const q = (s: string) => new URLSearchParams(s);
const names = ["values", "value"];

describe("parseUrlState", () => {
  it("defaults when empty", () => {
    expect(parseUrlState(q(""), names)).toMatchObject({ language: "java", step: 0, speed: 1, inputs: {} });
  });
  it("reads valid params (step is 1-based in the URL)", () => {
    const s = parseUrlState(q("lang=python&step=3&speed=2&values=1,2&value=5"), names);
    expect(s).toMatchObject({ language: "python", step: 2, speed: 2, inputs: { values: "1,2", value: "5" } });
  });
  it("falls back on garbage", () => {
    const s = parseUrlState(q("lang=cobol&step=-4&speed=9&limits=weird"), names);
    expect(s).toMatchObject({ language: "java", step: 0, speed: 1 });
    expect(s.limits.id).toBe("standard");
    expect(parseUrlState(q("step=abc"), names).step).toBe(0);
    expect(parseUrlState(q("step=99999999"), names).step).toBe(0);
  });
  it("limits: query overrides env, env overrides default", () => {
    expect(parseUrlState(q(""), names, "lite").limits.id).toBe("lite");
    expect(parseUrlState(q("limits=standard"), names, "lite").limits.id).toBe("standard");
  });
  it("only reads declared input names and caps their length", () => {
    const s = parseUrlState(q(`evil=1&values=${"9".repeat(900)}`), names);
    expect(s.inputs).not.toHaveProperty("evil");
    expect(s.inputs.values).toHaveLength(500);
  });
});

describe("serializeUrlState", () => {
  const base = { language: "java", step: 0, speed: 1, inputs: { values: "3, 5", value: "1" }, isDefaultInput: true, limitsId: "standard", envLimitsId: "standard" } as const;
  it("omits defaults", () => expect(serializeUrlState(base)).toBe(""));
  it("includes non-defaults and strips whitespace from inputs", () => {
    const out = serializeUrlState({ ...base, language: "c", step: 2, speed: 1.5, isDefaultInput: false, limitsId: "lite" });
    expect(Object.fromEntries(q(out))).toEqual({ lang: "c", step: "3", speed: "1.5", values: "3,5", value: "1", limits: "lite" });
  });
  it("round-trips", () => {
    const out = serializeUrlState({ ...base, language: "cpp", step: 4, speed: 0.5, isDefaultInput: false });
    expect(parseUrlState(q(out), names)).toMatchObject({ language: "cpp", step: 4, speed: 0.5, inputs: { values: "3,5", value: "1" } });
  });
});

describe("algorithm input names never collide with reserved query keys", () => {
  for (const { id, content } of listAlgorithms()) {
    it(id, () => {
      for (const input of content.meta.inputs) expect((RESERVED_KEYS as readonly string[]).includes(input.name)).toBe(false);
    });
  }
});
