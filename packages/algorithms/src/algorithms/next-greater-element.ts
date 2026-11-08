import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { fmt, slot, stackSnapshot } from "./sequence-common";

export const ID = "next-greater-element";
export interface NgeInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<NgeInput> {
  return parseArrayWithFields(raw, limits, { noun: "array" }) as InputResult<NgeInput>;
}

export function run(input: NgeInput, limits: LimitProfile): ExecutionTrace {
  const { values } = input;
  const n = values.length;
  const stack: number[] = []; // indices whose next greater value is still unknown
  const result: number[] = new Array<number>(n).fill(-1);
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "stack", input: { values: [...values] }, maxSteps: limits.maxSteps });
  const idxList = () => (stack.length === 0 ? "empty" : stack.map((i) => `#${i} (${values[i]})`).join(", "));
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `For each value in ${fmt(values)}, find the first larger value to its right. The stack holds the positions still waiting for one; the picture shows those positions.`,
    variables: { size: 0 }, state: stackSnapshot(stack),
  });
  b.step({
    event: { type: "init" }, anchor: "init-result",
    explanation: "The answer for every position starts as -1, meaning none found yet.", variables: { size: 0 }, state: stackSnapshot(stack),
  });
  for (let i = 0; i < n; i++) {
    b.step({
      event: { type: "init" }, anchor: "loop",
      explanation: `Look at position ${i}, value ${values[i]}.`, variables: { i, value: values[i]!, size: stack.length }, state: stackSnapshot(stack),
      highlights: stack.length > 0 ? [slot(stack.length - 1, "active", "top")] : [],
    });
    for (;;) {
      const waiting = stack.length > 0 && values[stack[stack.length - 1]!]! < values[i]!;
      b.step({
        event: stack.length > 0 ? { type: "peek", element: indexRef(stack.length - 1) } : { type: "init" }, anchor: "while-check",
        explanation: stack.length === 0 ? "No position is waiting, so there is nothing to resolve." : waiting
          ? `The waiting value ${values[stack[stack.length - 1]!]} (position ${stack[stack.length - 1]}) is smaller than ${values[i]}, so ${values[i]} is its next greater value.`
          : `The waiting value ${values[stack[stack.length - 1]!]} is not smaller than ${values[i]}, so stop resolving.`,
        variables: { i, value: values[i]!, size: stack.length }, state: stackSnapshot(stack),
        highlights: stack.length > 0 ? [slot(stack.length - 1, waiting ? "found" : "compared", "top")] : [],
      });
      if (!waiting) break;
      const j = stack.pop()!;
      result[j] = values[i]!;
      b.step({
        event: { type: "pop", element: indexRef(stack.length) }, anchor: "pop-assign",
        explanation: `Pop position ${j} and record ${values[i]} as its answer. Answers so far: ${fmt(result)}.`,
        variables: { i, j, value: values[i]!, size: stack.length }, state: stackSnapshot(stack),
        highlights: stack.length > 0 ? [slot(stack.length - 1, "active", "top")] : [], motion: "disappear",
      });
    }
    stack.push(i);
    b.step({
      event: { type: "push", element: indexRef(stack.length - 1) }, anchor: "push",
      explanation: `Push position ${i}: it now waits for a larger value. Waiting: ${idxList()}.`,
      variables: { i, size: stack.length }, state: stackSnapshot(stack),
      changed: [indexRef(stack.length - 1)], highlights: [slot(stack.length - 1, "created", "top")], motion: "appear",
    });
  }
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `Done. Anything still on the stack has no larger value to its right and keeps -1. Answers: ${fmt(result)}.`,
    variables: { size: stack.length }, state: stackSnapshot(stack),
  });
  return b.build({ time: "O(n)", space: "O(n)", result });
}

export const nextGreaterElement: AlgorithmDefinition<NgeInput> = { id: ID, parseInput, run };
