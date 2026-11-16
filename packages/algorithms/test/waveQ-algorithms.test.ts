import { describe, expect, it } from "vitest";
import { assertValidTrace, type LinkedListState, type TrieState } from "@algovision/trace-schema";
import { getAlgorithm, LIMIT_PROFILES, decodeOps, formatOps, parseOpsText } from "../src";
import * as O from "../src/algorithms/interview-ops";
import { rng } from "./testkit";

const std = LIMIT_PROFILES.standard;
const lite = LIMIT_PROFILES.lite;
const R = { maxOps: 15, maxAbs: 999 };

const enc = (ops: (string | number)[][], spec: readonly { name: string; args: 1 | 2 | "word" }[]): number[] =>
  ops.flatMap((o) => {
    const code = spec.findIndex((s) => s.name === o[0]) + 1;
    const rest = o.slice(1);
    return spec[code - 1]!.args === "word" ? [code, (rest[0] as string).length, ...[...(rest[0] as string)].map((c) => c.charCodeAt(0))] : [code, rest.length, ...(rest as number[])];
  });

describe("operation lists (input kind ops)", () => {
  it("turns text into the flat list and back", () => {
    const r = parseOpsText("put 1 10, get 1; put -5 7", O.LRU_OPS, R);
    expect(r).toEqual({ ok: true, value: [1, 2, 1, 10, 2, 1, 1, 1, 2, -5, 7] });
    expect(formatOps((r as { value: number[] }).value, O.LRU_OPS)).toBe("put 1 10, get 1, put -5 7");
    expect(parseOpsText("", O.LRU_OPS, R)).toEqual({ ok: true, value: [] });
    expect(parseOpsText("insert apple, PREFIX app", O.TRIE_OPS, R)).toEqual({ ok: true, value: [1, 5, 97, 112, 112, 108, 101, 3, 3, 97, 112, 112] });
  });
  it("explains each kind of mistake", () => {
    const msg = (t: string, specs = O.LRU_OPS) => { const r = parseOpsText(t, specs, R); return r.ok ? "" : r.message; };
    expect(msg("pop 1")).toMatch(/Unknown operation "pop"\. Use put, get/);
    expect(msg("put 1")).toMatch(/put needs 2 numbers/);
    expect(msg("get 1 2")).toMatch(/get needs 1 number/);
    expect(msg("get x")).toMatch(/whole numbers between -999 and 999/);
    expect(msg("get 1000")).toMatch(/between -999 and 999/);
    expect(msg("get 1.5")).toMatch(/whole numbers/);
    expect(msg(Array(16).fill("get 1").join(", "))).toMatch(/At most 15 operations/);
    expect(msg("insert Apple", O.TRIE_OPS)).toMatch(/one lowercase word of 1 to 6 letters/);
    expect(msg("insert abcdefg", O.TRIE_OPS)).toMatch(/1 to 6 letters/);
    expect(msg("insert two words", O.TRIE_OPS)).toMatch(/one lowercase word/);
  });
  it("decodeOps rejects malformed lists", () => {
    const bad = (v: unknown) => !decodeOps(v, O.LRU_OPS, R).ok;
    expect(bad([3, 1, 1])).toBe(true); // unknown code
    expect(bad([1, 2, 1])).toBe(true); // truncated
    expect(bad([1, 1, 1])).toBe(true); // wrong count
    expect(bad([2, 1, 5000])).toBe(true); // too large
    expect(bad([2, 1, 1.5])).toBe(true);
    expect(bad("x")).toBe(true);
    expect(bad(Array(16).fill([2, 1, 1]).flat())).toBe(true);
    expect(bad([])).toBe(false);
    expect(!decodeOps([1, 3, 97, 98, 64], O.TRIE_OPS, R).ok).toBe(true); // '@' is not a letter
  });
  it("the algorithm.json operation lists match the executors", () => {
    expect(getAlgorithm("lru-cache")!.content.meta.inputs.find((i) => i.name === "ops")!.ops).toEqual(O.LRU_OPS);
    expect(getAlgorithm("trie-insert-search")!.content.meta.inputs.find((i) => i.name === "ops")!.ops).toEqual(O.TRIE_OPS);
  });
});

/** Independent LRU: a Map keeps insertion order, so the first key is the least recently used. */
function lruRef(ops: number[], capacity: number): number {
  const m = new Map<number, number>();
  let total = 0;
  for (let i = 0; i < ops.length; i += 2 + ops[i + 1]!) {
    const key = ops[i + 2]!;
    if (ops[i] === 2) {
      if (m.has(key)) { const v = m.get(key)!; m.delete(key); m.set(key, v); total += v; } else total -= 1;
    } else {
      if (m.has(key)) m.delete(key);
      else if (m.size === capacity) m.delete(m.keys().next().value!);
      m.set(key, ops[i + 3]!);
    }
  }
  return total;
}
const randomLru = (r: () => number): { ops: number[]; capacity: number } => {
  const n = Math.floor(r() * 16);
  const ops = Array.from({ length: n }, () => { const k = Math.floor(r() * 7) - 3; return r() < 0.4 ? ["get", k] : ["put", k, Math.floor(r() * 41) - 20]; });
  return { ops: enc(ops, O.LRU_OPS), capacity: 1 + Math.floor(r() * 4) };
};

describe("lru-cache", () => {
  it("returns the same total as an independent LRU on random operation lists", () => {
    const r = rng(41);
    for (let t = 0; t < 300; t++) {
      const input = randomLru(r);
      const trace = O.runLru(input, std);
      assertValidTrace(trace);
      expect(trace.summary.result, JSON.stringify(input)).toBe(lruRef(input.ops, input.capacity));
    }
  });
  it("keeps the list in most-recent-first order, never above capacity, and the tail pointer on the last node", () => {
    const r = rng(42);
    for (let t = 0; t < 100; t++) {
      const input = randomLru(r);
      const trace = O.runLru(input, std);
      for (const step of trace.steps) {
        const st = step.state as LinkedListState;
        expect(st.nodes.length).toBeLessThanOrEqual(input.capacity);
        const order: string[] = [];
        for (let id = st.head; id !== null; id = st.nodes.find((n) => n.id === id)!.next) order.push(id);
        if (order.length > 0) expect(st.pointers.tail).toBe(order[order.length - 1]);
        else expect(st.pointers.tail).toBeNull();
      }
    }
  });
  it("matches the textbook example", () => {
    const ops = enc([["put", 1, 1], ["put", 2, 2], ["get", 1], ["put", 3, 3], ["get", 2], ["put", 4, 4], ["get", 1], ["get", 3], ["get", 4]], O.LRU_OPS);
    expect(O.runLru({ ops, capacity: 2 }, std).summary.result).toBe(1 + -1 + -1 + 3 + 4);
    expect(O.runLru({ ops: [], capacity: 1 }, std).summary.result).toBe(0);
  });
  it("validates capacity and operations, and stays inside the step budget at the limits", () => {
    const p = (capacity: unknown, ops: unknown = []) => O.lruCache.parseInput({ ops, capacity }, std);
    expect(p(0).ok).toBe(false);
    expect(p(5).ok).toBe(false);
    expect(p(2.5).ok).toBe(false);
    expect(p(2, [9, 1, 1]).ok).toBe(false);
    expect(O.lruCache.parseInput({ ops: [], capacity: 1, extra: 1 }, std).ok).toBe(false);
    const worst = enc(Array.from({ length: 15 }, (_, i) => ["put", i, i]), O.LRU_OPS);
    expect(O.runLru({ ops: worst, capacity: 1 }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(O.runLru({ ops: worst.slice(0, 8 * 4), capacity: 1 }, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});

function trieRef(ops: number[]): number {
  const words = new Set<string>();
  let answers = 0;
  for (let i = 0; i < ops.length; i += 2 + ops[i + 1]!) {
    const w = String.fromCharCode(...ops.slice(i + 2, i + 2 + ops[i + 1]!));
    if (ops[i] === 1) words.add(w);
    else if (ops[i] === 2) answers += words.has(w) ? 1 : 0;
    else answers += [...words].some((x) => x.startsWith(w)) ? 1 : 0;
  }
  return answers;
}
const finalTrie = (t: { steps: { state: unknown }[] }) => t.steps[t.steps.length - 1]!.state as TrieState;

describe("trie-insert-search", () => {
  it("answers like a set of words, and the final trie has a word end exactly where a word was inserted", () => {
    const r = rng(43);
    for (let t = 0; t < 300; t++) {
      const n = Math.floor(r() * 16);
      const ops = enc(Array.from({ length: n }, () => [["insert", "search", "prefix"][Math.floor(r() * 3)]!, Array.from({ length: 1 + Math.floor(r() * 4) }, () => "abc"[Math.floor(r() * 3)]).join("")]), O.TRIE_OPS);
      const trace = O.runTrieOps({ ops }, std);
      assertValidTrace(trace);
      expect(trace.summary.result, ops.join()).toBe(trieRef(ops));
      const st = finalTrie(trace);
      const by = new Map(st.nodes.map((x) => [x.id, x]));
      const ends = new Set<string>();
      const walk = (id: string, prefix: string) => { for (const c of by.get(id)!.children) { const child = by.get(c)!; if (child.end) ends.add(prefix + child.label); walk(c, prefix + child.label); } };
      walk(st.root!, "");
      const inserted = new Set<string>();
      for (let i = 0; i < ops.length; i += 2 + ops[i + 1]!) if (ops[i] === 1) inserted.add(String.fromCharCode(...ops.slice(i + 2, i + 2 + ops[i + 1]!)));
      expect(ends).toEqual(inserted);
    }
  });
  it("matches the textbook example and validates input", () => {
    const ops = enc([["insert", "apple"], ["search", "apple"], ["search", "app"], ["prefix", "app"], ["insert", "app"], ["search", "app"]], O.TRIE_OPS);
    expect(O.runTrieOps({ ops }, std).summary.result).toBe(1 + 0 + 1 + 1);
    expect(O.trieInsertSearch.parseInput({ ops: [1, 2, 65, 66] }, std).ok).toBe(false);
    expect(O.trieInsertSearch.parseInput({ ops: [], capacity: 1 }, std).ok).toBe(false);
  });
  it("stays inside the step budget with fifteen six-letter operations", () => {
    const ops = enc(Array.from({ length: 15 }, (_, i) => ["insert", "abcdef".replace(/./g, (c, k) => String.fromCharCode(97 + ((c.charCodeAt(0) - 97 + i * (k + 1)) % 26)))]), O.TRIE_OPS);
    expect(O.runTrieOps({ ops }, std).steps.length).toBeLessThanOrEqual(std.maxSteps);
    expect(O.runTrieOps({ ops: ops.slice(0, 8 * 8) }, lite).steps.length).toBeLessThanOrEqual(lite.maxSteps);
  });
});
