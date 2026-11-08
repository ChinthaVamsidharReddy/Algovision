import { expect } from "vitest";
import { LIMIT_PROFILES, getAlgorithm } from "../src";

export const limits = LIMIT_PROFILES.standard;
export function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const run = (id: string, input: Record<string, unknown>) => {
  const e = getAlgorithm(id)!;
  const p = e.definition.parseInput(input, limits);
  if (!p.ok) throw new Error(`${id}: ${JSON.stringify(p)}`);
  return e.definition.run(p.value as never, limits);
};
export const parse = (id: string, input: Record<string, unknown>) => getAlgorithm(id)!.definition.parseInput(input, limits);
export const msg = (id: string, input: Record<string, unknown>) => JSON.stringify(parse(id, input));
export const ints = (r: () => number, n: number, lo = -20, hi = 20) => Array.from({ length: n }, () => lo + Math.floor(r() * (hi - lo + 1)));
export const asc = (a: readonly number[]) => [...a].sort((x, y) => x - y);
export const anchorIds = (t: { steps: readonly { source: { kind: string; id?: string } }[] }) => t.steps.map((s) => (s.source.kind === "anchor" ? s.source.id : "?"));
export const within = (id: string, input: Record<string, unknown>) => expect(run(id, input).steps.length, `${id} step count`).toBeLessThanOrEqual(limits.maxSteps);
