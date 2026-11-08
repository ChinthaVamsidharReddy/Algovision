import { nodeRef, type ExecutionTrace, type Highlight, type HighlightRole, type TraceEvent, type TreeState } from "@algovision/trace-schema";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder, type Scalar } from "../trace-builder";
import { parseArrayWithFields, type ArraySpec } from "./array-input";
import { buildTree } from "./binary-tree-inorder";

export { fmt } from "./array-common";

export interface TreeValuesInput { readonly values: readonly number[] }
export interface MutableNode { id: string; value: number; left: string | null; right: string | null }

export function parseTree(raw: unknown, limits: LimitProfile, spec: ArraySpec = {}): InputResult<Record<string, unknown>> {
  return parseArrayWithFields(raw, limits, { noun: "tree", ...spec });
}

/**
 * Shared bookkeeping for tree traces: the node list, the recursion call stack, the output so far
 * and the "current" pointer. Executors describe one step at a time with `step`.
 */
export class TreeTrace {
  readonly nodes: MutableNode[];
  root: string | null;
  readonly callStack: (string | null)[] = [];
  readonly output: number[] = [];
  readonly visited: string[] = [];
  current: string | null = null;
  readonly b: TraceBuilder<"tree">;
  private readonly byId = new Map<string, MutableNode>();

  constructor(id: string, input: Record<string, unknown>, values: readonly number[], limits: LimitProfile) {
    const t = buildTree(values);
    this.nodes = t.nodes;
    this.root = t.root;
    for (const n of this.nodes) this.byId.set(n.id, n);
    this.b = new TraceBuilder({ algorithmId: id, stateKind: "tree", input, maxSteps: limits.maxSteps });
  }
  node(id: string): MutableNode { return this.byId.get(id)!; }
  value(id: string | null): number | null { return id === null ? null : this.byId.get(id)!.value; }
  /** Adds a node that is not yet attached; the caller links it with `attach`. */
  create(value: number): MutableNode {
    const n: MutableNode = { id: `t${this.nodes.length + 1}`, value, left: null, right: null };
    return n;
  }
  attach(parent: string | null, side: "left" | "right", n: MutableNode): void {
    this.nodes.push(n);
    this.byId.set(n.id, n);
    if (parent === null) this.root = n.id;
    else this.byId.get(parent)![side] = n.id;
  }
  top(): string | null { return this.callStack.length > 0 ? this.callStack[this.callStack.length - 1]! : null; }
  state(): TreeState {
    return { kind: "tree", nodes: this.nodes.map((n) => ({ ...n })), root: this.root, current: this.current, callStack: [...this.callStack], output: [...this.output] };
  }
  /** Highlights: explicit ones win, then the current node, then waiting callers, then visited nodes. */
  marks(extra: readonly { id: string; role: HighlightRole; label?: string }[] = []): Highlight[] {
    const roles = new Map<string, Highlight>();
    const put = (id: string, role: HighlightRole, label?: string) => roles.set(id, { target: nodeRef(id), role, ...(label ? { label } : {}) });
    for (const id of this.visited) put(id, "visited");
    for (const id of this.callStack) if (id !== null) put(id, "pointer");
    if (this.current !== null) put(this.current, "active", "current");
    for (const e of extra) put(e.id, e.role, e.label);
    return [...roles.values()];
  }
  step(event: TraceEvent, anchor: string, explanation: string, variables: Record<string, Scalar>, extra: readonly { id: string; role: HighlightRole; label?: string }[] = [], changed: readonly string[] = []): void {
    this.b.step({ event, anchor, explanation, variables, state: this.state(), highlights: this.marks(extra), changed: changed.map((id) => nodeRef(id)) });
  }
  call(id: string | null, anchor: string, explanation: string, variables: Record<string, Scalar> = {}): void {
    this.callStack.push(id);
    this.current = this.top();
    this.step({ type: "call", node: id }, anchor, explanation, { node: this.value(id), depth: this.callStack.length, ...variables });
  }
  ret(id: string | null, anchor: string, explanation: string, variables: Record<string, Scalar> = {}): void {
    this.callStack.pop();
    if (id !== null) this.visited.push(id);
    this.current = this.top();
    this.step({ type: "return", node: id }, anchor, explanation, { node: this.value(this.current), depth: this.callStack.length, ...variables });
  }
  /** `explanation` may be a function of the output after this visit has been appended. */
  visit(id: string, anchor: string, explanation: string | ((output: readonly number[]) => string), variables: Record<string, Scalar> = {}): void {
    this.output.push(this.value(id)!);
    this.visited.push(id);
    this.step({ type: "visit", element: nodeRef(id) }, anchor, typeof explanation === "function" ? explanation(this.output) : explanation, { node: this.value(id), depth: this.callStack.length, ...variables }, [{ id, role: "found", label: "visit" }], [id]);
  }
  finish(result: number | number[], time: string, space: string): ExecutionTrace {
    return this.b.build({ time, space, result });
  }
}
