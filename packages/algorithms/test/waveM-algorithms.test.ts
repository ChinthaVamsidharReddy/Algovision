import { describe, expect, it } from "vitest";
import { assertValidTrace } from "@algovision/trace-schema";
import { LIMIT_PROFILES } from "../src";
import * as G from "../src/algorithms/interview-grid";
import { rng } from "./testkit";

const std = LIMIT_PROFILES.standard;
const lite = LIMIT_PROFILES.lite;
type Grid = number[][];
const rgrid = (r: () => number, mx: number, side = 6, minSide = 1): Grid => {
  const R = minSide + Math.floor(r() * (side - minSide + 1));
  const C = minSide + Math.floor(r() * (side - minSide + 1));
  return Array.from({ length: R }, () => Array.from({ length: C }, () => Math.floor(r() * (mx + 1))));
};
const word = (r: () => number, max = 8): string => Array.from({ length: Math.floor(r() * (max + 1)) }, () => String.fromCharCode(97 + Math.floor(r() * 3))).join("");
const comps = (g: Grid): number[] => {
  const seen = new Set<string>();
  const out: number[] = [];
  g.forEach((row, r) => row.forEach((v, c) => {
    if (v !== 1 || seen.has(`${r},${c}`)) return;
    const stack = [[r, c]] as [number, number][];
    seen.add(`${r},${c}`);
    let n = 0;
    while (stack.length) {
      const [a, b] = stack.pop()!;
      n++;
      for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const x = a + da, y = b + db;
        if (g[x]?.[y] === 1 && !seen.has(`${x},${y}`)) { seen.add(`${x},${y}`); stack.push([x, y]); }
      }
    }
    out.push(n);
  }));
  return out;
};
const rotRef = (g0: Grid): number => {
  let g = g0.map((r) => [...r]);
  let t = 0;
  while (g.some((r) => r.includes(1))) {
    const next = g.map((r) => [...r]);
    let changed = false;
    g.forEach((row, r) => row.forEach((v, c) => {
      if (v !== 2) return;
      for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) if (g[r + da]?.[c + db] === 1) { next[r + da]![c + db] = 2; changed = true; }
    }));
    if (!changed) return -1;
    g = next;
    t++;
  }
  return t;
};
const lcsRef = (s: string, t: string): number => {
  const m = new Map<string, number>();
  const f = (a: number, b: number): number => {
    if (a === s.length || b === t.length) return 0;
    const k = `${a},${b}`;
    if (m.has(k)) return m.get(k)!;
    const v = s[a] === t[b] ? 1 + f(a + 1, b + 1) : Math.max(f(a + 1, b), f(a, b + 1));
    m.set(k, v);
    return v;
  };
  return f(0, 0);
};
const editRef = (s: string, t: string): number => {
  const m = new Map<string, number>();
  const f = (a: number, b: number): number => {
    if (a === s.length) return t.length - b;
    if (b === t.length) return s.length - a;
    const k = `${a},${b}`;
    if (m.has(k)) return m.get(k)!;
    const v = s[a] === t[b] ? f(a + 1, b + 1) : 1 + Math.min(f(a + 1, b), f(a, b + 1), f(a + 1, b + 1));
    m.set(k, v);
    return v;
  };
  return f(0, 0);
};
const spiralRef = (g0: Grid): number[] => {
  let g = g0.map((r) => [...r]);
  const out: number[] = [];
  while (g.length) {
    out.push(...g.shift()!);
    g = g.length ? g[0]!.map((_, i) => g.map((row) => row[row.length - 1 - i]!)) : [];
  }
  return out;
};
const minPathRef = (g: Grid): number => {
  const m = new Map<string, number>();
  const f = (r: number, c: number): number => {
    if (r === g.length - 1 && c === g[0]!.length - 1) return g[r]![c]!;
    const k = `${r},${c}`;
    if (m.has(k)) return m.get(k)!;
    const v = g[r]![c]! + Math.min(r + 1 < g.length ? f(r + 1, c) : Infinity, c + 1 < g[0]!.length ? f(r, c + 1) : Infinity);
    m.set(k, v);
    return v;
  };
  return f(0, 0);
};
const ok = <T>(r: { ok: boolean; value?: T }): T => { if (!r.ok) throw new Error(JSON.stringify(r)); return r.value as T; };

describe("wave M: grid algorithms equal references", () => {
  it("islands, area, rotting oranges, min path and spiral", () => {
    const r = rng(1301);
    for (let k = 0; k < 250; k++) {
      const land = rgrid(r, 1);
      expect(G.runIslands({ grid: land }, std).summary.result).toBe(comps(land).length);
      expect(G.runArea({ grid: land }, std).summary.result).toBe(Math.max(0, ...comps(land)));
      const orange = rgrid(r, 2);
      expect(G.runRotting({ grid: orange }, std).summary.result).toBe(rotRef(orange));
      const cost = rgrid(r, 9);
      expect(G.runMinPath({ grid: cost }, std).summary.result).toBe(minPathRef(cost));
      expect(G.runSpiral({ grid: cost }, std).summary.result).toEqual(spiralRef(cost));
    }
    expect(G.runIslands({ grid: [] }, std).summary.result).toBe(0);
    expect(G.runSpiral({ grid: [] }, std).summary.result).toEqual([]);
  });
  it("LCS and edit distance", () => {
    const r = rng(1302);
    for (let k = 0; k < 250; k++) {
      const s = word(r), t = word(r);
      expect(G.runLcs({ s, t }, std).summary.result).toBe(lcsRef(s, t));
      expect(G.runEdit({ s, t }, std).summary.result).toBe(editRef(s, t));
    }
  });
});

describe("wave M: validation, schema validity and budgets", () => {
  it("rejects bad grids and texts with readable field errors", () => {
    expect(G.parseIslands({ grid: [[1, 2]] }, std).ok).toBe(false);
    expect(G.parseIslands({ grid: [[1, 0], [1]] }, std).ok).toBe(false);
    expect(G.parseIslands({ grid: [[]] }, std).ok).toBe(false);
    expect(G.parseIslands({ grid: Array.from({ length: 7 }, () => [0]) }, std).ok).toBe(false);
    expect(G.parseIslands({ grid: [[0, 0, 0, 0, 0]] }, lite).ok).toBe(false);
    expect(G.parseIslands({ grid: [] }, std).ok).toBe(true);
    expect(G.parseMinPath({ grid: [] }, std).ok).toBe(false);
    expect(G.parseRotting({ grid: [[3]] }, std).ok).toBe(false);
    expect(G.parseRotting({ grid: [[2, 1, 0]] }, std).ok).toBe(true);
    expect(G.parseLcs({ s: "abcdefghi", t: "a" }, std).ok).toBe(false);
    expect(G.parseLcs({ s: "abcdef", t: "a" }, lite).ok).toBe(false);
    expect(G.parseLcs({ s: "Ab", t: "a" }, std).ok).toBe(false);
    const bad = G.parseIslands({ grid: [[7]] }, std);
    expect(!bad.ok && bad.errors[0]!.field).toBe("grid");
    expect(ok(G.parseEdit({ s: "", t: "" }, std))).toEqual({ s: "", t: "" });
  });
  it("traces are valid grid traces", () => {
    for (const t of [G.runIslands({ grid: [[1, 0], [1, 1]] }, std), G.runRotting({ grid: [[2, 1], [1, 0]] }, std), G.runSpiral({ grid: [[1, 2, 3], [4, 5, 6]] }, std), G.runEdit({ s: "ab", t: "b" }, std), G.runLcs({ s: "", t: "x" }, std)]) {
      expect(t.stateKind).toBe("grid");
      expect(() => assertValidTrace(t)).not.toThrow();
      expect(t.steps.at(-1)!.event.type).toBe("done");
    }
    const e = G.runEdit({ s: "ab", t: "b" }, std);
    expect(e.steps[0]!.state).toMatchObject({ rows: 3, cols: 2, rowLabels: ["", "a", "b"], colLabels: ["", "b"] });
  });
  it("worst cases fit each profile's step budget", () => {
    for (const [p, side, text] of [[lite, 4, 5], [std, 6, 8]] as const) {
      const full = (v: number): Grid => Array.from({ length: side }, () => Array.from({ length: side }, () => v));
      const checker: Grid = Array.from({ length: side }, (_, r) => Array.from({ length: side }, (_, c) => (r + c) % 2));
      for (const g of [full(1), full(0), checker]) {
        expect(G.runIslands({ grid: g }, p).steps.length).toBeLessThanOrEqual(p.maxSteps);
        expect(G.runArea({ grid: g }, p).steps.length).toBeLessThanOrEqual(p.maxSteps);
        expect(G.runMinPath({ grid: g }, p).steps.length).toBeLessThanOrEqual(p.maxSteps);
        expect(G.runSpiral({ grid: g }, p).steps.length).toBeLessThanOrEqual(p.maxSteps);
      }
      const rot = full(1);
      rot[0]![0] = 2;
      expect(G.runRotting({ grid: rot }, p).steps.length).toBeLessThanOrEqual(p.maxSteps);
      const spread = full(2);
      expect(G.runRotting({ grid: spread }, p).steps.length).toBeLessThanOrEqual(p.maxSteps);
      for (const [s, t] of [["a".repeat(text), "b".repeat(text)], ["ab".repeat(4).slice(0, text), "ba".repeat(4).slice(0, text)]] as const) {
        expect(G.runLcs({ s, t }, p).steps.length).toBeLessThanOrEqual(p.maxSteps);
        expect(G.runEdit({ s, t }, p).steps.length).toBeLessThanOrEqual(p.maxSteps);
      }
    }
  });
});
