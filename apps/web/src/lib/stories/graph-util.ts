import type { ExecutionStep } from "@algovision/trace-schema";
import type { Tone } from "./types";

type Step = ExecutionStep<"graph">;

/** The number shown inside a vertex. */
export const num = (step: Step, id: string | null | undefined): number | undefined => (id ? step.state.nodes.find((n) => n.id === id)?.value : undefined);
export const nums = (step: Step, ids: readonly string[]): string => ids.map((id) => num(step, id)).join(", ");

/** Colours shared by the graph stories: finished vertices green, waiting ones amber, the one being handled highlighted. */
export function graphTones(step: Step, done: readonly string[]): Record<string, Tone> {
  const tones: Record<string, Tone> = {};
  for (const id of step.state.frontier) tones[id] = "warn";
  for (const id of done) tones[id] = "good";
  if (step.state.current) tones[step.state.current] = "hit";
  return tones;
}
/** Vertices that have been taken out of the work list (a dequeue or select anchor happened at them) up to this step. */
export function takenOut(trace: { steps: readonly Step[] }, step: Step, anchors: readonly string[]): string[] {
  const out: string[] = [];
  for (const s of trace.steps) {
    if (s.index > step.index) break;
    if (s.source.kind === "anchor" && anchors.includes(s.source.id) && s.state.current && !out.includes(s.state.current)) out.push(s.state.current);
  }
  return out;
}
export const listOut = (xs: readonly number[]): string => (xs.length ? xs.join(", ") : "nobody yet");
