import type { GridState, Highlight, HighlightRole } from "@algovision/trace-schema";
import { ROLE_PRIORITY } from "./linked-list-layout";

export const GRID_CELL = 46;
export const GRID_GAP = 4;
export const GRID_PAD = 12;
export const HEADER = 34;

export interface GridCellLayout {
  readonly index: number;
  readonly row: number;
  readonly col: number;
  /** The value, or an empty string for a cell that is not filled in yet. */
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly role: HighlightRole | "none";
  readonly label?: string;
}

export interface GridLayout {
  readonly width: number;
  readonly height: number;
  readonly cells: readonly GridCellLayout[];
  readonly colHeaders: readonly { text: string; x: number }[];
  readonly rowHeaders: readonly { text: string; y: number }[];
}

/** Rows are labelled with their labels when the trace has them (a table over two strings), otherwise with their index. */
export function layoutGrid(state: GridState, highlights: readonly Highlight[]): GridLayout {
  const { rows, cols } = state;
  const x0 = GRID_PAD + HEADER;
  const y0 = GRID_PAD + HEADER;
  const step = GRID_CELL + GRID_GAP;
  const header = (labels: readonly string[] | undefined, i: number) => (labels ? (labels[i] === "" ? "·" : labels[i]!) : String(i));
  const cells = state.cells.map((value, index): GridCellLayout => {
    const row = Math.floor(index / Math.max(1, cols));
    const col = index % Math.max(1, cols);
    const mine = highlights.filter((h) => h.target.kind === "index" && h.target.index === index);
    mine.sort((a, b) => ROLE_PRIORITY.indexOf(a.role) - ROLE_PRIORITY.indexOf(b.role));
    const label = mine.find((h) => h.label)?.label;
    return { index, row, col, text: value === null ? "" : String(value), x: x0 + col * step, y: y0 + row * step, role: mine[0]?.role ?? "none", ...(label ? { label } : {}) };
  });
  return {
    width: x0 + Math.max(cols, 1) * step - GRID_GAP + GRID_PAD,
    height: y0 + Math.max(rows, 1) * step - GRID_GAP + GRID_PAD,
    cells,
    colHeaders: Array.from({ length: cols }, (_, c) => ({ text: header(state.colLabels, c), x: x0 + c * step + GRID_CELL / 2 })),
    rowHeaders: Array.from({ length: rows }, (_, r) => ({ text: header(state.rowLabels, r), y: y0 + r * step + GRID_CELL / 2 })),
  };
}
