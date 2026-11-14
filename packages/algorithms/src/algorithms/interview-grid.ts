import { z } from "zod";
import { indexRef, type ExecutionTrace, type Highlight, type TraceEvent } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder, type Scalar } from "../trace-builder";
import { cell } from "./array-common";

/** Milestone 11 part 2: grid and two-string table algorithms, drawn with the grid state (schema 1.4). */
export interface GridIn { readonly grid: readonly (readonly number[])[] }
export interface Pair { readonly s: string; readonly t: string }

type Cell = number | null;

/** Step bookkeeping for grid algorithms; a cell reference is its row-major index. */
class GridTrace {
  readonly cells: Cell[];
  private readonly b: TraceBuilder<"grid">;
  constructor(id: string, input: Record<string, unknown>, readonly rows: number, readonly cols: number, cells: readonly Cell[], limits: LimitProfile, private readonly labels: { rowLabels?: string[]; colLabels?: string[] } = {}) {
    this.cells = [...cells];
    this.b = new TraceBuilder({ algorithmId: id, stateKind: "grid", input, maxSteps: limits.maxSteps });
  }
  at(r: number, c: number): number { return r * this.cols + c; }
  step(event: TraceEvent, anchor: string, explanation: string, variables: Record<string, Scalar>, highlights: readonly Highlight[] = [], changed: readonly number[] = []): void {
    this.b.step({
      event, anchor, explanation, variables, highlights: [...highlights],
      state: { kind: "grid", rows: this.rows, cols: this.cols, cells: [...this.cells], ...this.labels },
      ...(changed.length > 0 ? { changed: changed.map((i) => indexRef(i)) } : {}),
    });
  }
  finish(result: unknown, time: string, space: string): ExecutionTrace {
    return this.b.build({ time, space, result });
  }
}

const where = (r: number, c: number) => `row ${r}, column ${c}`;
const marked = (flags: readonly boolean[], role: "visited" | "found" = "visited"): Highlight[] => flags.flatMap((f, i) => (f ? [cell(i, role)] : []));

// ---------------------------------------------------------------- input parsing
function parseGrid(raw: unknown, limits: LimitProfile, o: { digitMax: number; allowEmpty: boolean; valueMessage: string }): InputResult<GridIn> {
  const parsed = z
    .strictObject({ grid: z.array(z.array(z.number({ error: "The grid must contain digits." }).int("The grid must contain digits.").min(0, o.valueMessage).max(o.digitMax, o.valueMessage), { error: "Each grid row must be a list of digits." }), { error: "The grid must be a list of rows." }) })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i): FieldError => ({ field: String(i.path[0] ?? "grid"), message: i.message })) };
  const grid = parsed.data.grid;
  const side = limits.maxGridSide;
  const fail = (message: string): InputResult<GridIn> => ({ ok: false, errors: [{ field: "grid", message }] });
  if (grid.length === 0) return o.allowEmpty ? { ok: true, value: { grid } } : fail("Enter at least one row, for example 110, 011.");
  if (grid.length > side) return fail(`The grid can have at most ${side} rows.`);
  const cols = grid[0]!.length;
  if (cols === 0) return fail("Each row needs at least one digit.");
  if (cols > side) return fail(`The grid can have at most ${side} columns.`);
  if (grid.some((row) => row.length !== cols)) return fail("Every row must have the same number of digits.");
  return { ok: true, value: { grid } };
}

function parsePair(raw: unknown, limits: LimitProfile): InputResult<Pair> {
  const text = (name: string) =>
    z.string({ error: `${name} must be a string of letters.` }).max(limits.maxDpText, `${name} can have at most ${limits.maxDpText} characters.`).regex(/^[a-z]*$/, "Use lowercase letters a to z only (no spaces, digits or capitals).");
  const parsed = z.strictObject({ s: text("The first text"), t: text("The second text") }).safeParse(raw);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i): FieldError => ({ field: String(i.path[0] ?? "s"), message: i.message })) };
  return { ok: true, value: parsed.data };
}

const DIRS: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const dirName = (dr: number, dc: number) => (dr === 1 ? "below" : dr === -1 ? "above" : dc === 1 ? "right" : "left");

// ---------------------------------------------------------------- number of islands (DFS)
export const ISLANDS_ID = "number-of-islands";
export const parseIslands = (raw: unknown, limits: LimitProfile) => parseGrid(raw, limits, { digitMax: 1, allowEmpty: true, valueMessage: "Use 1 for land and 0 for water." });
export function runIslands({ grid }: GridIn, limits: LimitProfile): ExecutionTrace {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0]!.length : 0;
  const g = grid.flat();
  const T = new GridTrace(ISLANDS_ID, { grid: grid.map((r) => [...r]) }, rows, cols, g, limits);
  const seen = new Array<boolean>(rows * cols).fill(false);
  T.step({ type: "init" }, "entry", `Count the islands in this ${rows} x ${cols} grid (1 is land, 0 is water). Land cells that touch above, below, left or right belong to the same island.`, {});
  let islands = 0;
  T.step({ type: "init" }, "init", "Start with 0 islands and no cell visited.", { islands }, []);
  const flood = (r: number, c: number): void => {
    const i = T.at(r, c);
    seen[i] = true;
    T.step({ type: "visit", element: indexRef(i) }, "visit", `Visit ${where(r, c)} and mark it as part of this island.`, { r, c, islands }, [...marked(seen), cell(i, "active", "here")], [i]);
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const inside = nr >= 0 && nc >= 0 && nr < rows && nc < cols;
      const ni = inside ? T.at(nr, nc) : -1;
      const fresh = inside && g[ni] === 1 && !seen[ni];
      const why = !inside ? "that is outside the grid" : g[ni] === 0 ? "that is water" : seen[ni] ? "that land is already visited" : "that is new land";
      T.step(inside ? { type: "compare", a: indexRef(i), b: indexRef(ni) } : { type: "init" }, "check", `Look ${dirName(dr, dc)}: ${why}.${fresh ? " Go there." : ""}`, { r, c, islands }, [...marked(seen), cell(i, "active", "here"), ...(inside ? [cell(ni, fresh ? "found" : "compared")] : [])]);
      if (fresh) {
        T.step({ type: "init" }, "spread", `Continue the search from ${where(nr, nc)}.`, { r, c, islands }, [...marked(seen), cell(i, "active", "here"), cell(ni, "found")]);
        flood(nr, nc);
      }
    }
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = T.at(r, c);
      const land = g[i] === 1;
      const isNew = land && !seen[i];
      T.step({ type: "init" }, "scan", `Scan ${where(r, c)}: ${!land ? "water" : seen[i] ? "land that belongs to an island already counted" : "new land"}.`, { r, c, islands }, [...marked(seen), cell(i, isNew ? "found" : "compared", "scan")]);
      if (isNew) {
        islands++;
        T.step({ type: "found", element: indexRef(i) }, "new-island", `A new island! The count is now ${islands}. Flood it so none of its cells is counted again.`, { r, c, islands }, [...marked(seen), cell(i, "found", "start")]);
        flood(r, c);
      }
    }
  }
  T.step({ type: "done" }, "finish", `Every cell was scanned. There ${islands === 1 ? "is 1 island" : `are ${islands} islands`}.`, { islands, result: islands }, marked(seen, "found"));
  return T.finish(islands, "O(rows x cols)", "O(rows x cols)");
}
export const numberOfIslands: AlgorithmDefinition<GridIn> = { id: ISLANDS_ID, parseInput: parseIslands, run: runIslands };

// ---------------------------------------------------------------- max area of island
export const AREA_ID = "max-area-of-island";
export const parseArea = parseIslands;
export function runArea({ grid }: GridIn, limits: LimitProfile): ExecutionTrace {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0]!.length : 0;
  const g = grid.flat();
  const T = new GridTrace(AREA_ID, { grid: grid.map((r) => [...r]) }, rows, cols, g, limits);
  const seen = new Array<boolean>(rows * cols).fill(false);
  T.step({ type: "init" }, "entry", `Find the size of the biggest island in this ${rows} x ${cols} grid. Flood each island and count the cells it covers.`, {});
  let best = 0;
  T.step({ type: "init" }, "init", "Start with a best size of 0.", { best });
  const flood = (r: number, c: number): number => {
    const i = T.at(r, c);
    seen[i] = true;
    let size = 1;
    T.step({ type: "visit", element: indexRef(i) }, "visit", `Visit ${where(r, c)}. It counts as 1 cell so far.`, { r, c, size, best }, [...marked(seen), cell(i, "active", "here")], [i]);
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const inside = nr >= 0 && nc >= 0 && nr < rows && nc < cols;
      const ni = inside ? T.at(nr, nc) : -1;
      const fresh = inside && g[ni] === 1 && !seen[ni];
      const why = !inside ? "outside the grid" : g[ni] === 0 ? "water" : seen[ni] ? "land already visited" : "new land";
      T.step(inside ? { type: "compare", a: indexRef(i), b: indexRef(ni) } : { type: "init" }, "check", `Look ${dirName(dr, dc)}: ${why}.${fresh ? " Go there." : ""}`, { r, c, size, best }, [...marked(seen), cell(i, "active", "here"), ...(inside ? [cell(ni, fresh ? "found" : "compared")] : [])]);
      if (fresh) {
        const part = flood(nr, nc);
        size += part;
        T.step({ type: "init" }, "spread", `The branch ${dirName(dr, dc)} added ${part} cell${part === 1 ? "" : "s"}, so ${where(r, c)} now covers ${size}.`, { r, c, size, best }, [...marked(seen), cell(i, "active", "here")]);
      }
    }
    return size;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = T.at(r, c);
      const isNew = g[i] === 1 && !seen[i];
      T.step({ type: "init" }, "scan", `Scan ${where(r, c)}: ${g[i] === 0 ? "water" : seen[i] ? "land already measured" : "new land"}.`, { r, c, best }, [...marked(seen), cell(i, isNew ? "found" : "compared", "scan")]);
      if (isNew) {
        const size = flood(r, c);
        const better = size > best;
        if (better) best = size;
        T.step({ type: "assign", target: indexRef(i), value: size }, "record", better ? `This island has ${size} cells, a new best.` : `This island has ${size} cells, which does not beat ${best}.`, { r, c, size, best }, marked(seen, "found"));
      }
    }
  }
  T.step({ type: "done" }, "finish", `The biggest island has ${best} cell${best === 1 ? "" : "s"}.`, { best, result: best }, marked(seen, "found"));
  return T.finish(best, "O(rows x cols)", "O(rows x cols)");
}
export const maxAreaOfIsland: AlgorithmDefinition<GridIn> = { id: AREA_ID, parseInput: parseArea, run: runArea };

// ---------------------------------------------------------------- rotting oranges (BFS by minutes)
export const ROTTING_ID = "rotting-oranges";
export const parseRotting = (raw: unknown, limits: LimitProfile) => parseGrid(raw, limits, { digitMax: 2, allowEmpty: true, valueMessage: "Use 0 for empty, 1 for a fresh orange and 2 for a rotten orange." });
export function runRotting({ grid }: GridIn, limits: LimitProfile): ExecutionTrace {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0]!.length : 0;
  const T = new GridTrace(ROTTING_ID, { grid: grid.map((r) => [...r]) }, rows, cols, grid.flat(), limits);
  const cells = T.cells as number[];
  T.step({ type: "init" }, "entry", `Each minute every rotten orange (2) rots the fresh oranges (1) next to it. Find how many minutes until none is fresh, or -1 if some can never rot.`, {});
  const queue: number[] = [];
  let fresh = 0;
  cells.forEach((v, i) => { if (v === 2) queue.push(i); else if (v === 1) fresh++; });
  let minutes = 0;
  T.step({ type: "init" }, "init", `Queue the ${queue.length} rotten orange${queue.length === 1 ? "" : "s"} and count ${fresh} fresh one${fresh === 1 ? "" : "s"}.`, { fresh, queued: queue.length, minutes }, queue.map((i) => cell(i, "swapped", "rotten")));
  while (queue.length > 0 && fresh > 0) {
    minutes++;
    const batch = queue.splice(0, queue.length);
    T.step({ type: "init" }, "round", `Minute ${minutes}: the ${batch.length} orange${batch.length === 1 ? "" : "s"} rotten at the start of this minute spread the rot.`, { fresh, queued: batch.length, minutes }, batch.map((i) => cell(i, "swapped", "source")));
    for (const src of batch) {
      const r = Math.floor(src / cols);
      const c = src % cols;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        const inside = nr >= 0 && nc >= 0 && nr < rows && nc < cols;
        const ni = inside ? T.at(nr, nc) : -1;
        const hit = inside && cells[ni] === 1;
        const why = !inside ? "outside the grid" : cells[ni] === 0 ? "empty" : cells[ni] === 2 ? "already rotten" : "fresh";
        T.step(inside ? { type: "compare", a: indexRef(src), b: indexRef(ni) } : { type: "init" }, "check", `From ${where(r, c)}, look ${dirName(dr, dc)}: ${why}.${hit ? " It rots." : ""}`, { fresh, minutes }, [cell(src, "active", "source"), ...(inside ? [cell(ni, hit ? "found" : "compared")] : [])]);
        if (hit) {
          cells[ni] = 2;
          fresh--;
          queue.push(ni);
          T.step({ type: "assign", target: indexRef(ni), value: 2 }, "rot", `${where(nr, nc)} turns rotten. ${fresh} fresh orange${fresh === 1 ? "" : "s"} left.`, { fresh, minutes }, [cell(src, "active", "source"), cell(ni, "created", "rots")], [ni]);
        }
      }
    }
  }
  const result = fresh === 0 ? minutes : -1;
  T.step({ type: "done" }, "finish", result === -1 ? `${fresh} fresh orange${fresh === 1 ? "" : "s"} can never be reached, so the answer is -1.` : `No fresh orange is left after ${minutes} minute${minutes === 1 ? "" : "s"}.`, { fresh, minutes, result }, []);
  return T.finish(result, "O(rows x cols)", "O(rows x cols)");
}
export const rottingOranges: AlgorithmDefinition<GridIn> = { id: ROTTING_ID, parseInput: parseRotting, run: runRotting };

// ---------------------------------------------------------------- minimum path sum (in-place DP)
export const MINPATH_ID = "min-path-sum";
export const parseMinPath = (raw: unknown, limits: LimitProfile) => parseGrid(raw, limits, { digitMax: 9, allowEmpty: false, valueMessage: "Each cell cost must be a digit from 0 to 9." });
export function runMinPath({ grid }: GridIn, limits: LimitProfile): ExecutionTrace {
  const rows = grid.length;
  const cols = grid[0]!.length;
  const T = new GridTrace(MINPATH_ID, { grid: grid.map((r) => [...r]) }, rows, cols, grid.flat(), limits);
  const cells = T.cells as number[];
  T.step({ type: "init" }, "entry", `Each cell is a toll. Walk from the top-left to the bottom-right moving only right or down, paying every toll on the way. Overwrite each cell with the cheapest total cost of reaching it.`, {});
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = T.at(r, c);
      if (r === 0 && c === 0) {
        T.step({ type: "init" }, "start", `The start costs ${cells[i]} to enter and has nothing before it, so it stays ${cells[i]}.`, { r, c, cost: cells[i]! }, [cell(i, "active", "start")]);
        continue;
      }
      const up = r > 0 ? cells[T.at(r - 1, c)]! : null;
      const left = c > 0 ? cells[T.at(r, c - 1)]! : null;
      const best = Math.min(up ?? Infinity, left ?? Infinity);
      const from = up !== null && left !== null ? `above is ${up}, left is ${left}` : up !== null ? `only the cell above (${up}) leads here` : `only the cell on the left (${left}) leads here`;
      T.step({ type: "compare", a: indexRef(i), b: indexRef(i) }, "best", `${where(r, c)}: ${from}. The cheaper way in costs ${best}.`, { r, c, best }, [cell(i, "active", "here"), ...(up !== null ? [cell(T.at(r - 1, c), up === best ? "found" : "compared")] : []), ...(left !== null ? [cell(T.at(r, c - 1), left === best ? "found" : "compared")] : [])]);
      const toll = cells[i]!;
      cells[i] = toll + best;
      T.step({ type: "assign", target: indexRef(i), value: cells[i]! }, "add", `Add the toll ${toll}: the cheapest way to reach ${where(r, c)} costs ${cells[i]}.`, { r, c, best, cost: cells[i]! }, [cell(i, "found", "total")], [i]);
    }
  }
  const result = cells[cells.length - 1]!;
  T.step({ type: "done" }, "finish", `The cheapest path costs ${result}.`, { result }, [cell(cells.length - 1, "found", "answer")]);
  return T.finish(result, "O(rows x cols)", "O(1)");
}
export const minPathSum: AlgorithmDefinition<GridIn> = { id: MINPATH_ID, parseInput: parseMinPath, run: runMinPath };

// ---------------------------------------------------------------- spiral order
export const SPIRAL_ID = "spiral-order";
export const parseSpiral = (raw: unknown, limits: LimitProfile) => parseGrid(raw, limits, { digitMax: 9, allowEmpty: true, valueMessage: "Each cell must be a digit from 0 to 9." });
export function runSpiral({ grid }: GridIn, limits: LimitProfile): ExecutionTrace {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0]!.length : 0;
  const g = grid.flat();
  const T = new GridTrace(SPIRAL_ID, { grid: grid.map((r) => [...r]) }, rows, cols, g, limits);
  const out: number[] = [];
  const done: boolean[] = new Array<boolean>(rows * cols).fill(false);
  T.step({ type: "init" }, "entry", `Read the grid in a spiral: along the top, down the right side, back along the bottom, up the left side, then repeat on the inner layer.`, {});
  let top = 0;
  let bottom = rows - 1;
  let left = 0;
  let right = cols - 1;
  T.step({ type: "init" }, "init", `Four borders mark what is left to read: top = ${top}, bottom = ${bottom}, left = ${left}, right = ${right}.`, { top, bottom, left, right, taken: 0 });
  const side = (anchor: string, name: string, path: number[]): void => {
    for (const i of path) { out.push(g[i]!); done[i] = true; }
    T.step({ type: "init" }, anchor, `${name}: read ${path.map((i) => g[i]).join(", ")}. Output so far: ${out.join(", ")}.`, { top, bottom, left, right, taken: out.length }, [...marked(done), ...path.map((i) => cell(i, "found"))]);
  };
  while (top <= bottom && left <= right) {
    T.step({ type: "init" }, "layer", `Start a layer: rows ${top} to ${bottom}, columns ${left} to ${right}.`, { top, bottom, left, right, taken: out.length }, marked(done));
    const topPath: number[] = [];
    for (let c = left; c <= right; c++) topPath.push(T.at(top, c));
    top++;
    side("top", "Along the top", topPath);
    const rightPath: number[] = [];
    for (let r = top; r <= bottom; r++) rightPath.push(T.at(r, right));
    right--;
    if (rightPath.length > 0) side("right", "Down the right side", rightPath);
    if (top <= bottom) {
      const path: number[] = [];
      for (let c = right; c >= left; c--) path.push(T.at(bottom, c));
      bottom--;
      side("bottom", "Back along the bottom", path);
    }
    if (left <= right) {
      const path: number[] = [];
      for (let r = bottom; r >= top; r--) path.push(T.at(r, left));
      left++;
      if (path.length > 0) side("left", "Up the left side", path);
    }
  }
  T.step({ type: "done" }, "finish", out.length === 0 ? "The grid is empty, so there is nothing to read." : `Every cell was read: ${out.join(", ")}.`, { taken: out.length }, marked(done, "found"));
  return T.finish(out, "O(rows x cols)", "O(rows x cols)");
}
export const spiralOrder: AlgorithmDefinition<GridIn> = { id: SPIRAL_ID, parseInput: parseSpiral, run: runSpiral };

// ---------------------------------------------------------------- two-string tables
function tableTrace(id: string, { s, t }: Pair, limits: LimitProfile, mode: "lcs" | "edit"): ExecutionTrace {
  const m = s.length;
  const n = t.length;
  const cols = n + 1;
  const T = new GridTrace(id, { s, t }, m + 1, cols, new Array<Cell>((m + 1) * cols).fill(null), limits, { rowLabels: ["", ...s], colLabels: ["", ...t] });
  const dp = T.cells;
  const at = (i: number, j: number) => i * cols + j;
  const v = (i: number, j: number) => dp[at(i, j)] as number;
  T.step({ type: "init" }, "entry", mode === "lcs" ? `Find the length of the longest common subsequence of "${s}" and "${t}": letters that appear in both, in the same order, not necessarily next to each other. Cell (i, j) answers the question for the first i letters of the first text and the first j letters of the second.` : `Find the fewest single-letter edits (insert, delete or replace) that turn "${s}" into "${t}". Cell (i, j) holds the answer for the first i letters of the first text and the first j letters of the second.`, {});
  const border: number[] = [];
  for (let i = 0; i <= m; i++) { dp[at(i, 0)] = mode === "lcs" ? 0 : i; border.push(at(i, 0)); }
  for (let j = 1; j <= n; j++) { dp[at(0, j)] = mode === "lcs" ? 0 : j; border.push(at(0, j)); }
  T.step({ type: "init" }, "init", mode === "lcs" ? "With one of the texts empty, the common subsequence is empty, so the first row and column are 0." : "Turning a text into an empty one takes one delete per letter, and building one from an empty text takes one insert per letter. Fill the first row and column.", {}, border.map((i) => cell(i, "visited")), border);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const k = at(i, j);
      const same = s[i - 1] === t[j - 1];
      T.step({ type: "compare", a: indexRef(k), b: indexRef(k) }, "compare", `Cell (${i}, ${j}): compare "${s[i - 1]}" (first text) with "${t[j - 1]}" (second text): ${same ? "they match" : "they differ"}.`, { i, j }, [cell(k, "active", "here")]);
      if (mode === "lcs") {
        if (same) {
          dp[k] = v(i - 1, j - 1) + 1;
          T.step({ type: "assign", target: indexRef(k), value: dp[k]! }, "match", `A match extends the best answer for the shorter texts (${v(i - 1, j - 1)}) by one: ${dp[k]}.`, { i, j, value: dp[k]! }, [cell(at(i - 1, j - 1), "compared", "diag"), cell(k, "found")], [k]);
        } else {
          dp[k] = Math.max(v(i - 1, j), v(i, j - 1));
          T.step({ type: "assign", target: indexRef(k), value: dp[k]! }, "skip", `No match: drop a letter from one text. The better of above (${v(i - 1, j)}) and left (${v(i, j - 1)}) is ${dp[k]}.`, { i, j, value: dp[k]! }, [cell(at(i - 1, j), "compared", "up"), cell(at(i, j - 1), "compared", "left"), cell(k, "found")], [k]);
        }
      } else if (same) {
        dp[k] = v(i - 1, j - 1);
        T.step({ type: "assign", target: indexRef(k), value: dp[k]! }, "match", `The letters match, so no edit is needed here: copy the diagonal value ${dp[k]}.`, { i, j, value: dp[k]! }, [cell(at(i - 1, j - 1), "compared", "diag"), cell(k, "found")], [k]);
      } else {
        const del = v(i - 1, j) + 1;
        const ins = v(i, j - 1) + 1;
        const rep = v(i - 1, j - 1) + 1;
        dp[k] = Math.min(del, ins, rep);
        T.step({ type: "assign", target: indexRef(k), value: dp[k]! }, "edit", `The letters differ. Delete costs ${del} (above + 1), insert costs ${ins} (left + 1), replace costs ${rep} (diagonal + 1). The cheapest is ${dp[k]}.`, { i, j, value: dp[k]! }, [cell(at(i - 1, j), "compared", "delete"), cell(at(i, j - 1), "compared", "insert"), cell(at(i - 1, j - 1), "compared", "replace"), cell(k, "found")], [k]);
      }
    }
  }
  const result = v(m, n);
  T.step({ type: "done" }, "finish", mode === "lcs" ? `The longest common subsequence has length ${result}.` : `The edit distance is ${result}.`, { result }, [cell(at(m, n), "found", "answer")]);
  return T.finish(result, "O(m x n)", "O(m x n)");
}
export const LCS_ID = "longest-common-subsequence";
export const EDIT_ID = "edit-distance";
export const parseLcs = parsePair;
export const parseEdit = parsePair;
export const runLcs = (i: Pair, l: LimitProfile) => tableTrace(LCS_ID, i, l, "lcs");
export const runEdit = (i: Pair, l: LimitProfile) => tableTrace(EDIT_ID, i, l, "edit");
export const longestCommonSubsequence: AlgorithmDefinition<Pair> = { id: LCS_ID, parseInput: parseLcs, run: runLcs };
export const editDistance: AlgorithmDefinition<Pair> = { id: EDIT_ID, parseInput: parseEdit, run: runEdit };
