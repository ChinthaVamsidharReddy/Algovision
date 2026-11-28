import type { ExecutionStep } from "@algovision/trace-schema";
import type { PileTrace } from "@/lib/stories/types";
import type { Actor3D, Prop3D, Scene3D } from "./types";

export interface QueuePerson {
  id: number;
  value: number;
}
export interface QueueCast {
  /** The line, front first. */
  line: QueuePerson[];
  /** The person who joined the back at this step. */
  arriving: QueuePerson | null;
  /** The person served (and gone) at this step. */
  leaving: QueuePerson | null;
}

/** Replays the trace up to a step so that every person keeps one identity: arrivals join the back, the served one leaves from the front. */
export function queueCast(trace: PileTrace, upTo: number): QueueCast {
  const line: QueuePerson[] = [];
  let nextId = 1;
  let arriving: QueuePerson | null = null;
  let leaving: QueuePerson | null = null;
  let prev = 0;
  for (const s of trace.steps) {
    if (s.index > upTo) break;
    const items = s.state.items;
    arriving = null;
    leaving = null;
    if (items.length === prev + 1) {
      arriving = { id: nextId++, value: items[items.length - 1] ?? 0 };
      line.push(arriving);
    } else if (items.length === prev - 1) {
      leaving = line.shift() ?? null;
    }
    prev = items.length;
  }
  return { line, arriving, leaving };
}

/** Distance between neighbours in the line. */
export const SPACING = 1.1;
const SHIRTS = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xf97316];

/** The ticket counter scene for a queue: people stand in a line facing the counter; the front one is served. */
export function describeQueue(step: ExecutionStep<"stack" | "queue">, trace: PileTrace): Scene3D {
  const cast = queueCast(trace, step.index);
  const slots = Math.max(3, ...trace.steps.map((s) => s.state.items.length));
  const spawn = { x: slots * SPACING + 3, z: 0 };
  const actors: Actor3D[] = [];
  cast.line.forEach((p, i) => {
    actors.push({
      id: `p${p.id}`,
      kind: "person",
      x: i * SPACING,
      z: 0,
      from: spawn,
      face: -Math.PI / 2,
      color: SHIRTS[(p.id - 1) % SHIRTS.length]!,
      label: String(p.value),
    });
  });
  if (cast.leaving) {
    actors.push({ id: `p${cast.leaving.id}`, kind: "person", x: -3.4, z: 4.6, face: -Math.PI / 2, color: SHIRTS[(cast.leaving.id - 1) % SHIRTS.length]!, label: String(cast.leaving.value), holds: "ticket", exit: true });
  }
  actors.push({ id: "clerk", kind: "clerk", x: -2.2, z: 0, face: Math.PI / 2, color: 0x334155, pose: cast.leaving || (cast.line.length > 0 && step.source.kind === "anchor" && step.source.id === "check-empty") ? "serve" : "idle", holds: cast.leaving ? "ticket" : undefined });
  const props: Prop3D[] = [{ id: "counter", kind: "counter", x: -1.2, z: 0, sign: "TICKETS" }];
  for (let i = 0; i < slots; i++) props.push({ id: `spot${i}`, kind: "spot", x: i * SPACING, z: 0 });
  return { minX: -3.2, maxX: (slots - 1) * SPACING + 0.8, actors, props };
}
