import type { Scene3D } from "@/lib/scene3d/types";
import type { ExecutionStep } from "@algovision/trace-schema";

/** The part of a trace a story needs: its steps. */
export interface ArrayTrace {
  /** What the algorithm was given (every real trace carries it). */
  readonly input?: Readonly<Record<string, unknown>>;
  readonly steps: readonly ExecutionStep<"array">[];
}

/**
 * A story retells one algorithm as an everyday scene (a tortoise and a rabbit, two friends at a shelf...).
 * It is a pure function of the trace the learner is already watching, so it can never disagree with the code:
 * same steps, same order, just different words and pictures. No trace schema change.
 */
export type Tone = "plain" | "dim" | "hit" | "warn" | "good";

export interface StoryCell {
  /** Big text in the cell (a number, a letter, a price). */
  main: string;
  /** Small text under it (an index, a sign, a label). */
  sub?: string;
  tone: Tone;
  /** 0 to 1: draws a small strip at the foot of the cell, as long as the value is tall (heights, sizes). */
  bar?: number;
}
export interface StoryActor {
  id: string;
  emoji: string;
  /** Short name shown under the emoji, for example "Tortoise". */
  name: string;
  /** Index of the cell the actor stands at. */
  at: number;
  /** Drawn above the cells (default) or below them. */
  row?: "top" | "bottom";
}
export interface StoryMeter {
  label: string;
  value: number;
  target: number;
  verdict: "low" | "high" | "match";
}
export interface StoryFrame {
  cells: StoryCell[];
  actors: StoryActor[];
  /** What is happening, in the story's own words. */
  says: string;
  /** What the story's step means for the program, one short line. */
  inCode?: string;
  meter?: StoryMeter;
  /** A running note under the scene, such as the shopkeeper's notebook or the totals so far. */
  board?: { label: string; text: string };
  banner?: { kind: "good" | "bad" | "info"; text: string };
}
export interface CastMember {
  emoji: string;
  name: string;
  /** The variable or idea it stands for in the code. */
  means: string;
}
export interface StoryMeta {
  /** The algorithm id this story belongs to. */
  id: string;
  title: string;
  emoji: string;
  /** The everyday situation, in two or three plain sentences. */
  hook: string;
  cast: CastMember[];
  /** The one line to remember, shown when the run ends. */
  moral: string;
}
/** A story told over a row of cells (the array algorithms). */
export interface Story extends StoryMeta {
  kind?: "array";
  frame(step: ExecutionStep<"array">, trace: ArrayTrace): StoryFrame;
}

/** Where a character stands on a chain: at a node (by id) or past the last node (where a null pointer points). */
export interface ChainActor {
  id: string;
  emoji: string;
  name: string;
  node: string | "end";
}
export interface ChainFrame {
  /** Colour per node id; nodes not listed are plain. */
  tones: Record<string, Tone>;
  actors: ChainActor[];
  says: string;
  inCode?: string;
  banner?: { kind: "good" | "bad" | "info"; text: string };
  board?: { label: string; text: string };
}
export interface LinkedListTrace {
  readonly steps: readonly ExecutionStep<"linkedList">[];
}
/** A story told over a chain of nodes (the linked-list algorithms). */
export interface ChainStory extends StoryMeta {
  kind: "linkedList";
  frame(step: ExecutionStep<"linkedList">, trace: LinkedListTrace): ChainFrame;
}

export interface TreeTrace {
  readonly steps: readonly ExecutionStep<"tree">[];
}
/** A story told over a binary tree (traversals, search tree operations, height). Frames use the same shape as chain stories: a colour per node id and characters standing on node ids. */
export interface TreeStory extends StoryMeta {
  kind: "tree";
  frame(step: ExecutionStep<"tree">, trace: TreeTrace): ChainFrame;
}

export interface GraphTrace {
  readonly steps: readonly ExecutionStep<"graph">[];
}
/** What a graph story says about one step: the chain frame plus a small badge under chosen vertices (distance, cost, waiting count). */
export interface GraphFrame extends ChainFrame {
  badges?: Record<string, string>;
}
/** A story told over a graph (traversals, shortest paths, ordering). */
export interface GraphStory extends StoryMeta {
  kind: "graph";
  frame(step: ExecutionStep<"graph">, trace: GraphTrace): GraphFrame;
}

export interface GridTrace {
  readonly steps: readonly ExecutionStep<"grid">[];
}
/**
 * What a grid story says about one step. Cells are named by their row-major index as a string; `cells` can replace what a
 * cell shows (a picture instead of a number) and add a tiny caption on its top edge.
 */
export interface GridFrame extends ChainFrame {
  cells?: Record<string, { text?: string; sub?: string }>;
}
/** A story told over a table or map (dynamic programming tables, island maps, rotting oranges, spiral walks). */
export interface GridStory extends StoryMeta {
  kind: "grid";
  frame(step: ExecutionStep<"grid">, trace: GridTrace): GridFrame;
}

export interface PileTrace {
  readonly input: Readonly<Record<string, unknown>>;
  readonly steps: readonly ExecutionStep<"stack" | "queue">[];
}
export interface PileItem {
  text: string;
  tone: Tone;
  /** A tiny caption on the item (for example the position it came from). */
  sub?: string;
}
/**
 * What a stack or queue story says about one step: an optional strip of the input being read (with a marker on the current item),
 * the items now in the stack or queue, and the usual narration, code line, banner and board.
 */
export interface PileFrame {
  strip?: { label: string; items: { text: string; tone: Tone }[]; at?: number };
  pile: PileItem[];
  /** Name written next to the container, for example "Plates (top is the right)". */
  pileName: string;
  says: string;
  inCode?: string;
  banner?: { kind: "good" | "bad" | "info"; text: string };
  board?: { label: string; text: string };
}
/** A story told over a stack or a queue, usually with the input line shown above it. */
export interface PileStory extends StoryMeta {
  kind: "pile";
  /** How the container is drawn: a stack stands up (top at the top), a queue lies down (front on the left). */
  shape: "stack" | "queue";
  frame(step: ExecutionStep<"stack" | "queue">, trace: PileTrace): PileFrame;
  /** When present, the same step can also be drawn as a real-world 3D scene (people, objects) instead of cells. */
  scene3d?(step: ExecutionStep<"stack" | "queue">, trace: PileTrace): Scene3D;
}

export interface TrieTrace {
  readonly input: Readonly<Record<string, unknown>>;
  readonly steps: readonly ExecutionStep<"trie">[];
}
/**
 * What a trie story says about one step: the chain frame (a colour per node id, characters standing on node ids) plus an optional strip of
 * letters being walked (with a pointer on the next letter) and a small badge under chosen nodes (for example how many endings pass through).
 */
export interface TrieFrame extends ChainFrame {
  strip?: { label: string; items: { text: string; tone: Tone }[]; at?: number };
  badges?: Record<string, string>;
}
/** A story told over a trie of letters (words, prefixes, suffixes). */
export interface TrieStory extends StoryMeta {
  kind: "trie";
  frame(step: ExecutionStep<"trie">, trace: TrieTrace): TrieFrame;
}

/** The value of a named variable at this step, or null when it is not set yet. */
export function variable(step: ExecutionStep, name: string): number | null {
  const v = step.variables.find((x) => x.name === name)?.value;
  return typeof v === "number" ? v : null;
}
export function anchorOf(step: ExecutionStep): string {
  return step.source.kind === "anchor" ? step.source.id : "";
}

/** Node ids in list order, starting at `from` (the head by default), stopping at null or a repeat. */
export function chainIds(state: { nodes: readonly { id: string; next: string | null }[]; head: string | null }, from: string | null = state.head): string[] {
  const byId = new Map(state.nodes.map((n) => [n.id, n]));
  const ids: string[] = [];
  let id = from;
  while (id !== null && byId.has(id) && !ids.includes(id)) {
    ids.push(id);
    id = byId.get(id)!.next;
  }
  return ids;
}
/** The values along the list from the head, for example [1, 2, 3]. */
export function chainValues(state: { nodes: readonly { id: string; value: number; next: string | null }[]; head: string | null }): number[] {
  const byId = new Map(state.nodes.map((n) => [n.id, n]));
  return chainIds(state).map((id) => byId.get(id)!.value);
}
/** The node a named pointer aims at: its id, null (points at nothing) or undefined (the pointer is not in use right now). */
export function pointerOf(step: ExecutionStep<"linkedList">, name: string): string | null | undefined {
  return Object.prototype.hasOwnProperty.call(step.state.pointers, name) ? step.state.pointers[name] : undefined;
}
