import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { LimitProfile } from "../limits";
import { TraceBuilder, type Scalar } from "../trace-builder";
import { slot, stackSnapshot } from "./sequence-common";

/**
 * Draws a recursive function as a call stack: each active call is one stack item holding its
 * main argument. A call pushes, the base-case/recursion checks peek the top, and a return pops.
 */
export class CallTracer {
  readonly frames: number[] = [];
  private readonly b: TraceBuilder<"stack">;
  constructor(id: string, input: Record<string, unknown>, limits: LimitProfile) {
    this.b = new TraceBuilder({ algorithmId: id, stateKind: "stack", input, maxSteps: limits.maxSteps });
  }
  enter(arg: number, anchor: string, explanation: string, vars: Record<string, Scalar>): void {
    this.frames.push(arg);
    this.b.step({
      event: { type: "push", element: indexRef(this.frames.length - 1) }, anchor, explanation,
      variables: { ...vars, depth: this.frames.length }, state: stackSnapshot(this.frames),
      changed: [indexRef(this.frames.length - 1)], highlights: [slot(this.frames.length - 1, "created", "current call")], motion: "appear",
    });
  }
  note(anchor: string, explanation: string, vars: Record<string, Scalar>): void {
    this.b.step({
      event: { type: "peek", element: indexRef(this.frames.length - 1) }, anchor, explanation,
      variables: { ...vars, depth: this.frames.length }, state: stackSnapshot(this.frames),
      highlights: [slot(this.frames.length - 1, "active", "current call")],
    });
  }
  leave(anchor: string, explanation: string, vars: Record<string, Scalar>): void {
    this.frames.pop();
    this.b.step({
      event: { type: "pop", element: indexRef(this.frames.length) }, anchor, explanation,
      variables: { ...vars, depth: this.frames.length }, state: stackSnapshot(this.frames),
      highlights: this.frames.length > 0 ? [slot(this.frames.length - 1, "pointer", "resumes")] : [], motion: "disappear",
    });
  }
  /** Final step: the outermost call has returned. */
  finish(anchor: string, explanation: string, result: number, vars: Record<string, Scalar>, time: string, space: string): ExecutionTrace {
    this.b.step({ event: { type: "done" }, anchor, explanation, variables: { ...vars, depth: 0 }, state: stackSnapshot(this.frames) });
    return this.b.build({ time, space, result });
  }
}
