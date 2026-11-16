import type { TrieState } from "@algovision/trace-schema";

export const TR = 12;
export const T_X = 40;
export const T_Y = 64;
export const T_PAD = 30;

export interface TrieNodeLayout {
  readonly id: string;
  readonly label: string;
  readonly count: number;
  readonly end: boolean;
  readonly x: number;
  readonly y: number;
  readonly depth: number;
}
export interface TrieEdgeLayout {
  readonly from: string;
  readonly to: string;
  readonly letter: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  /** Where the letter sits: 60% of the way down the edge, so it never covers a node. */
  readonly lx: number;
  readonly ly: number;
}
export interface TrieLayout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly TrieNodeLayout[];
  readonly edges: readonly TrieEdgeLayout[];
}

/**
 * Leaves get consecutive columns left to right; a parent is centred over its first and last child.
 * The width therefore follows the number of leaves (at most one per suffix), not the node count, and
 * siblings never overlap. A pure function of the state, so the trie does not jump between steps.
 */
export function layoutTrie(state: TrieState): TrieLayout {
  const byId = new Map(state.nodes.map((n) => [n.id, n]));
  const pos = new Map<string, TrieNodeLayout>();
  let leaf = 0;
  const seen = new Set<string>();
  const place = (id: string, depth: number): number => {
    seen.add(id);
    const node = byId.get(id)!;
    const kids = node.children.filter((c) => byId.has(c) && !seen.has(c));
    let x: number;
    if (kids.length === 0) x = T_PAD + leaf++ * T_X;
    else {
      const xs = kids.map((c) => place(c, depth + 1));
      x = (xs[0]! + xs[xs.length - 1]!) / 2;
    }
    pos.set(id, { id, label: node.label, count: node.count, end: node.end === true, x, y: T_PAD + depth * T_Y, depth });
    return x;
  };
  if (state.root !== null && byId.has(state.root)) place(state.root, 0);

  const edges: TrieEdgeLayout[] = [];
  for (const node of state.nodes) {
    const parent = pos.get(node.id);
    if (!parent) continue;
    for (const child of node.children) {
      const target = pos.get(child);
      if (!target) continue;
      const dx = target.x - parent.x;
      const dy = target.y - parent.y;
      const len = Math.hypot(dx, dy) || 1;
      edges.push({
        from: node.id,
        to: child,
        letter: target.label,
        x1: parent.x + (dx / len) * TR,
        y1: parent.y + (dy / len) * TR,
        x2: target.x - (dx / len) * TR,
        y2: target.y - (dy / len) * TR,
        lx: parent.x + dx * 0.6,
        ly: parent.y + dy * 0.6,
      });
    }
  }
  const nodes = [...pos.values()];
  const maxDepth = nodes.reduce((m, p) => Math.max(m, p.depth), 0);
  return { width: T_PAD * 2 + Math.max(leaf - 1, 0) * T_X, height: T_PAD * 2 + maxDepth * T_Y, nodes, edges };
}
