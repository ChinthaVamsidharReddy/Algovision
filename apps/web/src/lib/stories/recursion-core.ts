import type { ExecutionStep } from "@algovision/trace-schema";
import { anchorOf, type CastMember, type PileFrame, type PileStory, type PileTrace } from "./types";
import { isLast, roleAt, toneOfRole, variable } from "./pile-util";

type Step = ExecutionStep<"stack" | "queue">;

/** What a recursion story knows when it speaks about one step. */
export interface CallCtx {
  /** The argument of the call this step is about (the top note, or the note that is just leaving). */
  a: number;
  anchor: string;
  /** Depth of the pile after this step. */
  depth: number;
  v: (name: string) => number | undefined;
  input: Readonly<Record<string, unknown>>;
  /** Notes written so far, up to and including this step. */
  calls: number;
  first: boolean;
}
export interface Line { says: string; inCode?: string }
export interface CallSpec {
  id: string;
  title: string;
  emoji: string;
  hook: string;
  cast: CastMember[];
  moral: string;
  /** The variable that holds each call's own argument (the same thing the pile shows). */
  argVar: string;
  /** A short caption for a note, for example `fib(3)`. */
  label: (a: number, input: Readonly<Record<string, unknown>>) => string;
  push: (c: CallCtx) => Line;
  peek: (c: CallCtx) => Line;
  pop: (c: CallCtx) => Line;
  done: (c: CallCtx, result: number) => Line;
  /** The line under the board, when it is more interesting than the depth. */
  board?: (c: CallCtx) => { label: string; text: string };
  finalBanner?: "good" | "info";
}

const num = (x: unknown): number => (typeof x === "number" ? x : 0);

/** A recursive function told as a pile of sticky notes: every unfinished question stays on the pile until the smaller question below it answers. */
export function callStory(spec: CallSpec): PileStory {
  return {
    id: spec.id,
    kind: "pile",
    shape: "stack",
    title: spec.title,
    emoji: spec.emoji,
    hook: spec.hook,
    cast: spec.cast,
    moral: spec.moral,
    frame(step: Step, trace: PileTrace): PileFrame {
      const a0 = anchorOf(step);
      const v = (name: string) => variable(step, name);
      let calls = 0;
      for (const s of trace.steps) {
        if (s.index > step.index) break;
        if (s.event.type === "push") calls++;
      }
      const items = step.state.items;
      const ctx: CallCtx = { a: v(spec.argVar) ?? items[items.length - 1] ?? 0, anchor: a0, depth: items.length, v, input: trace.input, calls, first: calls === 1 };
      const type = step.event.type;
      let line: Line;
      if (type === "push") line = spec.push(ctx);
      else if (type === "pop") line = isLast(step, trace) ? spec.done(ctx, v("result") ?? 0) : spec.pop(ctx);
      else if (type === "done") line = spec.done(ctx, v("result") ?? 0);
      else line = spec.peek(ctx);
      const finished = type === "done" || (type === "pop" && isLast(step, trace));
      const pile = items.map((x, i) => ({ text: String(x), sub: spec.label(x, trace.input), tone: toneOfRole(roleAt(step, i)) }));
      return {
        pile,
        pileName: "Sticky notes (newest on top)",
        says: line.says,
        inCode: line.inCode,
        banner: finished ? { kind: spec.finalBanner ?? "good", text: `Answer: ${num(v("result"))}` } : undefined,
        board: spec.board ? spec.board(ctx) : { label: "Notes on the pile", text: String(items.length) },
      };
    },
  };
}
