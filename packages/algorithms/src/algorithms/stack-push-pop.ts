import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { fmt, parseSequenceInput, slot, stackSnapshot } from "./sequence-common";

export const ID = "stack-push-pop";

export interface StackInput {
  readonly values: readonly number[];
  readonly pops: number;
}

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<StackInput> {
  return parseSequenceInput(raw, limits, "pops") as InputResult<StackInput>;
}

export function run(input: StackInput, limits: LimitProfile): ExecutionTrace {
  const { values, pops } = input;
  const stack: number[] = [];
  const builder = new TraceBuilder({
    algorithmId: ID,
    stateKind: "stack",
    input: { values: [...values], pops },
    maxSteps: limits.maxSteps,
  });
  const top = () => slot(stack.length - 1, "active", "top");

  builder.step({
    event: { type: "init" },
    anchor: "entry",
    explanation: `Start with an empty stack. Push ${fmt(values)} one by one, then pop ${pops} time${pops === 1 ? "" : "s"}. A stack is last in, first out: only the top can be touched.`,
    variables: { size: 0 },
    state: stackSnapshot(stack),
  });

  for (const v of values) {
    stack.push(v);
    builder.step({
      event: { type: "push", element: indexRef(stack.length - 1) },
      anchor: "push",
      explanation: `Push ${v}. It lands on top, so the stack is now ${fmt(stack)}.`,
      variables: { size: stack.length, pushed: v },
      state: stackSnapshot(stack),
      changed: [indexRef(stack.length - 1)],
      highlights: [slot(stack.length - 1, "created", "top")],
      motion: "appear",
    });
  }

  for (let k = 0; k < pops; k++) {
    if (stack.length === 0) {
      builder.step({
        event: { type: "underflow" },
        anchor: "underflow",
        explanation: "The stack is empty, so there is nothing to pop. Popping an empty stack is an underflow; stop here.",
        variables: { size: 0 },
        state: stackSnapshot(stack),
      });
      break;
    }
    builder.step({
      event: { type: "peek", element: indexRef(stack.length - 1) },
      anchor: "check-empty",
      explanation: `The stack is not empty (size ${stack.length}), so we can pop. The top item is ${stack[stack.length - 1]}.`,
      variables: { size: stack.length },
      state: stackSnapshot(stack),
      highlights: [top()],
    });
    const popped = stack.pop()!;
    builder.step({
      event: { type: "pop", element: indexRef(stack.length) },
      anchor: "pop",
      explanation: `Pop ${popped} from the top. The stack is now ${fmt(stack)}.`,
      variables: { size: stack.length, popped },
      state: stackSnapshot(stack),
      highlights: stack.length > 0 ? [slot(stack.length - 1, "pointer", "top")] : [],
      motion: "disappear",
    });
  }

  builder.step({
    event: { type: "done" },
    anchor: "finish",
    explanation: `Done. The stack holds ${fmt(stack)}; the rightmost value is the top.`,
    variables: { size: stack.length },
    state: stackSnapshot(stack),
  });
  return builder.build({ time: "O(n)", space: "O(n)", result: [...stack] });
}

export const stackPushPop: AlgorithmDefinition<StackInput> = { id: ID, parseInput, run };
