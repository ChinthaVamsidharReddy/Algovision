import { describe, expect, it } from "vitest";
import { validateTrace, type GraphState } from "@algovision/trace-schema";
import { LIMIT_PROFILES } from "../src";
import { msg, rng, run } from "./testkit";

type Rng = () => number;
const pairs = (r: Rng, n: number, k: number, directed = false): [number, number][] => {
  const all: [number, number][] = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) all.push(r() < 0.5 || directed ? [a, b] : [b, a]);
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [all[i], all[j]] = [all[j]!, all[i]!]; }
  return all.slice(0, k);
};
const flat = (e: number[][]) => e.flat();
const adjl = (n: number, e: number[][], directed = false) => {
  const a: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of e) { a[u!]!.push(v!); if (!directed) a[v!]!.push(u!); }
  return a.map((x) => x.sort((p, q) => p - q));
};
const bfs = (n: number, e: number[][], s: number) => {
  const a = adjl(n, e); const seen = new Set([s]); const q = [s]; const out: number[] = [];
  while (q.length) { const u = q.shift()!; out.push(u); for (const v of a[u]!) if (!seen.has(v)) { seen.add(v); q.push(v); } }
  return out;
};
const dfs = (n: number, e: number[][], s: number) => {
  const a = adjl(n, e); const seen = new Set<number>(); const out: number[] = [];
  const go = (u: number) => { seen.add(u); out.push(u); for (const v of a[u]!) if (!seen.has(v)) go(v); };
  go(s); return out;
};
const dist = (n: number, e: number[][], s: number) => {
  const d = new Array<number>(n).fill(-1); d[s] = 0; const a = adjl(n, e); const q = [s];
  while (q.length) { const u = q.shift()!; for (const v of a[u]!) if (d[v] === -1) { d[v] = d[u]! + 1; q.push(v); } }
  return d;
};
const components = (n: number, e: number[][]) => {
  const label = new Array<number>(n).fill(-1); let c = 0; const a = adjl(n, e);
  for (let s = 0; s < n; s++) { if (label[s] !== -1) continue; const st = [s]; label[s] = c; while (st.length) { const u = st.pop()!; for (const v of a[u]!) if (label[v] === -1) { label[v] = c; st.push(v); } } c++; }
  return c;
};
const dijkstra = (n: number, e: number[][], s: number) => {
  // Bellman-Ford style relaxation: an independent method from the O(V²) selection in the executor.
  const d = new Array<number>(n).fill(Infinity); d[s] = 0;
  for (let i = 0; i < n; i++) for (const [u, v, w] of e) { if (d[u!]! + w! < d[v!]!) d[v!] = d[u!]! + w!; if (d[v!]! + w! < d[u!]!) d[u!] = d[v!]! + w!; }
  return d.map((x) => (Number.isFinite(x) ? x : -1));
};
const graphs = (t: ReturnType<typeof run>) => t.steps.map((s) => s.state as unknown as GraphState);

describe("wave H: graphs", () => {
  it("bfs and dfs visit orders equal the references; the output grows one vertex at a time", () => {
    const r = rng(81);
    for (let k = 0; k < 300; k++) {
      const n = 1 + Math.floor(r() * 8); const e = pairs(r, n, Math.floor(r() * 15)); const start = Math.floor(r() * n);
      const b = run("bfs-traversal", { values: flat(e), vertices: n, start });
      expect(b.summary.result).toEqual(bfs(n, e, start));
      const d = run("dfs-traversal", { values: flat(e), vertices: n, start });
      expect(d.summary.result).toEqual(dfs(n, e, start));
      for (const t of [b, d]) {
        let last = 0;
        for (const s of graphs(t)) { expect(s.output.length - last).toBeLessThanOrEqual(1); last = s.output.length; expect(new Set(s.output).size).toBe(s.output.length); }
      }
    }
  });
  it("dfs keeps the call stack as a path of adjacent vertices and returns to an empty stack", () => {
    const r = rng(82);
    for (let k = 0; k < 100; k++) {
      const n = 2 + Math.floor(r() * 7); const e = pairs(r, n, Math.floor(r() * 15));
      const t = run("dfs-traversal", { values: flat(e), vertices: n, start: 0 });
      const edgeSet = new Set(e.flatMap(([a, b]) => [`${a}-${b}`, `${b}-${a}`]));
      for (const s of graphs(t)) for (let i = 1; i < s.frontier.length; i++) expect(edgeSet.has(`${s.frontier[i - 1]!.slice(1)}-${s.frontier[i]!.slice(1)}`)).toBe(true);
      expect(graphs(t).at(-1)!.frontier).toEqual([]);
    }
  });
  it("bfs-shortest-path equals the reference and distances never change once set", () => {
    const r = rng(83);
    for (let k = 0; k < 300; k++) {
      const n = 1 + Math.floor(r() * 8); const e = pairs(r, n, Math.floor(r() * 15)); const start = Math.floor(r() * n);
      const t = run("bfs-shortest-path", { values: flat(e), vertices: n, start });
      expect(t.summary.result).toEqual(dist(n, e, start));
      const seen = new Map<string, number>();
      for (const s of graphs(t)) for (const [id, m] of Object.entries(s.marks)) { if (m === null) continue; if (seen.has(id)) expect(seen.get(id)).toBe(m); seen.set(id, m); }
    }
  });
  it("connected-components and union-find equal the reference component count", () => {
    const r = rng(84);
    for (let k = 0; k < 300; k++) {
      const n = 1 + Math.floor(r() * 8); const e = pairs(r, n, Math.floor(r() * 15));
      expect(run("connected-components", { values: flat(e), vertices: n }).summary.result).toBe(components(n, e));
      const t = run("union-find-components", { values: flat(e), vertices: n });
      expect(t.summary.result).toBe(components(n, e));
      let last = n;
      for (const s of graphs(t)) { expect(s.output[0]!).toBeLessThanOrEqual(last); last = s.output[0]!; }
    }
  });
  it("detect-cycle-undirected agrees with the edge-count rule (a cycle exists iff E > V - components)", () => {
    const r = rng(85);
    for (let k = 0; k < 400; k++) {
      const n = 1 + Math.floor(r() * 8); const e = pairs(r, n, Math.floor(r() * 15));
      expect(run("detect-cycle-undirected", { values: flat(e), vertices: n }).summary.result).toBe(e.length > n - components(n, e) ? 1 : 0);
    }
  });
  it("topological-sort gives a valid order for acyclic graphs and an empty list when there is a cycle", () => {
    const r = rng(86);
    for (let k = 0; k < 300; k++) {
      const n = 1 + Math.floor(r() * 8);
      const perm = [...Array(n).keys()].sort(() => r() - 0.5);
      let e: [number, number][] = pairs(r, n, Math.floor(r() * 15), true).map(([a, b]) => [perm[a!]!, perm[b!]!]);
      if (n >= 3 && r() < 0.3) e = [[perm[0]!, perm[1]!], [perm[1]!, perm[2]!], [perm[2]!, perm[0]!], ...e.slice(0, 12)];
      // remove accidental antiparallel pairs (not allowed as input)
      const keep = new Set<string>(); e = e.filter(([a, b]) => { if (keep.has(`${b}>${a}`) || keep.has(`${a}>${b}`)) return false; keep.add(`${a}>${b}`); return true; });
      const t = run("topological-sort-kahn", { values: flat(e), vertices: n });
      const order = t.summary.result as number[];
      if (order.length > 0) {
        expect(order.length).toBe(n);
        expect(new Set(order).size).toBe(n);
        const pos = new Map(order.map((v, i) => [v, i]));
        for (const [a, b] of e) expect(pos.get(a!)!).toBeLessThan(pos.get(b!)!);
      } else {
        // no order: the graph must really contain a cycle (every Kahn pass stalls); verify by an independent DFS colour check
        const a = adjl(n, e, true); const color = new Array<number>(n).fill(0); let found = false;
        const go = (u: number) => { color[u] = 1; for (const v of a[u]!) { if (color[v] === 1) found = true; else if (color[v] === 0) go(v); } color[u] = 2; };
        for (let u = 0; u < n; u++) if (color[u] === 0) go(u);
        expect(found).toBe(true);
      }
    }
  });
  it("dijkstra equals Bellman-Ford; settled distances never change and unreachable vertices give -1", () => {
    const r = rng(87);
    for (let k = 0; k < 300; k++) {
      const n = 1 + Math.floor(r() * 8); const e = pairs(r, n, Math.floor(r() * 10)).map(([a, b]) => [a!, b!, 1 + Math.floor(r() * 30)]); const start = Math.floor(r() * n);
      const t = run("dijkstra", { values: flat(e), vertices: n, start });
      expect(t.summary.result).toEqual(dijkstra(n, e, start));
      const settled = new Map<string, number>();
      for (const s of graphs(t)) {
        for (const id of s.visited) { const m = s.marks[id]!; if (settled.has(id)) expect(settled.get(id)).toBe(m); settled.set(id, m); }
      }
    }
  });
  it("every trace validates and fits the standard step limit at the largest accepted inputs", () => {
    const r = rng(88);
    for (let k = 0; k < 120; k++) {
      const n = 8; const e = pairs(r, n, 15); const start = Math.floor(r() * n);
      for (const id of ["bfs-traversal", "dfs-traversal", "bfs-shortest-path"]) expect(validateTrace(run(id, { values: flat(e), vertices: n, start })).ok, id).toBe(true);
      for (const id of ["connected-components", "detect-cycle-undirected", "union-find-components"]) {
        const t = run(id, { values: flat(e), vertices: n });
        expect(t.steps.length).toBeLessThanOrEqual(LIMIT_PROFILES.standard.maxSteps);
        expect(validateTrace(t).ok, id).toBe(true);
      }
      const w = pairs(r, n, 10).map(([a, b]) => [a!, b!, 1 + Math.floor(r() * 99)]);
      const t = run("dijkstra", { values: flat(w), vertices: n, start });
      expect(t.steps.length).toBeLessThanOrEqual(LIMIT_PROFILES.standard.maxSteps);
    }
  });
  it("a chain given in the worst order stays within the lite profile", () => {
    const chain = flat(Array.from({ length: 7 }, (_, i) => [i + 1, i]));
    expect(run("union-find-components", { values: chain, vertices: 8 }).steps.length).toBeLessThanOrEqual(LIMIT_PROFILES.lite.maxSteps);
  });
  it("input validation gives field-scoped messages", () => {
    expect(msg("bfs-traversal", { values: [0, 1, 2], vertices: 3, start: 0 })).toContain("pairs");
    expect(msg("bfs-traversal", { values: [0, 3], vertices: 3, start: 0 })).toContain("less than the number of vertices");
    expect(msg("bfs-traversal", { values: [1, 1], vertices: 3, start: 0 })).toContain("itself");
    expect(msg("bfs-traversal", { values: [0, 1, 1, 0], vertices: 3, start: 0 })).toContain("at most one edge");
    expect(msg("bfs-traversal", { values: [0, 1], vertices: 9, start: 0 })).toContain("between 1 and 8");
    expect(msg("bfs-traversal", { values: [0, 1], vertices: 3, start: 3 })).toContain("less than the number of vertices");
    expect(msg("dijkstra", { values: [0, 1], vertices: 3, start: 0 })).toContain("triples");
    expect(msg("dijkstra", { values: [0, 1, 0], vertices: 3, start: 0 })).toContain("from 1 to 99");
    expect(msg("topological-sort-kahn", { values: [0, 1, 1, 0], vertices: 3 })).toContain("both directions");
    expect(msg("bfs-traversal", { values: Array.from({ length: 32 }, () => 0), vertices: 8, start: 0 })).toContain("at most 30");
  });
  it("graph states are self-consistent: every highlight and edge refers to a real vertex", () => {
    const t = run("dijkstra", { values: [0, 1, 4, 0, 2, 1, 2, 1, 2, 1, 3, 5, 2, 3, 8], vertices: 5, start: 0 });
    expect(validateTrace(t).ok).toBe(true);
    expect(graphs(t)[0]!.directed).toBe(false);
    expect(graphs(t).at(-1)!.output).toEqual([0, 3, 1, 8, -1]);
  });
});
