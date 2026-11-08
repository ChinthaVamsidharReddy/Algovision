import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "move-zeroes";
export interface MoveZeroesInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<MoveZeroesInput> {
  return parseArrayWithFields(raw, limits, {}) as InputResult<MoveZeroesInput>;
}

export function run(input: MoveZeroesInput, limits: LimitProfile): ExecutionTrace {
  const arr = [...input.values];
  const n = arr.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...input.values] }, maxSteps: limits.maxSteps });
  let write = 0;
  const done = (read: number, extra: Highlight[] = []): Highlight[] => [...arr.map((_, k) => cell(k, k < write ? "sorted" : "visited")).slice(0, Math.max(read, write)), ...extra];

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Move every zero in ${fmt(arr)} to the end while keeping the other values in order. write marks where the next non-zero value belongs.`,
    variables: {}, state: snapshot(arr, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init-write",
    explanation: "write starts at index 0.", variables: { write }, state: snapshot(arr, { write: ptr(write, n) }), highlights: n > 0 ? [cell(0, "active", "write")] : [],
  });
  for (let read = 0; read < n; read++) {
    b.step({
      event: { type: "movePointer", pointer: "read", to: indexRef(read) }, anchor: "loop",
      explanation: `Look at index ${read}, which holds ${arr[read]}.`,
      variables: { read, write }, state: snapshot(arr, { read, write: ptr(write, n) }), highlights: [...done(read), cell(read, "active", "read")],
    });
    const nonzero = arr[read] !== 0;
    b.step({
      event: { type: "compare", a: indexRef(read), b: indexRef(read) }, anchor: "check-nonzero",
      explanation: nonzero ? `${arr[read]} is not zero, so it goes to the write position.` : "It is zero, so skip it. write stays where it is.",
      variables: { read, write }, state: snapshot(arr, { read, write: ptr(write, n) }), highlights: [...done(read), cell(read, "compared")],
    });
    if (nonzero) {
      const a = arr[write]!;
      arr[write] = arr[read]!;
      arr[read] = a;
      b.step({
        event: write === read ? { type: "movePointer", pointer: "write", to: indexRef(write) } : { type: "swap", a: indexRef(write), b: indexRef(read) }, anchor: "swap",
        explanation: write === read ? "write and read are the same cell, so nothing moves." : `Swap index ${write} (${a}) with index ${read} (${arr[write]}): the non-zero value moves forward.`,
        variables: { read, write }, state: snapshot(arr, { read, write }), changed: write === read ? [] : [indexRef(write), indexRef(read)],
        highlights: [...done(read), cell(write, "swapped"), cell(read, "swapped")], motion: write === read ? undefined : "swap",
      });
      write++;
      b.step({
        event: { type: "movePointer", pointer: "write", to: indexRef(Math.min(write, n - 1)) }, anchor: "advance-write",
        explanation: `Advance write to ${write}.`,
        variables: { read, write }, state: snapshot(arr, { read, write: ptr(write, n) }), highlights: done(read + 1),
      });
    }
  }
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `All non-zero values are in front, in their original order: ${fmt(arr)}.`,
    variables: { write }, state: snapshot(arr, {}), highlights: arr.map((v, k) => cell(k, v === 0 ? "visited" : "sorted")),
  });
  return b.build({ time: "O(n)", space: "O(1)", result: arr });
}

export const moveZeroes: AlgorithmDefinition<MoveZeroesInput> = { id: ID, parseInput, run };
