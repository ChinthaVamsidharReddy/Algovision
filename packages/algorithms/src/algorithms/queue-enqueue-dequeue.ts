import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { fmt, parseSequenceInput, queueSnapshot, slot } from "./sequence-common";

export const ID = "queue-enqueue-dequeue";

export interface QueueInput {
  readonly values: readonly number[];
  readonly removes: number;
}

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<QueueInput> {
  return parseSequenceInput(raw, limits, "removes") as InputResult<QueueInput>;
}

export function run(input: QueueInput, limits: LimitProfile): ExecutionTrace {
  const { values, removes } = input;
  // The code keeps every value in one array and moves `front` forward; the picture shows only the
  // items still waiting, i.e. storage[front..rear).
  const items: number[] = [];
  let front = 0;
  let rear = 0;
  const builder = new TraceBuilder({
    algorithmId: ID,
    stateKind: "queue",
    input: { values: [...values], removes },
    maxSteps: limits.maxSteps,
  });

  builder.step({
    event: { type: "init" },
    anchor: "entry",
    explanation: `Start with an empty queue. Enqueue ${fmt(values)} one by one, then dequeue ${removes} time${removes === 1 ? "" : "s"}. A queue is first in, first out: items leave from the front in the order they arrived.`,
    variables: { front: 0, rear: 0 },
    state: queueSnapshot(items),
  });

  for (const v of values) {
    items.push(v);
    rear++;
    builder.step({
      event: { type: "enqueue", element: indexRef(items.length - 1) },
      anchor: "enqueue",
      explanation: `Enqueue ${v} at the rear. The queue is now ${fmt(items)}, front on the left.`,
      variables: { front, rear, enqueued: v },
      state: queueSnapshot(items),
      changed: [indexRef(items.length - 1)],
      highlights: [slot(items.length - 1, "created", "rear")],
      motion: "appear",
    });
  }

  for (let k = 0; k < removes; k++) {
    if (front === rear) {
      builder.step({
        event: { type: "underflow" },
        anchor: "underflow",
        explanation: "The queue is empty (front has caught up with rear), so there is nothing to dequeue. Stop here.",
        variables: { front, rear },
        state: queueSnapshot(items),
      });
      break;
    }
    builder.step({
      event: { type: "peek", element: indexRef(0) },
      anchor: "check-empty",
      explanation: `The queue is not empty (front ${front}, rear ${rear}), so we can dequeue. The front item is ${items[0]}.`,
      variables: { front, rear },
      state: queueSnapshot(items),
      highlights: [slot(0, "active", "front")],
    });
    const removed = items.shift()!;
    front++;
    builder.step({
      event: { type: "dequeue", element: indexRef(0) },
      anchor: "dequeue",
      explanation: `Dequeue ${removed} from the front by moving front forward. The queue is now ${fmt(items)}.`,
      variables: { front, rear, dequeued: removed },
      state: queueSnapshot(items),
      highlights: items.length > 0 ? [slot(0, "pointer", "front")] : [],
      motion: "disappear",
    });
  }

  builder.step({
    event: { type: "done" },
    anchor: "finish",
    explanation: `Done. The queue holds ${fmt(items)}, listed from front to rear.`,
    variables: { front, rear },
    state: queueSnapshot(items),
  });
  return builder.build({ time: "O(n)", space: "O(n)", result: [...items] });
}

export const queueEnqueueDequeue: AlgorithmDefinition<QueueInput> = { id: ID, parseInput, run };
