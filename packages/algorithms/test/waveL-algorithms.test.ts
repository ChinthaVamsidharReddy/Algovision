import { describe, expect, it } from "vitest";
import { LIMIT_PROFILES } from "../src";
import * as S from "../src/algorithms/interview-strings";
import { rng } from "./testkit";

const std = LIMIT_PROFILES.standard;
const lite = LIMIT_PROFILES.lite;
const ok = <T>(r: { ok: boolean; value?: T }): T => { if (!r.ok) throw new Error(JSON.stringify(r)); return r.value as T; };
const word = (r: () => number, max = 15, alpha = 3): string => Array.from({ length: Math.floor(r() * (max + 1)) }, () => String.fromCharCode(97 + Math.floor(r() * alpha))).join("");
const subs = (s: string) => { const out: string[] = []; for (let a = 0; a < s.length; a++) for (let b = a + 1; b <= s.length; b++) out.push(s.slice(a, b)); return out; };
const isPal = (t: string) => t === [...t].reverse().join("");

describe("wave L: string algorithms equal brute-force references", () => {
  it("palindrome, first unique and compression", () => {
    const r = rng(1201);
    for (let k = 0; k < 300; k++) {
      const s = word(r, 15, 2 + (k % 3));
      expect(S.runPalindrome(ok(S.parsePalindrome({ s }, std)), std).summary.result).toBe(isPal(s) ? 1 : 0);
      const first = [...s].findIndex((c) => s.split(c).length - 1 === 1);
      expect(S.runUnique({ s }, std).summary.result).toBe(first);
      const runs = s.match(/(.)\1*/g) ?? [];
      expect(S.runCompress({ s }, std).summary.result).toBe(runs.reduce((t, g) => t + 1 + (g.length > 1 ? String(g.length).length : 0), 0));
    }
  });
  it("longest no-repeat, palindromic substrings and replacement", () => {
    const r = rng(1202);
    for (let k = 0; k < 300; k++) {
      const s = word(r, 15, 2 + (k % 4));
      expect(S.runNoRepeat({ s }, std).summary.result).toBe(Math.max(0, ...subs(s).filter((t) => new Set(t).size === t.length).map((t) => t.length)));
      expect(S.runLongestPal({ s }, std).summary.result).toBe(Math.max(0, ...subs(s).filter(isPal).map((t) => t.length)));
      expect(S.runCountPal({ s }, std).summary.result).toBe(subs(s).filter(isPal).length);
      const kk = Math.floor(r() * 5);
      const best = Math.max(0, ...subs(s).filter((t) => t.length - Math.max(...[...new Set(t)].map((c) => t.split(c).length - 1)) <= kk).map((t) => t.length));
      expect(S.runReplace({ s, k: kk }, std).summary.result).toBe(best);
    }
  });
});

describe("wave L: input validation and traces", () => {
  it("rejects capitals, digits, spaces, long text and bad k with readable messages", () => {
    expect(S.parsePalindrome({ s: "Abc" }, std).ok).toBe(false);
    expect(S.parsePalindrome({ s: "ab c" }, std).ok).toBe(false);
    expect(S.parsePalindrome({ s: "a1" }, std).ok).toBe(false);
    expect(S.parsePalindrome({ s: "a".repeat(16) }, std).ok).toBe(false);
    expect(S.parsePalindrome({ s: "a".repeat(9) }, lite).ok).toBe(false);
    expect(S.parsePalindrome({ s: 5 }, std).ok).toBe(false);
    expect(S.parsePalindrome({ s: "" }, std).ok).toBe(true);
    expect(S.parseReplace({ s: "ab", k: 9 }, std).ok).toBe(false);
    expect(S.parseReplace({ s: "ab", k: 1.5 }, std).ok).toBe(false);
    expect(S.parseReplace({ s: "ab" }, std).ok).toBe(false);
    const bad = S.parsePalindrome({ s: "ABC" }, std);
    expect(!bad.ok && bad.errors[0]!.field).toBe("s");
  });
  it("every trace draws the text as characters and ends on a done step", () => {
    const t = S.runLongestPal({ s: "babad" }, std);
    for (const step of t.steps) {
      expect(step.state.kind).toBe("array");
      expect((step.state as { chars?: boolean }).chars).toBe(true);
    }
    expect(t.steps.at(-1)!.event.type).toBe("done");
    expect((t.steps[0]!.state as { values: number[] }).values).toEqual([...("babad")].map((c) => c.charCodeAt(0)));
  });
  it("worst cases fit each profile's step budget", () => {
    for (const [p, n] of [[lite, 8], [std, 15]] as const) {
      const same = "a".repeat(n);
      const mixed = "abcdefghijklmno".slice(0, n);
      for (const s of [same, mixed]) {
        for (const run of [S.runPalindrome, S.runUnique, S.runNoRepeat, S.runLongestPal, S.runCountPal, S.runCompress]) expect(run({ s }, p).steps.length).toBeLessThanOrEqual(p.maxSteps);
        expect(S.runReplace({ s, k: 3 }, p).steps.length).toBeLessThanOrEqual(p.maxSteps);
      }
    }
  });
});
