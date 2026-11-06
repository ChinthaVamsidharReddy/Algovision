import type { TreeState } from "@algovision/trace-schema";

export const R = 21;
export const X_STEP = 52;
export const Y_STEP = 62;
export const PAD = 28;

export interface TreeNodeLayout {
  readonly id: string;
  readonly value: number;
  readonly x: number;
  readonly y: number;
  readonly depth: number;
}

export interface TreeLayout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly TreeNodeLayout[];
  readonly edges: readonly { from: string; to: string; side: "left" | "right"; x1: number; y1: number; x2: number; y2: number }[];
}

/**
 * Classic in-order layout: x follows the in-order rank, y follows the depth. A node always sits
 * between its subtrees, parents never overlap children, and the picture is a pure function of
 * the state (so the tree does not move while it is traversed).
 */
export function layoutTree(state: TreeState): TreeLayout {
  const byId = new Map(state.nodes.map((n) => [n.id, n]));
  const placed: TreeNodeLayout[] = [];
  let rank = 0;
  const seen = new Set<string>();
  const place = (id: string | null, depth: number): void => {
    if (id === null || seen.has(id)) return;
    const node = byId.get(id);
    if (!node) return;
    seen.add(id);
    place(node.left, depth + 1);
    placed.push({ id, value: node.value, x: PAD + rank * X_STEP, y: PAD + depth * Y_STEP, depth });
    rank++;
    place(node.right, depth + 1);
  };
  place(state.root, 0);

  const at = new Map(placed.map((p) => [p.id, p]));
  const edges: TreeLayout["edges"][number][] = [];
  for (const node of state.nodes) {
    const parent = at.get(node.id);
    if (!parent) continue;
    for (const [side, child] of [["left", node.left], ["right", node.right]] as const) {
      const target = child === null ? undefined : at.get(child);
      if (!target) continue;
      // Edges end at the circle borders, not the centres.
      const dx = target.x - parent.x;
      const dy = target.y - parent.y;
      const len = Math.hypot(dx, dy) || 1;
      edges.push({
        from: node.id,
        to: target.id,
        side,
        x1: parent.x + (dx / len) * R,
        y1: parent.y + (dy / len) * R,
        x2: target.x - (dx / len) * R,
        y2: target.y - (dy / len) * R,
      });
    }
  }
  const maxDepth = placed.reduce((m, p) => Math.max(m, p.depth), 0);
  return {
    width: PAD * 2 + Math.max(placed.length - 1, 0) * X_STEP,
    height: PAD * 2 + maxDepth * Y_STEP,
    nodes: placed,
    edges,
  };
}
