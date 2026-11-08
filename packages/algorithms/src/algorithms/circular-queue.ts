import type { ExecutionTrace } from "@algovision/trace-schema";
import { indexRef } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { cell, fmt, snapshot } from "./array-common";

export const ID = "circular-queue";
export interface CircularInput { readonly values: readonly number[]; readonly capacity: number }

/** values: each non-zero number is enqueued, each 0 is a dequeue. Empty slots show as 0. */
export function parseInput(raw: unknown, limits: LimitProfile): InputResult<CircularInput> {
  return parseArrayWithFields(raw, limits, {
    noun: "operation list",
    fields: [{ name: "capacity", label: "Capacity", min: () => 1, max: (_v, l) => l.maxArrayLength, rangeMessage: (_v, l) => `Capacity must be between 1 and ${l.maxArrayLength}.` }],
  }) as InputResult<CircularInput>;
}

export function run(input: CircularInput, limits: LimitProfile): ExecutionTrace {
  const { values: ops, capacity } = input;
  const data: number[] = new Array<number>(capacity).fill(0);
  let front = 0;
  let size = 0;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...ops], capacity }, maxSteps: limits.maxSteps });
  const snap = () => snapshot(data, { front, rear: (front + size) % capacity });
  const contents = (): number[] => Array.from({ length: size }, (_, i) => data[(front + i) % capacity]!);
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `A circular queue with room for ${capacity} item${capacity === 1 ? "" : "s"}. A non-zero operation enqueues that value; a 0 dequeues. Empty slots show as 0. Positions wrap around the end of the array.`,
    variables: { capacity }, state: snap(),
  });
  b.step({
    event: { type: "init" }, anchor: "init",
    explanation: "front is where the next dequeue reads, and size counts the stored items. Both start at 0.", variables: { front, size, capacity }, state: snap(),
  });
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]!;
    b.step({
      event: { type: "init" }, anchor: "loop", explanation: `Operation ${i + 1}: ${op === 0 ? "dequeue" : `enqueue ${op}`}.`,
      variables: { i, op, front, size }, state: snap(),
    });
    b.step({
      event: { type: "init" }, anchor: "check-op", explanation: op !== 0 ? `${op} is not 0, so this is an enqueue.` : "0 means dequeue.",
      variables: { i, op, front, size }, state: snap(),
    });
    if (op !== 0) {
      if (size === capacity) {
        b.step({
          event: { type: "overflow" }, anchor: "overflow", explanation: `The queue already holds ${capacity} items, so ${op} is rejected (overflow).`,
          variables: { i, op, front, size }, state: snap(), highlights: contents().map((_, k) => cell((front + k) % capacity, "visited")),
        });
        continue;
      }
      const at = (front + size) % capacity;
      data[at] = op;
      size++;
      b.step({
        event: { type: "assign", target: indexRef(at), value: op }, anchor: "enqueue",
        explanation: `Store ${op} at index (front + size) % capacity = ${at}, then grow size to ${size}.`,
        variables: { i, op, front, size, at }, state: snap(), changed: [indexRef(at)], highlights: [cell(at, "created", "new")], motion: "appear",
      });
    } else {
      if (size === 0) {
        b.step({
          event: { type: "underflow" }, anchor: "underflow", explanation: "The queue is empty, so there is nothing to dequeue (underflow).",
          variables: { i, op, front, size }, state: snap(),
        });
        continue;
      }
      const gone = data[front]!;
      const was = front;
      data[front] = 0;
      front = (front + 1) % capacity;
      size--;
      b.step({
        event: { type: "assign", target: indexRef(was), value: 0 }, anchor: "dequeue",
        explanation: `Dequeue ${gone} from index ${was}, clear its slot, and move front to ${front} (wrapping at the end). Size is now ${size}.`,
        variables: { i, op, front, size, removed: gone }, state: snap(), changed: [indexRef(was)], highlights: [cell(was, "swapped", "removed")], motion: "disappear",
      });
    }
  }
  const out = contents();
  b.step({
    event: { type: "done" }, anchor: "finish", explanation: `Done. The queue holds ${fmt(out)} from front to rear.`,
    variables: { front, size }, state: snap(), highlights: out.map((_, k) => cell((front + k) % capacity, "found")),
  });
  return b.build({ time: "O(n)", space: "O(capacity)", result: out });
}

export const circularQueue: AlgorithmDefinition<CircularInput> = { id: ID, parseInput, run };
