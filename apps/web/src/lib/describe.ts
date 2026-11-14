import type { ArrayState, GraphState, GridState, LinkedListState, QueueState, StackState, TreeState } from "@algovision/trace-schema";

/**
 * Text rendering of a snapshot for screen readers and the "as text" panel. It is derived from the
 * same state the SVG draws, so the two can never disagree.
 */
export function describeLinkedList(state: LinkedListState): string {
  const byId = new Map(state.nodes.map((n) => [n.id, n]));
  const reachable = new Set<string>();
  const chain: string[] = [];
  let id = state.head;
  while (id !== null && !reachable.has(id)) {
    reachable.add(id);
    const node = byId.get(id);
    if (!node) break;
    chain.push(String(node.value));
    id = node.next;
  }
  const parts = [`head → ${[...chain, "null"].join(" → ")}`];
  const detached = state.nodes.filter((n) => !reachable.has(n.id));
  for (const n of detached) {
    const next = n.next === null ? "null" : String(byId.get(n.next)?.value ?? "?");
    parts.push(`detached node ${n.value} (next → ${next})`);
  }
  for (const [name, target] of Object.entries(state.pointers)) {
    parts.push(`${name} → ${target === null ? "null" : String(byId.get(target)?.value ?? "?")}`);
  }
  return parts.join("; ");
}

/** Text rendering of an array snapshot: values by index, then each pointer and where it points. */
export function describeArray(state: ArrayState): string {
  const show = (v: number | undefined): string => (v === undefined ? "?" : state.chars ? `"${String.fromCharCode(v)}"` : String(v));
  if (state.values.length === 0) return state.chars ? 'empty string ""' : "empty array []";
  const parts = [`[${state.values.map((v) => show(v)).join(", ")}]`];
  for (const [name, index] of Object.entries(state.pointers)) {
    parts.push(index === null ? `${name} → none` : `${name} → index ${index} (value ${show(state.values[index])})`);
  }
  return parts.join("; ");
}

/** Stack read from bottom to top, so the last value is the one that pops next. */
export function describeStack(state: StackState): string {
  if (state.items.length === 0) return "empty stack";
  return `bottom → ${state.items.join(", ")} ← top (top is ${state.items[state.items.length - 1]})`;
}

/** Queue read from front to rear, so the first value is the one that leaves next. */
export function describeQueue(state: QueueState): string {
  if (state.items.length === 0) return "empty queue";
  return `front → ${state.items.join(", ")} ← rear (front is ${state.items[0]})`;
}

/** Nested text form of the tree plus the call stack and output, e.g. "5 (left 3, right 8)". */
export function describeTree(state: TreeState): string {
  if (state.root === null) return "empty tree";
  const byId = new Map(state.nodes.map((n) => [n.id, n]));
  const show = (id: string | null, seen: Set<string>): string => {
    if (id === null || seen.has(id)) return "none";
    seen.add(id);
    const n = byId.get(id);
    if (!n) return "?";
    const l = n.left === null ? "" : `left ${show(n.left, seen)}`;
    const r = n.right === null ? "" : `right ${show(n.right, seen)}`;
    const kids = [l, r].filter(Boolean).join(", ");
    return kids ? `${n.value} (${kids})` : String(n.value);
  };
  const stack = state.callStack.map((id) => (id === null ? "visit(null)" : `visit(${byId.get(id)?.value ?? "?"})`));
  return [
    `root ${show(state.root, new Set())}`,
    `call stack: ${stack.length === 0 ? "empty" : stack.join(" → ")}`,
    `output: [${state.output.join(", ")}]`,
  ].join("; ");
}

/** Edge list, work list, marks and output of a graph snapshot, in vertex numbers. */
export function describeGraph(state: GraphState): string {
  if (state.nodes.length === 0) return "empty graph";
  const num = new Map(state.nodes.map((n) => [n.id, n.value]));
  const v = (id: string) => String(num.get(id) ?? "?");
  const arrow = state.directed ? "→" : "–";
  const edges = state.edges.map((e) => `${v(e.from)}${arrow}${v(e.to)}${e.weight === null ? "" : ` (${e.weight})`}`);
  const parts = [`${state.directed ? "directed" : "undirected"} graph with ${state.nodes.length} vertices; edges: ${edges.length === 0 ? "none" : edges.join(", ")}`];
  parts.push(`current: ${state.current === null ? "none" : v(state.current)}`);
  if (state.activeEdge) parts.push(`examining edge ${v(state.activeEdge.from)}${arrow}${v(state.activeEdge.to)}`);
  if (state.frontierName) parts.push(`${state.frontierName.toLowerCase()}: ${state.frontier.length === 0 ? "empty" : state.frontier.map(v).join(", ")}`);
  parts.push(`visited: ${state.visited.length === 0 ? "none" : state.visited.map(v).join(", ")}`);
  if (state.markName) {
    const marks = state.nodes.map((n) => `${n.value}=${state.marks[n.id] === null || state.marks[n.id] === undefined ? "–" : state.marks[n.id]}`);
    parts.push(`${state.markName}: ${marks.join(", ")}`);
  }
  parts.push(`output: [${state.output.join(", ")}]`);
  return parts.join("; ");
}

/** Row by row, with the row and column labels when the table is over two strings. Empty cells read as "empty". */
export function describeGrid(state: GridState): string {
  if (state.rows === 0 || state.cols === 0) return "empty grid";
  const rows: string[] = [];
  for (let r = 0; r < state.rows; r++) {
    const cells = state.cells.slice(r * state.cols, (r + 1) * state.cols).map((v) => (v === null ? "empty" : String(v)));
    const name = state.rowLabels ? `row ${r} (${state.rowLabels[r] === "" ? "none" : state.rowLabels[r]})` : `row ${r}`;
    rows.push(`${name}: ${cells.join(" ")}`);
  }
  const cols = state.colLabels ? `; columns: ${state.colLabels.map((l) => (l === "" ? "none" : l)).join(" ")}` : "";
  return `${state.rows} by ${state.cols} grid${cols}; ${rows.join("; ")}`;
}
