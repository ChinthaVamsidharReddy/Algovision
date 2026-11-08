import { describe, expect, it } from "vitest";
import { LIMIT_PROFILES } from "../src";
import { anchorIds, ints, msg, rng, run, within } from "./testkit";

const fact = (n: number): number => (n === 0 ? 1 : n * fact(n - 1));
const fib = (n: number): number => (n <= 1 ? n : fib(n - 1) + fib(n - 2));
const stackStates = (t: ReturnType<typeof run>) => t.steps.map((s) => (s.state as { items: number[] }).items);

describe("wave D: stacks, queues and recursion", () => {
  it("valid-parentheses: matches a reference checker; stack never holds a closer", () => {
    const r = rng(21);
    const ok = (v: number[]) => {
      const st: number[] = [];
      for (const c of v) {
        if (c % 2 === 1) st.push(c);
        else if (st.pop() !== c - 1) return 0;
      }
      return st.length === 0 ? 1 : 0;
    };
    for (let k = 0; k < 400; k++) {
      const values = ints(r, Math.floor(r() * 16), 1, 6);
      const t = run("valid-parentheses", { values });
      expect(t.summary.result).toBe(ok(values));
      for (const items of stackStates(t)) for (const c of items) expect(c % 2).toBe(1);
    }
    expect(msg("valid-parentheses", { values: [7] })).toContain("1 to 6");
  });
  it("next-greater-element: equals the brute force; the stack holds decreasing values", () => {
    const r = rng(22);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16), -6, 6);
      const t = run("next-greater-element", { values });
      expect(t.summary.result).toEqual(values.map((x, i) => values.slice(i + 1).find((y) => y > x) ?? -1));
      for (const items of stackStates(t)) for (let i = 1; i < items.length; i++) expect(values[items[i - 1]!]!).toBeGreaterThanOrEqual(values[items[i]!]!);
    }
  });
  it("evaluate-postfix: equals a reference evaluator; rejects invalid expressions", () => {
    const r = rng(23);
    let valid = 0;
    for (let k = 0; k < 2000 && valid < 200; k++) {
      const values = ints(r, 1 + Math.floor(r() * 9), -4, 9);
      const p = (await_ok(values));
      if (p === null) continue;
      valid++;
      expect(run("evaluate-postfix", { values }).summary.result).toBe(p);
    }
    expect(valid).toBeGreaterThan(20);
    expect(msg("evaluate-postfix", { values: [1, -1] })).toContain("needs two numbers");
    expect(msg("evaluate-postfix", { values: [1, 2] })).toContain("too many numbers");
    expect(msg("evaluate-postfix", { values: [1, 0, -4] })).toContain("divides by zero");
    expect(msg("evaluate-postfix", { values: [] })).toContain("at least one");
    expect(msg("evaluate-postfix", { values: [100] })).toContain("0 to 99");
  });
  it("circular-queue: equals a plain FIFO with a capacity bound", () => {
    const r = rng(24);
    for (let k = 0; k < 400; k++) {
      const capacity = 1 + Math.floor(r() * 6);
      const values = ints(r, Math.floor(r() * 16), -3, 3);
      const q: number[] = [];
      for (const op of values) {
        if (op !== 0) { if (q.length < capacity) q.push(op); } else q.shift();
      }
      expect(run("circular-queue", { values, capacity }).summary.result).toEqual(q);
    }
    expect(msg("circular-queue", { values: [1], capacity: 0 })).toContain("between 1 and");
  });
  it("sliding-window-maximum: equals brute force; the deque stays decreasing", () => {
    const r = rng(25);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, 1 + Math.floor(r() * 15), -9, 9);
      const w = 1 + Math.floor(r() * values.length);
      const t = run("sliding-window-maximum", { values, k: w });
      expect(t.summary.result).toEqual(Array.from({ length: values.length - w + 1 }, (_, i) => Math.max(...values.slice(i, i + w))));
      for (const items of stackStates(t)) for (let i = 1; i < items.length; i++) expect(items[i - 1]!).toBeGreaterThan(items[i]!);
    }
    expect(msg("sliding-window-maximum", { values: [1, 2], k: 3 })).toContain("between 1 and 2");
  });
  it("recursion: factorial, fibonacci, power, digits and hanoi match the closed forms; the stack drains", () => {
    for (let n = 0; n <= 12; n++) {
      const t = run("factorial", { n });
      expect(t.summary.result).toBe(fact(n));
      expect(Math.max(...stackStates(t).map((s) => s.length))).toBe(n + 1);
      expect(stackStates(t).at(-1)).toEqual([]);
    }
    for (let n = 0; n <= 9; n++) expect(run("fibonacci-recursive", { n }).summary.result).toBe(fib(n));
    for (let base = -9; base <= 9; base++) for (let exp = 0; exp <= 9; exp++) expect(run("power-fast-exponentiation", { base, exp }).summary.result).toBe(base ** exp);
    for (const n of [0, 5, 10, 99, 4825, 999999]) expect(run("sum-of-digits-recursive", { n }).summary.result).toBe(String(n).split("").reduce((s, d) => s + Number(d), 0));
    for (let n = 1; n <= 7; n++) expect(run("tower-of-hanoi-moves", { n }).summary.result).toBe(2 ** n - 1);
    const a = anchorIds(run("fibonacci-recursive", { n: 4 }));
    expect(a.filter((x) => x === "entry").length).toBe(9); // fib(4) makes 9 calls
    expect(msg("factorial", { n: 13 })).toContain("between 0 and 12");
    expect(msg("tower-of-hanoi-moves", { n: 0 })).toContain("between 1 and");
  });
  it("limits: worst cases fit standard; the lite profile rejects inputs it cannot animate", () => {
    const v15 = Array.from({ length: 15 }, (_, i) => (i % 2 === 0 ? 1 : 2));
    within("valid-parentheses", { values: v15 });
    within("next-greater-element", { values: Array.from({ length: 15 }, (_, i) => i) });
    within("evaluate-postfix", { values: [1, 2, 3, 4, 5, 6, 7, 8, -1, -1, -1, -1, -1, -1, -1] });
    within("circular-queue", { values: Array.from({ length: 15 }, () => 1), capacity: 15 });
    within("sliding-window-maximum", { values: Array.from({ length: 15 }, (_, i) => 15 - i), k: 3 });
    within("fibonacci-recursive", { n: 9 });
    within("tower-of-hanoi-moves", { n: 7 });
    within("factorial", { n: 12 });
    const lite = LIMIT_PROFILES.lite;
    expect(await_parse("tower-of-hanoi-moves", { n: 7 }, lite)).toBe(false);
    expect(await_parse("tower-of-hanoi-moves", { n: 3 }, lite)).toBe(true);
    expect(await_parse("fibonacci-recursive", { n: 5 }, lite)).toBe(true);
  });
});

import { getAlgorithm } from "../src";
function await_parse(id: string, input: Record<string, unknown>, limits: typeof LIMIT_PROFILES.lite): boolean {
  return getAlgorithm(id)!.definition.parseInput(input, limits).ok;
}
function await_ok(values: number[]): number | null {
  const st: number[] = [];
  for (const t of values) {
    if (t >= 0) { st.push(t); continue; }
    if (st.length < 2) return null;
    const b = st.pop()!, a = st.pop()!;
    if (t === -4 && b === 0) return null;
    const v = t === -1 ? a + b : t === -2 ? a - b : t === -3 ? a * b : Math.trunc(a / b);
    if (Math.abs(v) > 1_000_000) return null;
    st.push(v);
  }
  return st.length === 1 ? st[0]! : null;
}
