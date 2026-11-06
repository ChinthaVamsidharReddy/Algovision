import type { HighlightRole, LinkedListState } from "@algovision/trace-schema";

export const NODE_W = 76;
export const NODE_H = 44;
export const SLOT_W = 108;
export const ROW_GAP = 78;
export const PAD_X = 28;
export const PAD_TOP = 40;
export const PAD_BOTTOM = 64;
/** The right-hand "next" cell of a node. */
export const PTR_W = 26;

export interface LaidOutNode {
  readonly id: string;
  readonly value: number;
  readonly x: number;
  readonly y: number;
  /** 0 = main row (reachable from head), 1 = detached row above it. */
  readonly row: 0 | 1;
  readonly isNull: boolean;
}

export interface LaidOutEdge {
  readonly from: string;
  readonly to: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface LaidOutPointer {
  readonly name: string;
  readonly target: string | null;
  readonly x: number;
  readonly y: number;
  /** "below" arrows point up at the node, "above" arrows point down. */
  readonly side: "above" | "below";
  readonly nullTarget: boolean;
}

export interface LinkedListLayout {
  readonly nodes: readonly LaidOutNode[];
  readonly edges: readonly LaidOutEdge[];
  readonly pointers: readonly LaidOutPointer[];
  readonly width: number;
  readonly height: number;
  readonly mainY: number;
}

/**
 * Pure geometry for a linked-list snapshot. Nodes reachable from head sit in the main row in list
 * order; nodes not reachable (e.g. a freshly created node) sit in a row above. The `head` pointer
 * is drawn under the main row, any other named pointer above its node.
 */
export function layoutLinkedList(state: LinkedListState): LinkedListLayout {
  const byId = new Map(state.nodes.map((n) => [n.id, n]));
  const placed = new Map<string, { slot: number; row: 0 | 1 }>();

  const walk = (startId: string | null, row: 0 | 1) => {
    let id = startId;
    let slot = 0;
    const seen = new Set<string>();
    while (id !== null && !seen.has(id)) {
      seen.add(id);
      if (placed.has(id)) break; // chain joins an already placed node
      placed.set(id, { slot, row });
      slot += 1;
      id = byId.get(id)?.next ?? null;
    }
  };

  walk(state.head, 0);
  // Detached chains keep their given order; each starts above slot 0 so a link to the head is a short drop.
  for (const node of state.nodes) if (!placed.has(node.id)) walk(node.id, 1);

  const slots = Math.max(1, ...[...placed.values()].map((p) => p.slot + 1));
  const hasDetached = [...placed.values()].some((p) => p.row === 1);
  const mainY = PAD_TOP + (hasDetached ? ROW_GAP : 0);

  const nodes: LaidOutNode[] = state.nodes.map((n) => {
    const p = placed.get(n.id) ?? { slot: 0, row: 1 as const };
    return {
      id: n.id,
      value: n.value,
      x: PAD_X + p.slot * SLOT_W,
      y: p.row === 0 ? mainY : mainY - ROW_GAP,
      row: p.row,
      isNull: n.next === null,
    };
  });
  const pos = new Map(nodes.map((n) => [n.id, n]));

  const edges: LaidOutEdge[] = [];
  for (const n of state.nodes) {
    if (n.next === null) continue;
    const a = pos.get(n.id);
    const b = pos.get(n.next);
    if (!a || !b) continue;
    const startX = a.x + NODE_W - PTR_W / 2;
    if (b.y > a.y) {
      edges.push({ from: n.id, to: n.next, x1: startX, y1: a.y + NODE_H, x2: startX, y2: b.y });
    } else if (b.x > a.x) {
      edges.push({ from: n.id, to: n.next, x1: startX, y1: a.y + NODE_H / 2, x2: b.x, y2: b.y + NODE_H / 2 });
    } else {
      // Backwards or same-column links are not produced by the current algorithms; draw a direct line.
      edges.push({ from: n.id, to: n.next, x1: startX, y1: a.y + NODE_H / 2, x2: b.x + NODE_W, y2: b.y + NODE_H / 2 });
    }
  }

  const pointers: LaidOutPointer[] = [];
  const headNode = state.head ? pos.get(state.head) : undefined;
  pointers.push({
    name: "head",
    target: state.head,
    x: headNode ? headNode.x + NODE_W / 2 : PAD_X + NODE_W / 2,
    y: (headNode?.y ?? mainY) + NODE_H,
    side: "below",
    nullTarget: state.head === null,
  });
  for (const [name, target] of Object.entries(state.pointers)) {
    const t = target ? pos.get(target) : undefined;
    pointers.push({
      name,
      target,
      x: (t?.x ?? PAD_X) + NODE_W / 2,
      y: t?.y ?? mainY,
      side: "above",
      nullTarget: target === null,
    });
  }

  return {
    nodes,
    edges,
    pointers,
    width: PAD_X * 2 + (slots - 1) * SLOT_W + NODE_W,
    height: mainY + NODE_H + PAD_BOTTOM,
    mainY,
  };
}

export const ROLE_PRIORITY: readonly HighlightRole[] = ["found", "swapped", "compared", "active", "created", "pointer", "window", "visited", "sorted"];
