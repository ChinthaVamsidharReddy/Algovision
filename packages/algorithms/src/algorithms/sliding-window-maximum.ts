import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { fmt, queueSnapshot, slot } from "./sequence-common";

export const ID = "sliding-window-maximum";
export interface SwmInput { readonly values: readonly number[]; readonly k: number }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<SwmInput> {
  return parseArrayWithFields(raw, limits, {
    noun: "array", minLength: 1, minLengthMessage: "Enter at least one value.",
    fields: [{ name: "k", label: "Window size (k)", min: () => 1, max: (v) => Math.max(1, v.length), rangeMessage: (v) => `Window size must be between 1 and ${Math.max(1, v.length)}.` }],
  }) as InputResult<SwmInput>;
}

export function run(input: SwmInput, limits: LimitProfile): ExecutionTrace {
  const { values, k } = input;
  const n = values.length;
  const dq: number[] = []; // indices; values[dq[0]] is the window maximum
  const result: number[] = [];
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "queue", input: { values: [...values], k }, maxSteps: limits.maxSteps });
  const items = () => dq.map((i) => values[i]!);
  const snap = () => queueSnapshot(items());
  const front = () => (dq.length > 0 ? [slot(0, "active", "max")] : []);
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Find the maximum of every window of ${k} in ${fmt(values)}. The queue keeps candidate values in decreasing order, so the front is always the window maximum.`,
    variables: { k }, state: snap(),
  });
  for (let i = 0; i < n; i++) {
    b.step({
      event: { type: "init" }, anchor: "loop", explanation: `Move the window's right edge to position ${i}, value ${values[i]}.`,
      variables: { i, value: values[i]!, size: dq.length }, state: snap(), highlights: front(),
    });
    while (dq.length > 0 && values[dq[dq.length - 1]!]! <= values[i]!) {
      const gone = values[dq[dq.length - 1]!]!;
      dq.pop();
      b.step({
        event: { type: "dequeue", element: indexRef(dq.length) }, anchor: "pop-back",
        explanation: `${gone} at the back is not larger than ${values[i]}, so it can never be a maximum again. Remove it.`,
        variables: { i, value: values[i]!, size: dq.length }, state: snap(), highlights: front(), motion: "disappear",
      });
    }
    dq.push(i);
    b.step({
      event: { type: "enqueue", element: indexRef(dq.length - 1) }, anchor: "push-back",
      explanation: `Add ${values[i]} at the back. The queue is now ${fmt(items())}, front on the left.`,
      variables: { i, value: values[i]!, size: dq.length }, state: snap(),
      changed: [indexRef(dq.length - 1)], highlights: [slot(dq.length - 1, "created", "new"), ...(dq.length > 1 ? [slot(0, "active", "max")] : [])], motion: "appear",
    });
    if (dq[0]! <= i - k) {
      const gone = values[dq[0]!]!;
      dq.shift();
      b.step({
        event: { type: "dequeue", element: indexRef(0) }, anchor: "pop-front",
        explanation: `The front value ${gone} has slid out of the window, so remove it.`,
        variables: { i, size: dq.length }, state: snap(), highlights: front(), motion: "disappear",
      });
    }
    if (i >= k - 1) {
      result.push(values[dq[0]!]!);
      b.step({
        event: { type: "peek", element: indexRef(0) }, anchor: "record",
        explanation: `The window ending at ${i} is complete. Its maximum is the front value ${values[dq[0]!]}. Results so far: ${fmt(result)}.`,
        variables: { i, max: values[dq[0]!]!, size: dq.length }, state: snap(), highlights: [slot(0, "found", "max")],
      });
    }
  }
  b.step({
    event: { type: "done" }, anchor: "finish", explanation: `Done. The window maxima are ${fmt(result)}.`,
    variables: { size: dq.length }, state: snap(),
  });
  return b.build({ time: "O(n)", space: "O(k)", result });
}

export const slidingWindowMaximum: AlgorithmDefinition<SwmInput> = { id: ID, parseInput, run };
