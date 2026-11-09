import type { HighlightRole, LinkedListState } from "@algovision/trace-schema";

export const NODE_W = 76;
export const NODE_H = 44;
export const SLOT_W = 108;
export const ROW_GAP = 78;
export const PAD_X = 28;
export const PAD_TOP = 40;
/** Height of one line of pointer text stacked above a node. */
export const LABEL_LINE = 16;
export const PAD_BOTTOM = 64;
/** The right-hand "next" cell of a node. */
export const PTR_W = 26;

export interface LaidOutNode {
  readonly id: string;
  readonly value: number;
  readonly x: number;
  readonly y: number;
  /** 0 = main row (reachable from head); 1, 2, ... = detached chains stacked above it. */
  readonly row: number;
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

/** Every name that points at (or is highlighted on) one spot, stacked so no two texts share a line. */
export interface LabelStack {
  /** Left edge of the text: the stack is left-aligned so it stays clear of the vertical link into the node's pointer cell. */
  readonly x: number;
  /** Top of the node the stack sits on. */
  readonly y: number;
  /** Nearest the node first. */
  readonly lines: readonly { readonly text: string; readonly pointer: string | null; readonly nullTarget: boolean }[];
}

export interface LinkedListLayout {
  readonly stacks: readonly LabelStack[];
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
export function layoutLinkedList(state: LinkedListState, nodeLabels: ReadonlyMap<string, string> = new Map()): LinkedListLayout {
  const byId = new Map(state.nodes.map((n) => [n.id, n]));
  const placed = new Map<string, { slot: number; row: number }>();
  const taken = new Set<string>();
  const put = (id: string, slot: number, row: number) => {
    placed.set(id, { slot, row });
    taken.add(`${row}:${slot}`);
  };

  // The chain reachable from head is the main row.
  {
    let id = state.head;
    let slot = 0;
    while (id !== null && !placed.has(id)) {
      put(id, slot, 0);
      slot += 1;
      id = byId.get(id)?.next ?? null;
    }
  }

  // Every other chain gets a row of its own above the main row, so two chains never share a spot. A chain
  // that links into a placed node goes one row above it, directly over it when it is a single node,
  // which keeps that link a short vertical drop. Chains that end at an already placed node go first.
  const chainOf = (startId: string): { ids: string[]; endsAt: string | null } => {
    const ids: string[] = [];
    let id: string | null = startId;
    while (id !== null && !placed.has(id) && !ids.includes(id)) {
      ids.push(id);
      id = byId.get(id)?.next ?? null;
    }
    return { ids, endsAt: id !== null && placed.has(id) ? id : null };
  };
  for (;;) {
    const unplaced = state.nodes.filter((n) => !placed.has(n.id));
    if (unplaced.length === 0) break;
    const pointedAt = new Set(unplaced.flatMap((n) => (n.next !== null && !placed.has(n.next) ? [n.next] : [])));
    const starts = unplaced.filter((n) => !pointedAt.has(n.id)).map((n) => chainOf(n.id));
    const chain = starts.find((c) => c.endsAt !== null) ?? starts[0] ?? chainOf(unplaced[0]!.id);
    const target = chain.endsAt ? placed.get(chain.endsAt)! : null;
    const first = chain.ids.length === 1 && target ? target.slot : 0;
    let row = (target?.row ?? 0) + 1;
    const free = (r: number) => chain.ids.every((_, k) => !taken.has(`${r}:${first + k}`));
    while (!free(row)) row += 1;
    chain.ids.forEach((id, k) => put(id, first + k, row));
  }

  // Names stacked on one node: its highlight label (if it adds information) and every pointer aimed at it.
  // Pointers that are null are drawn over the first slot of the main row.
  const firstMain = state.nodes.find((n) => placed.get(n.id)?.slot === 0 && placed.get(n.id)?.row === 0)?.id ?? null;
  const groups = new Map<string | null, { pointer: string | null; nullTarget: boolean; text: string }[]>();
  const add = (key: string | null, line: { pointer: string | null; nullTarget: boolean; text: string }) => groups.set(key, [...(groups.get(key) ?? []), line]);
  for (const [name, target] of Object.entries(state.pointers)) {
    if (target === null) add(firstMain, { pointer: name, nullTarget: true, text: `${name} → ∅` });
    else add(target, { pointer: name, nullTarget: false, text: name });
  }
  for (const [id, label] of nodeLabels) {
    const lines = groups.get(id) ?? [];
    if (lines.some((l) => l.pointer === label || l.text === label)) continue;
    groups.set(id, [{ pointer: null, nullTarget: false, text: label }, ...lines]);
  }
  const maxLines = Math.max(1, ...[...groups.values()].map((g) => g.length));
  const need = maxLines * LABEL_LINE + 14;
  const padTop = Math.max(PAD_TOP, need + 8);
  const rowGap = Math.max(ROW_GAP, NODE_H + need);

  const slots = Math.max(1, ...[...placed.values()].map((p) => p.slot + 1));
  const topRow = Math.max(0, ...[...placed.values()].map((p) => p.row));
  const mainY = padTop + topRow * rowGap;

  const nodes: LaidOutNode[] = state.nodes.map((n) => {
    const p = placed.get(n.id) ?? { slot: 0, row: 1 };
    return {
      id: n.id,
      value: n.value,
      x: PAD_X + p.slot * SLOT_W,
      y: mainY - p.row * rowGap,
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
      edges.push({ from: n.id, to: n.next, x1: startX, y1: a.y + NODE_H, x2: b.x + NODE_W - PTR_W / 2, y2: b.y });
    } else if (b.y < a.y) {
      edges.push({ from: n.id, to: n.next, x1: startX, y1: a.y, x2: b.x + NODE_W - PTR_W / 2, y2: b.y + NODE_H });
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

  const stacks: LabelStack[] = [...groups.entries()].map(([id, lines]) => {
    const at = id ? pos.get(id) : undefined;
    return { x: (at?.x ?? PAD_X) + 6, y: at?.y ?? mainY, lines: [...lines].sort((a, b) => Number(a.pointer === null) - Number(b.pointer === null) || (a.pointer ?? "").localeCompare(b.pointer ?? "")).reverse() };
  });

  return {
    stacks,
    nodes,
    edges,
    pointers,
    width: PAD_X * 2 + (slots - 1) * SLOT_W + NODE_W,
    height: mainY + NODE_H + PAD_BOTTOM,
    mainY,
  };
}

export const ROLE_PRIORITY: readonly HighlightRole[] = ["found", "swapped", "compared", "active", "created", "pointer", "window", "visited", "sorted"];
