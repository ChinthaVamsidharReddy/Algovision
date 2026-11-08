import { describe, expect, it } from "vitest";
import { anchorIds, ints, msg, rng, run, within } from "./testkit";

const last = (t: ReturnType<typeof run>) => t.steps.at(-1)!;
describe("wave C: linked lists", () => {
  it("search: equals indexOf; every node is visited up to the hit", () => {
    const r = rng(11);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16), -4, 4);
      const value = ints(r, 1, -5, 5)[0]!;
      const t = run("linked-list-search", { values, value });
      expect(t.summary.result).toBe(values.indexOf(value));
      const a = anchorIds(t);
      expect(a.filter((x) => x === "compare").length).toBe(values.includes(value) ? values.indexOf(value) + 1 : values.length);
    }
    expect(msg("linked-list-search", { values: [1], value: 1000 })).toBeTruthy();
  });
  it("delete-value: removes only the first match", () => {
    const r = rng(12);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16), -4, 4);
      const value = ints(r, 1, -5, 5)[0]!;
      const exp = [...values];
      const i = exp.indexOf(value);
      if (i >= 0) exp.splice(i, 1);
      expect(run("linked-list-delete-value", { values, value }).summary.result).toEqual(exp);
    }
  });
  it("reverse: equals reversed; list is never lost (n nodes while pointers move)", () => {
    const r = rng(13);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 16));
      const t = run("linked-list-reverse", { values });
      expect(t.summary.result).toEqual([...values].reverse());
      expect(anchorIds(t).filter((x) => x === "reverse-link").length).toBe(values.length);
    }
  });
  it("find-middle: equals values[floor(n/2)]; needs at least one node", () => {
    const r = rng(14);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, 1 + Math.floor(r() * 15));
      expect(run("linked-list-find-middle", { values }).summary.result).toBe(values[Math.floor(values.length / 2)]);
    }
    expect(msg("linked-list-find-middle", { values: [] })).toContain("at least");
  });
  it("remove-nth-from-end: equals splice; rejects n out of range", () => {
    const r = rng(15);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, 1 + Math.floor(r() * 15));
      const n = 1 + Math.floor(r() * values.length);
      const exp = [...values];
      exp.splice(values.length - n, 1);
      expect(run("linked-list-remove-nth-from-end", { values, n }).summary.result).toEqual(exp);
    }
    expect(msg("linked-list-remove-nth-from-end", { values: [1, 2], n: 3 })).toContain("between 1 and 2");
  });
  it("insert-at-position: equals splice; rejects bad positions", () => {
    const r = rng(16);
    for (let k = 0; k < 300; k++) {
      const values = ints(r, Math.floor(r() * 15));
      const position = Math.floor(r() * (values.length + 1));
      const value = ints(r, 1, -9, 9)[0]!;
      const exp = [...values];
      exp.splice(position, 0, value);
      expect(run("linked-list-insert-at-position", { values, position, value }).summary.result).toEqual(exp);
    }
    expect(msg("linked-list-insert-at-position", { values: [1], position: 5, value: 1 })).toContain("between 0 and 1");
  });
  it("worst-case step counts fit the standard limit", () => {
    const v = Array.from({ length: 15 }, (_, i) => i + 1);
    within("linked-list-search", { values: v, value: 99 });
    within("linked-list-delete-value", { values: v, value: 99 });
    within("linked-list-reverse", { values: v });
    within("linked-list-find-middle", { values: v });
    within("linked-list-remove-nth-from-end", { values: v, n: 15 });
    within("linked-list-insert-at-position", { values: v.slice(0, 14), position: 14, value: 1 });
    expect(last(run("linked-list-reverse", { values: v })).source).toBeTruthy();
  });
});
