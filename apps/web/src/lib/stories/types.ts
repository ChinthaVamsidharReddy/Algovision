import type { ExecutionStep } from "@algovision/trace-schema";

/** The part of a trace a story needs: its steps. */
export interface ArrayTrace {
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
  banner?: { kind: "good" | "bad" | "info"; text: string };
}
export interface CastMember {
  emoji: string;
  name: string;
  /** The variable or idea it stands for in the code. */
  means: string;
}
export interface Story {
  /** The algorithm id this story belongs to. */
  id: string;
  title: string;
  emoji: string;
  /** The everyday situation, in two or three plain sentences. */
  hook: string;
  cast: CastMember[];
  /** The one line to remember, shown when the run ends. */
  moral: string;
  frame(step: ExecutionStep<"array">, trace: ArrayTrace): StoryFrame;
}

/** The value of a named variable at this step, or null when it is not set yet. */
export function variable(step: ExecutionStep, name: string): number | null {
  const v = step.variables.find((x) => x.name === name)?.value;
  return typeof v === "number" ? v : null;
}
export function anchorOf(step: ExecutionStep): string {
  return step.source.kind === "anchor" ? step.source.id : "";
}
