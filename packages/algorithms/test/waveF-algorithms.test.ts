import { describe, expect, it } from "vitest";
import { ints, msg, rng, run, within } from "./testkit";

const table = (keys: number[], size: number): number[] => {
  const t = new Array<number>(size).fill(-1);
  for (const k of keys) {
    let i = k % size;
    for (let s = 0; s < size; s++, i = (i + 1) % size) if (t[i] === -1) { t[i] = k; break; }
  }
  return t;
};

describe("wave F: hashing", () => {
  it("insert: equals the reference table; no key is lost unless the table is full", () => {
    const r = rng(41);
    for (let k = 0; k < 300; k++) {
      const size = 1 + Math.floor(r() * 15);
      const values = ints(r, Math.floor(r() * 16), 0, 40);
      const t = run("hash-table-insert-linear-probing", { values, size });
      const exp = table(values, size);
      expect(t.summary.result).toEqual(exp);
      expect((t.steps.at(-1)!.state as { values: number[] }).values).toEqual(exp);
      if (values.length <= size) expect(exp.filter((x) => x !== -1).length).toBe(values.length);
    }
    expect(msg("hash-table-insert-linear-probing", { values: [-1], size: 3 })).toContain("0 to 999");
    expect(msg("hash-table-insert-linear-probing", { values: [1], size: 0 })).toContain("between 1 and");
  });
  it("search: equals a reference lookup that stops at the first empty slot", () => {
    const r = rng(42);
    for (let k = 0; k < 300; k++) {
      const size = 1 + Math.floor(r() * 15);
      const values = ints(r, Math.floor(r() * 16), 0, 30);
      const key = ints(r, 1, 0, 30)[0]!;
      const tb = table(values, size);
      let i = key % size;
      let exp = -1;
      for (let s = 0; s < size; s++, i = (i + 1) % size) {
        if (tb[i] === -1) break;
        if (tb[i] === key) { exp = i; break; }
      }
      expect(run("hash-table-search", { values, size, key }).summary.result).toBe(exp);
    }
  });
  it("two-sum-hash: returns a valid pair exactly when one exists", () => {
    const r = rng(43);
    for (let k = 0; k < 400; k++) {
      const values = ints(r, Math.floor(r() * 16), -6, 6);
      const target = ints(r, 1, -12, 12)[0]!;
      const res = run("two-sum-hash", { values, target }).summary.result as number[];
      let exists = false;
      for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) if (values[i]! + values[j]! === target) exists = true;
      if (!exists) expect(res).toEqual([]);
      else {
        expect(res.length).toBe(2);
        expect(res[0]!).toBeLessThan(res[1]!);
        expect(values[res[0]!]! + values[res[1]!]!).toBe(target);
      }
    }
    expect(msg("two-sum-hash", { values: [1], target: 5000 })).toContain("Target sum must be between");
  });
  it("first-repeating-element: equals the reference and rejects negatives", () => {
    const r = rng(44);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16), 0, 9);
      const s = new Set<number>();
      let exp = -1;
      for (const v of values) { if (s.has(v)) { exp = v; break; } s.add(v); }
      expect(run("first-repeating-element", { values }).summary.result).toBe(exp);
    }
    expect(msg("first-repeating-element", { values: [-1] })).toContain("0 to 999");
  });
  it("count-frequencies: pairs are correct, sum to the length, in first-appearance order", () => {
    const r = rng(45);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16), -4, 4);
      const res = run("count-frequencies", { values }).summary.result as number[];
      let total = 0;
      const order: number[] = [];
      for (let i = 0; i < res.length; i += 2) { order.push(res[i]!); total += res[i + 1]!; expect(res[i + 1]!).toBe(values.filter((x) => x === res[i]).length); }
      expect(total).toBe(values.length);
      expect(order).toEqual([...new Set(values)]);
    }
  });
  it("worst cases fit the standard step limit", () => {
    within("hash-table-insert-linear-probing", { values: Array(15).fill(5), size: 15 });
    within("hash-table-insert-linear-probing", { values: Array(15).fill(5), size: 4 });
    within("hash-table-search", { values: Array(15).fill(5), size: 15, key: 6 });
    within("two-sum-hash", { values: Array.from({ length: 15 }, (_, i) => i), target: 999 });
    within("first-repeating-element", { values: Array.from({ length: 15 }, (_, i) => i) });
    within("count-frequencies", { values: Array.from({ length: 15 }, (_, i) => i) });
  });
});
