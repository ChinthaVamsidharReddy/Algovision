import { z } from "zod";
import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { ArrayTrace, cell, indexRef } from "./array-trace";

/** Milestone 11: string algorithms. The string is drawn as an array of characters (schema 1.3 `chars`). */
export interface Txt { readonly s: string }
export interface TxtK extends Txt { readonly k: number }

const codes = (s: string): number[] => [...s].map((c) => c.charCodeAt(0));
const q = (s: string): string => `"${s}"`;
const visited = (n: number, lo: number, hi: number) => Array.from({ length: n }, (_, k) => k).filter((k) => k < lo || k > hi).map((k) => cell(k, "visited"));
const span = (lo: number, hi: number, role: "window" | "found" = "window") => {
  const out = [];
  for (let k = lo; k <= hi; k++) out.push(cell(k, role));
  return out;
};

/** Validates {s} (lowercase a-z, length within the profile) plus optional whole-number fields. */
export function parseText(raw: unknown, limits: LimitProfile, opts: { minLength?: number; k?: { max: number; label: string } } = {}): InputResult<Record<string, unknown>> {
  const shape: Record<string, z.ZodType> = {
    s: z
      .string({ error: "The text must be a string of letters." })
      .max(limits.maxArrayLength, `The text can have at most ${limits.maxArrayLength} characters.`)
      .regex(/^[a-z]*$/, "Use lowercase letters a to z only (no spaces, digits or capitals)."),
  };
  if (opts.k) {
    shape.k = z.number({ error: `${opts.k.label} must be a whole number.` }).int(`${opts.k.label} must be a whole number.`).min(0, `${opts.k.label} must be between 0 and ${opts.k.max}.`).max(opts.k.max, `${opts.k.label} must be between 0 and ${opts.k.max}.`);
  }
  const parsed = z.strictObject(shape).safeParse(raw);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i): FieldError => ({ field: String(i.path[0] ?? "input"), message: i.message })) };
  const data = parsed.data as Record<string, unknown>;
  if (opts.minLength && (data.s as string).length < opts.minLength) return { ok: false, errors: [{ field: "s", message: `Enter at least ${opts.minLength} character${opts.minLength === 1 ? "" : "s"}.` }] };
  return { ok: true, value: data };
}
const parseT = (raw: unknown, limits: LimitProfile) => parseText(raw, limits) as InputResult<Txt>;

// ------------------------------------------------------------ valid palindrome (two pointers)
export const PALINDROME_ID = "is-palindrome-string";
export const parsePalindrome = parseT;
export function runPalindrome({ s }: Txt, limits: LimitProfile): ExecutionTrace {
  const n = s.length;
  const T = new ArrayTrace(PALINDROME_ID, { s }, codes(s), limits, true);
  T.step({ type: "init" }, "entry", `Check whether ${q(s)} reads the same forwards and backwards. Compare the outer characters, then move both ends inwards.`, {});
  let low = 0;
  let high = n - 1;
  T.step({ type: "init" }, "init", n > 0 ? "Put low on the first character and high on the last." : "The string is empty, so there is nothing to compare and it counts as a palindrome.", { low, high }, { low, high }, n > 0 ? [cell(0, "pointer", "low"), cell(n - 1, "pointer", "high")] : []);
  while (low < high) {
    const a = s[low]!;
    const b = s[high]!;
    const same = a === b;
    T.step({ type: "compare", a: indexRef(low), b: indexRef(high) }, "compare", same ? `"${a}" and "${b}" match.` : `"${a}" and "${b}" are different.`, { low, high }, { low, high }, [...visited(n, low, high), cell(low, same ? "found" : "compared", "low"), cell(high, same ? "found" : "compared", "high")]);
    if (!same) {
      T.step({ type: "done" }, "mismatch", `A mismatched pair means ${q(s)} is not a palindrome.`, { low, high, result: 0 }, { low, high }, [cell(low, "compared", "low"), cell(high, "compared", "high")]);
      return T.finish(0, "O(n)", "O(1)");
    }
    low++;
    high--;
    T.step({ type: "movePointer", pointer: "low", to: indexRef(low) }, "advance", `Move low right and high left: low = ${low}, high = ${high}.`, { low, high }, { low, high }, visited(n, low, high));
  }
  T.step({ type: "done" }, "finish", `Every pair matched, so ${q(s)} is a palindrome.`, { result: 1 }, {}, span(0, n - 1, "found"));
  return T.finish(1, "O(n)", "O(1)");
}
export const isPalindromeString: AlgorithmDefinition<Txt> = { id: PALINDROME_ID, parseInput: parsePalindrome, run: runPalindrome };

// ------------------------------------------------------------ first unique character
export const UNIQUE_ID = "first-unique-character";
export const parseUnique = parseT;
export function runUnique({ s }: Txt, limits: LimitProfile): ExecutionTrace {
  const n = s.length;
  const T = new ArrayTrace(UNIQUE_ID, { s }, codes(s), limits, true);
  T.step({ type: "init" }, "entry", `Find the index of the first character in ${q(s)} that appears exactly once. Count every letter first, then scan from the left.`, {});
  const count = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const ch = s[i]!;
    count.set(ch, (count.get(ch) ?? 0) + 1);
    T.step({ type: "movePointer", pointer: "i", to: indexRef(i) }, "count", `Count "${ch}": it has now been seen ${count.get(ch)} time${count.get(ch) === 1 ? "" : "s"}.`, { i, seen: count.get(ch)! }, { i }, [...span(0, i - 1).map((h) => ({ ...h, role: "visited" as const })), cell(i, "active", "i")]);
  }
  for (let i = 0; i < n; i++) {
    const ch = s[i]!;
    const c = count.get(ch)!;
    if (c === 1) {
      T.step({ type: "done" }, "found", `"${ch}" appears once, so the answer is index ${i}.`, { i, seen: c, result: i }, { i }, [cell(i, "found", "unique")]);
      return T.finish(i, "O(n)", "O(1)");
    }
    T.step({ type: "compare", a: indexRef(i), b: indexRef(i) }, "scan", `"${ch}" appears ${c} times, so it is not unique. Keep scanning.`, { i, seen: c }, { i }, [...span(0, i - 1).map((h) => ({ ...h, role: "visited" as const })), cell(i, "compared", "i")]);
  }
  T.step({ type: "done" }, "none", n === 0 ? "The string is empty, so there is no unique character. Answer -1." : "Every character repeats, so the answer is -1.", { result: -1 }, {}, visited(n, 0, -1));
  return T.finish(-1, "O(n)", "O(1)");
}
export const firstUniqueCharacter: AlgorithmDefinition<Txt> = { id: UNIQUE_ID, parseInput: parseUnique, run: runUnique };

// ------------------------------------------------------------ longest substring without repeating characters
export const NOREPEAT_ID = "longest-substring-no-repeat";
export const parseNoRepeat = parseT;
export function runNoRepeat({ s }: Txt, limits: LimitProfile): ExecutionTrace {
  const n = s.length;
  const T = new ArrayTrace(NOREPEAT_ID, { s }, codes(s), limits, true);
  T.step({ type: "init" }, "entry", `Find the longest stretch of ${q(s)} with no repeated letter. Grow a window on the right and slide its left edge past any repeat.`, {});
  const last = new Map<string, number>();
  let left = 0;
  let best = 0;
  T.step({ type: "init" }, "init", "Start with an empty window and a best length of 0.", { left, best }, {});
  for (let right = 0; right < n; right++) {
    const ch = s[right]!;
    const prev = last.get(ch);
    T.step({ type: "movePointer", pointer: "right", to: indexRef(right) }, "loop", `Take "${ch}" at index ${right} into the window.`, { left, right, best }, { left, right }, [...span(left, right - 1), cell(right, "active", "right")]);
    if (prev !== undefined && prev >= left) {
      left = prev + 1;
      T.step({ type: "movePointer", pointer: "left", to: indexRef(left) }, "shrink", `"${ch}" was already at index ${prev}, inside the window. Move left to ${left} so the window has no repeat.`, { left, right, best }, { left, right }, [...span(left, right - 1), cell(right, "compared", "right")]);
    }
    last.set(ch, right);
    const len = right - left + 1;
    const better = len > best;
    if (better) best = len;
    T.step({ type: "assign", target: indexRef(right), value: len }, "extend", better ? `The window ${left}..${right} has length ${len}, a new best.` : `The window ${left}..${right} has length ${len}, which does not beat ${best}.`, { left, right, best }, { left, right }, span(left, right, better ? "found" : "window"), []);
  }
  T.step({ type: "done" }, "finish", `The longest stretch with no repeated letter has length ${best}.`, { best, result: best }, {}, []);
  return T.finish(best, "O(n)", "O(1)");
}
export const longestSubstringNoRepeat: AlgorithmDefinition<Txt> = { id: NOREPEAT_ID, parseInput: parseNoRepeat, run: runNoRepeat };

// ------------------------------------------------------------ palindromes by expanding around a centre
function expandTrace(id: string, { s }: Txt, limits: LimitProfile, mode: "longest" | "count"): ExecutionTrace {
  const n = s.length;
  const T = new ArrayTrace(id, { s }, codes(s), limits, true);
  T.step({ type: "init" }, "entry", mode === "longest" ? `Find the length of the longest palindromic piece of ${q(s)}. Every palindrome has a centre, so try each centre and grow outwards while the ends match.` : `Count the palindromic pieces of ${q(s)}. Every palindrome has a centre, so try each centre and count each outward step that still matches.`, {});
  let best = 0;
  let total = 0;
  T.step({ type: "init" }, "init", mode === "longest" ? "Start with a best length of 0." : "Start with a count of 0.", mode === "longest" ? { best: 0 } : { total }, {});
  for (let c = 0; c < 2 * n - 1; c++) {
    let left = c >> 1;
    let right = left + (c & 1);
    const kind = c & 1 ? "between two characters" : "on one character";
    T.step({ type: "init" }, "centre", `Centre ${c + 1} of ${2 * n - 1}, ${kind}: start with left = ${left}, right = ${right}.`, mode === "longest" ? { left, right, best } : { left, right, total }, { left, right }, [cell(left, "pointer", "left"), ...(right !== left ? [cell(right, "pointer", "right")] : [])]);
    while (left >= 0 && right < n && s[left] === s[right]) {
      const len = right - left + 1;
      if (mode === "longest") best = Math.max(best, len);
      else total++;
      T.step({ type: "compare", a: indexRef(left), b: indexRef(right) }, "expand", mode === "longest" ? `"${s[left]}" equals "${s[right]}", so ${q(s.slice(left, right + 1))} is a palindrome of length ${len}. Best is ${best}.` : `"${s[left]}" equals "${s[right]}", so ${q(s.slice(left, right + 1))} is a palindrome. Count = ${total}.`, mode === "longest" ? { left, right, best } : { left, right, total }, { left, right }, span(left, right, "found"));
      left--;
      right++;
    }
    const why = left < 0 || right >= n ? "the edge of the string is reached" : `"${s[left]}" and "${s[right]}" differ`;
    T.step({ type: "init" }, "stop", `Stop this centre: ${why}.`, mode === "longest" ? { best } : { total }, {}, left >= 0 && right < n ? [cell(left, "compared", "left"), cell(right, "compared", "right")] : []);
  }
  const result = mode === "longest" ? best : total;
  T.step({ type: "done" }, "finish", mode === "longest" ? `The longest palindromic piece has length ${best}.` : `${total} palindromic piece${total === 1 ? "" : "s"} in total.`, { result }, {}, []);
  return T.finish(result, "O(n^2)", "O(1)");
}
export const LONGEST_PAL_ID = "longest-palindromic-substring";
export const COUNT_PAL_ID = "count-palindromic-substrings";
export const parseLongestPal = parseT;
export const parseCountPal = parseT;
export const runLongestPal = (i: Txt, l: LimitProfile) => expandTrace(LONGEST_PAL_ID, i, l, "longest");
export const runCountPal = (i: Txt, l: LimitProfile) => expandTrace(COUNT_PAL_ID, i, l, "count");
export const longestPalindromicSubstring: AlgorithmDefinition<Txt> = { id: LONGEST_PAL_ID, parseInput: parseLongestPal, run: runLongestPal };
export const countPalindromicSubstrings: AlgorithmDefinition<Txt> = { id: COUNT_PAL_ID, parseInput: parseCountPal, run: runCountPal };

// ------------------------------------------------------------ run-length compression length
export const COMPRESS_ID = "string-compression-length";
export const parseCompress = parseT;
export function runCompress({ s }: Txt, limits: LimitProfile): ExecutionTrace {
  const n = s.length;
  const T = new ArrayTrace(COMPRESS_ID, { s }, codes(s), limits, true);
  T.step({ type: "init" }, "entry", `Work out how long ${q(s)} becomes when each run of equal letters is written as the letter followed by its length (the length is left out when it is 1).`, {});
  let total = 0;
  T.step({ type: "init" }, "init", "Start with a compressed length of 0.", { total }, {});
  let i = 0;
  while (i < n) {
    const ch = s[i]!;
    let j = i;
    while (j < n && s[j] === ch) j++;
    const run = j - i;
    T.step({ type: "movePointer", pointer: "i", to: indexRef(i) }, "run", `A run of "${ch}" starts at index ${i} and is ${run} long (indexes ${i} to ${j - 1}).`, { i, run, total }, { i }, span(i, j - 1));
    const add = 1 + (run > 1 ? String(run).length : 0);
    total += add;
    T.step({ type: "assign", target: indexRef(i), value: add }, "emit", run > 1 ? `Write "${ch}${run}": that is ${add} characters. Total = ${total}.` : `Write "${ch}" alone: 1 character. Total = ${total}.`, { i, run, total }, { i }, span(i, j - 1, "found"));
    i = j;
  }
  T.step({ type: "done" }, "finish", `The compressed string has length ${total}.`, { total, result: total }, {}, []);
  return T.finish(total, "O(n)", "O(1)");
}
export const stringCompressionLength: AlgorithmDefinition<Txt> = { id: COMPRESS_ID, parseInput: parseCompress, run: runCompress };

// ------------------------------------------------------------ longest repeating character replacement
export const REPLACE_ID = "longest-repeating-replacement";
export const parseReplace = (raw: unknown, limits: LimitProfile) => parseText(raw, limits, { k: { max: 8, label: "Replacements k" } }) as InputResult<TxtK>;
export function runReplace({ s, k }: TxtK, limits: LimitProfile): ExecutionTrace {
  const n = s.length;
  const T = new ArrayTrace(REPLACE_ID, { s, k }, codes(s), limits, true);
  T.step({ type: "init" }, "entry", `Find the longest stretch of ${q(s)} that becomes one repeated letter after replacing at most ${k} letter${k === 1 ? "" : "s"}. The window is allowed while (its size - the highest letter count seen so far) is at most ${k}.`, { k });
  const freq = new Array<number>(26).fill(0);
  let left = 0;
  let top = 0;
  let best = 0;
  T.step({ type: "init" }, "init", "Start with an empty window, no letter counts and a best length of 0.", { k, left, top, best }, {});
  for (let right = 0; right < n; right++) {
    const idx = s.charCodeAt(right) - 97;
    freq[idx] = freq[idx]! + 1;
    top = Math.max(top, freq[idx]!);
    T.step({ type: "movePointer", pointer: "right", to: indexRef(right) }, "grow", `Add "${s[right]}" to the window. The highest letter count seen in any window so far is ${top}.`, { k, left, right, top, best }, { left, right }, [...span(left, right - 1), cell(right, "active", "right")]);
    if (right - left + 1 - top > k) {
      const gone = s.charCodeAt(left) - 97;
      freq[gone] = freq[gone]! - 1;
      left++;
      T.step({ type: "movePointer", pointer: "left", to: indexRef(left) }, "shrink", `The window needs ${right - left + 2 - top} replacements, more than k = ${k}. Drop "${s[left - 1]}" from the left: left = ${left}.`, { k, left, right, top, best }, { left, right }, span(left, right));
    }
    const len = right - left + 1;
    const better = len > best;
    if (better) best = len;
    T.step({ type: "assign", target: indexRef(right), value: len }, "record", better ? `The window ${left}..${right} (length ${len}) is allowed and is a new best.` : `The window ${left}..${right} (length ${len}) is allowed but does not beat ${best}.`, { k, left, right, top, best }, { left, right }, span(left, right, better ? "found" : "window"));
  }
  T.step({ type: "done" }, "finish", `The longest allowed stretch has length ${best}.`, { best, result: best }, {}, []);
  return T.finish(best, "O(n)", "O(1)");
}
export const longestRepeatingReplacement: AlgorithmDefinition<TxtK> = { id: REPLACE_ID, parseInput: parseReplace, run: runReplace };
