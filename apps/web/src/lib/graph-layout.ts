import type { GraphState } from "@algovision/trace-schema";

export const GRAPH_SIZE = 340;
export const GR = 19;

export interface GraphNodeLayout {
  readonly id: string;
  readonly value: number;
  readonly x: number;
  readonly y: number;
}
export interface GraphEdgeLayout {
  readonly from: string;
  readonly to: string;
  readonly weight: number | null;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly mx: number;
  readonly my: number;
}
export interface GraphLayout {
  readonly size: number;
  readonly nodes: readonly GraphNodeLayout[];
  readonly edges: readonly GraphEdgeLayout[];
}

/**
 * Vertices sit evenly on a circle, so the picture depends only on how many there are and never
 * moves while the algorithm runs. Edges stop at the circle borders so arrowheads stay visible.
 */
export function layoutGraph(state: GraphState): GraphLayout {
  const n = state.nodes.length;
  const c = GRAPH_SIZE / 2;
  const radius = c - GR - 26;
  const nodes = state.nodes.map((node, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(n, 1);
    return { id: node.id, value: node.value, x: n === 1 ? c : c + radius * Math.cos(angle), y: n === 1 ? c : c + radius * Math.sin(angle) };
  });
  const at = new Map(nodes.map((p) => [p.id, p]));
  const edges: GraphEdgeLayout[] = [];
  for (const e of state.edges) {
    const a = at.get(e.from);
    const b = at.get(e.to);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    edges.push({
      from: e.from, to: e.to, weight: e.weight,
      x1: a.x + (dx / len) * GR, y1: a.y + (dy / len) * GR, x2: b.x - (dx / len) * GR, y2: b.y - (dy / len) * GR,
      mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2,
    });
  }
  return { size: GRAPH_SIZE, nodes, edges };
}
