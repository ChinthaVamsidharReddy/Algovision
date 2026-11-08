import { nodeRef, type ExecutionTrace, type GraphState, type Highlight, type HighlightRole, type TraceEvent } from "@algovision/trace-schema";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder, type Scalar } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";

export { fmt } from "./array-common";

export const MAX_VERTICES = 8;
export const MAX_WEIGHT = 99;

/** `values` is a flat edge list: `from, to` pairs (stride 2) or `from, to, weight` triples (stride 3). */
export interface GraphInput { readonly values: readonly number[]; readonly vertices: number; readonly start: number }
export interface GraphParseOptions { readonly stride: 2 | 3; readonly start: boolean; readonly directed: boolean }
export interface Edge { readonly from: number; readonly to: number; readonly weight: number }

export function edgesOf(values: readonly number[], stride: 2 | 3): Edge[] {
  const edges: Edge[] = [];
  for (let k = 0; k + stride <= values.length; k += stride) edges.push({ from: values[k]!, to: values[k + 1]!, weight: stride === 3 ? values[k + 2]! : 1 });
  return edges;
}

export function parseGraph(raw: unknown, limits: LimitProfile, o: GraphParseOptions): InputResult<GraphInput> {
  const p = parseArrayWithFields(raw, limits, {
    noun: "edge list", valueMin: 0, valueMax: 99, valueMessage: "Edge numbers must be whole numbers from 0 to 99.",
    maxLength: (l) => l.maxArrayLength * 2,
    fields: [
      { name: "vertices", label: "Number of vertices", min: () => 1, max: () => MAX_VERTICES, rangeMessage: () => `The number of vertices must be between 1 and ${MAX_VERTICES}.` },
      ...(o.start ? [{ name: "start", label: "Start vertex", min: () => 0, max: () => MAX_VERTICES - 1, rangeMessage: () => `The start vertex must be between 0 and ${MAX_VERTICES - 1}.` }] : []),
    ],
  }) as InputResult<GraphInput>;
  if (!p.ok) return p;
  const { values, vertices } = p.value;
  const start = o.start ? p.value.start : 0;
  const errors: FieldError[] = [];
  if (o.start && start >= vertices) errors.push({ field: "start", message: `The start vertex must be less than the number of vertices (${vertices}).` });
  if (values.length % o.stride !== 0) {
    errors.push({ field: "values", message: o.stride === 2 ? "Enter edges as pairs: from, to, from, to, ..." : "Enter edges as triples: from, to, weight, from, to, weight, ..." });
  } else {
    const seen = new Set<string>();
    for (const e of edgesOf(values, o.stride)) {
      if (e.from >= vertices || e.to >= vertices) { errors.push({ field: "values", message: `Every vertex number must be less than the number of vertices (${vertices}).` }); break; }
      if (e.from === e.to) { errors.push({ field: "values", message: "An edge cannot join a vertex to itself." }); break; }
      if (o.stride === 3 && (e.weight < 1 || e.weight > MAX_WEIGHT)) { errors.push({ field: "values", message: `Each weight (every third number) must be from 1 to ${MAX_WEIGHT}.` }); break; }
      const key = `${e.from}>${e.to}`;
      const back = `${e.to}>${e.from}`;
      if (seen.has(key) || seen.has(back)) { errors.push({ field: "values", message: o.directed ? "Do not list an edge in both directions between the same two vertices." : "Each pair of vertices can have at most one edge." }); break; }
      seen.add(key);
    }
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: { values, vertices, start } };
}

/** Adjacency matrix: weight, or 0 for no edge. Undirected graphs fill both directions. */
export function adjacency(vertices: number, edges: readonly Edge[], directed: boolean): number[][] {
  const adj = Array.from({ length: vertices }, () => new Array<number>(vertices).fill(0));
  for (const e of edges) {
    adj[e.from]![e.to] = e.weight;
    if (!directed) adj[e.to]![e.from] = e.weight;
  }
  return adj;
}

export const vid = (i: number): string => `g${i}`;

export interface GraphTraceOptions {
  readonly id: string;
  readonly input: Record<string, unknown>;
  readonly vertices: number;
  readonly edges: readonly Edge[];
  readonly directed: boolean;
  readonly weighted: boolean;
  readonly frontierName: string;
  readonly markName: string;
  readonly limits: LimitProfile;
}

/**
 * Bookkeeping shared by every graph trace: the fixed picture (vertices and edges) plus the moving
 * parts (current vertex, edge being examined, work list, visited set, per-vertex marks, output).
 * Highlights are derived: visited vertices, then work-list vertices, then the current one.
 */
export class GraphTrace {
  readonly b: TraceBuilder<"graph">;
  current: number | null = null;
  activeEdge: { from: number; to: number } | null = null;
  frontier: number[] = [];
  visited: number[] = [];
  marks: (number | null)[];
  output: number[] = [];
  private readonly o: GraphTraceOptions;

  constructor(o: GraphTraceOptions) {
    this.o = o;
    this.b = new TraceBuilder({ algorithmId: o.id, stateKind: "graph", input: o.input, maxSteps: o.limits.maxSteps });
    this.marks = new Array<number | null>(o.vertices).fill(null);
  }

  state(): GraphState {
    const marks: Record<string, number | null> = {};
    if (this.o.markName) this.marks.forEach((m, i) => { marks[vid(i)] = m; });
    return {
      kind: "graph",
      directed: this.o.directed,
      nodes: Array.from({ length: this.o.vertices }, (_, i) => ({ id: vid(i), value: i })),
      edges: this.o.edges.map((e) => ({ from: vid(e.from), to: vid(e.to), weight: this.o.weighted ? e.weight : null })),
      current: this.current === null ? null : vid(this.current),
      activeEdge: this.activeEdge === null ? null : { from: vid(this.activeEdge.from), to: vid(this.activeEdge.to) },
      frontier: this.frontier.map(vid),
      frontierName: this.o.frontierName,
      visited: this.visited.map(vid),
      marks,
      markName: this.o.markName,
      output: [...this.output],
    };
  }

  private highlights(extra: readonly { v: number; role: HighlightRole; label?: string }[]): Highlight[] {
    const roles = new Map<number, Highlight>();
    const put = (v: number, role: HighlightRole, label?: string) => roles.set(v, { target: nodeRef(vid(v)), role, ...(label ? { label } : {}) });
    for (const v of this.visited) put(v, "visited");
    for (const v of this.frontier) put(v, "pointer");
    if (this.current !== null) put(this.current, "active", "current");
    for (const e of extra) put(e.v, e.role, e.label);
    return [...roles.values()];
  }

  step(event: TraceEvent, anchor: string, explanation: string, variables: Record<string, Scalar>, extra: readonly { v: number; role: HighlightRole; label?: string }[] = [], changed: readonly number[] = []): void {
    this.b.step({ event, anchor, explanation, variables, state: this.state(), highlights: this.highlights(extra), changed: changed.map((v) => nodeRef(vid(v))) });
  }

  finish(result: unknown, time: string, space: string): ExecutionTrace {
    return this.b.build({ time, space, result });
  }
}

export const ref = (v: number) => nodeRef(vid(v));

export function describeEdges(edges: readonly Edge[], directed: boolean, weighted: boolean): string {
  if (edges.length === 0) return "no edges";
  return edges.map((e) => `${e.from}${directed ? "→" : "–"}${e.to}${weighted ? ` (${e.weight})` : ""}`).join(", ");
}
export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;
export const list = (v: readonly number[]): string => (v.length === 0 ? "empty" : v.join(", "));
