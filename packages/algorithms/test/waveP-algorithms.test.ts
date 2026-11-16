import { describe, expect, it } from "vitest";
import { assertValidTrace, type TrieState } from "@algovision/trace-schema";
import { LIMIT_PROFILES } from "../src";
import * as S from "../src/algorithms/interview-trie";
import { rng } from "./testkit";

const std = LIMIT_PROFILES.standard;
const lite = LIMIT_PROFILES.lite;
const must = <T,>(r: { ok: boolean } & Record<string, unknown>): T => {
  if (!r.ok) throw new Error(JSON.stringify(r));
  return r.value as T;
};
const word = (r: () => number, len: number, alpha: number) => Array.from({ length: len }, () => String.fromCharCode(97 + Math.floor(r() * alpha))).join("");
const substrings = (s: string) => {
  const set = new Set<string>();
  for (let a = 0; a < s.length; a++) for (let b = a + 1; b <= s.length; b++) set.add(s.slice(a, b));
  return set;
};
const occurrences = (s: string, t: string) => { let c = 0; for (let k = 0; k + t.length <= s.length; k++) if (s.startsWith(t, k)) c++; return c; };
const finalState = (t: { steps: { state: unknown }[] }) => t.steps[t.steps.length - 1]!.state as TrieState;
/** Reads every root-to-node path from a trie state. */
const paths = (st: TrieState): Map<string, number> => {
  const by = new Map(st.nodes.map((n) => [n.id, n]));
  const out = new Map<string, number>();
  const walk = (id: string, prefix: string) => {
    const n = by.get(id)!;
    if (prefix) out.set(prefix, n.count);
    for (const c of n.children) walk(c, prefix + by.get(c)!.label);
  };
  walk(st.root!, "");
  return out;
};

describe("trie-distinct-substrings", () => {
  it("counts the distinct substrings, and the final trie holds exactly those substrings", () => {
    const r = rng(31);
    for (let t = 0; t < 200; t++) {
      const s = word(r, Math.floor(r() * 16), t % 2 ? 2 : 5);
      const trace = S.runDistinct(must(S.trieDistinctSubstrings.parseInput({ s }, std)), std);
      assertValidTrace(trace);
      const expected = substrings(s);
      expect(trace.summary.result, s).toBe(expected.size);
      expect(new Set(paths(finalState(trace)).keys()), s).toEqual(expected);
    }
  });
  it("matches known answers", () => {
    const n = (s: string) => S.runDistinct({ s }, std).summary.result;
    expect(n("")).toBe(0);
    expect(n("a")).toBe(1);
    expect(n("banana")).toBe(15);
    expect(n("aaaa")).toBe(4);
    expect(n("abcd")).toBe(10);
  });
  it("creates every node once, in order, with one insertNode event per node", () => {
    const trace = S.runDistinct({ s: "abab" }, std);
    const inserted = trace.steps.filter((s) => s.event.type === "insertNode").length;
    expect(inserted).toBe(substrings("abab").size);
    expect(finalState(trace).nodes.length).toBe(inserted + 1);
  });
  it("rejects capitals, digits and over-long text, and stays inside the step budget", () => {
    expect(S.trieDistinctSubstrings.parseInput({ s: "Ab" }, std).ok).toBe(false);
    expect(S.trieDistinctSubstrings.parseInput({ s: "a".repeat(16) }, std).ok).toBe(false);
    expect(S.runDistinct({ s: "abcdefghijklmno" }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(S.runDistinct({ s: "abcdefgh" }, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});

describe("longest-repeated-substring", () => {
  it("returns the longest substring that occurs at least twice, and node counts equal occurrences", () => {
    const r = rng(32);
    for (let t = 0; t < 200; t++) {
      const s = word(r, Math.floor(r() * 16), t % 2 ? 2 : 4);
      const trace = S.runRepeated(must(S.longestRepeatedSubstring.parseInput({ s }, std)), std);
      assertValidTrace(trace);
      let best = 0;
      for (const sub of substrings(s)) if (occurrences(s, sub) >= 2) best = Math.max(best, sub.length);
      expect(trace.summary.result, s).toBe(best);
      for (const [path, count] of paths(finalState(trace))) expect(count, `${s}:${path}`).toBe(occurrences(s, path));
    }
  });
  it("matches known answers", () => {
    const n = (s: string) => S.runRepeated({ s }, std).summary.result;
    expect(n("")).toBe(0);
    expect(n("abc")).toBe(0);
    expect(n("banana")).toBe(3);
    expect(n("aaa")).toBe(2);
    expect(n("abab")).toBe(2);
  });
  it("stays inside the step budget", () => {
    expect(S.runRepeated({ s: "aaaaaaaaaaaaaaa" }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(S.runRepeated({ s: "abcdefgh" }, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});
