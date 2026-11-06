import type { ArrayState, Highlight, HighlightRole } from "@algovision/trace-schema";
import { ROLE_PRIORITY } from "./linked-list-layout";

export const CELL_W = 56;
export const CELL_H = 56;
export const GAP = 6;
export const PAD_X = 20;
export const TOP = 34;
export const BOTTOM = 62;

export interface ArrayCellLayout {
  readonly index: number;
  readonly value: number;
  readonly x: number;
  readonly y: number;
  readonly role: HighlightRole | "none";
  readonly label?: string;
}

export interface ArrayLayout {
  readonly width: number;
  readonly height: number;
  readonly cells: readonly ArrayCellLayout[];
  /** Pointers grouped by the cell they sit under, so labels on one cell stack instead of overlapping. */
  readonly pointers: readonly { index: number; names: string[]; x: number }[];
  readonly detached: readonly string[];
}

export function layoutArray(state: ArrayState, highlights: readonly Highlight[]): ArrayLayout {
  const n = state.values.length;
  const width = Math.max(2 * PAD_X + n * CELL_W + Math.max(0, n - 1) * GAP, 2 * PAD_X + CELL_W);
  const cells = state.values.map((value, index): ArrayCellLayout => {
    const mine = highlights.filter((h) => h.target.kind === "index" && h.target.index === index);
    mine.sort((a, b) => ROLE_PRIORITY.indexOf(a.role) - ROLE_PRIORITY.indexOf(b.role));
    const label = mine.find((h) => h.label)?.label;
    return {
      index,
      value,
      x: PAD_X + index * (CELL_W + GAP),
      y: TOP,
      role: mine[0]?.role ?? "none",
      ...(label ? { label } : {}),
    };
  });
  const byIndex = new Map<number, string[]>();
  const detached: string[] = [];
  for (const [name, index] of Object.entries(state.pointers)) {
    if (index === null) {
      detached.push(name);
      continue;
    }
    byIndex.set(index, [...(byIndex.get(index) ?? []), name]);
  }
  const pointers = [...byIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([index, names]) => ({ index, names, x: PAD_X + index * (CELL_W + GAP) + CELL_W / 2 }));
  const rows = Math.max(1, ...pointers.map((p) => p.names.length));
  return { width, height: TOP + CELL_H + BOTTOM + (rows - 1) * 16, cells, pointers, detached };
}
