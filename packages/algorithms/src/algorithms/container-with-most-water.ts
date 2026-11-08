import { indexRef, type ExecutionTrace, type Highlight } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { cell, fmt, ptr, snapshot } from "./array-common";
import { parseArrayWithFields } from "./array-input";

export const ID = "container-with-most-water";
export interface ContainerInput { readonly values: readonly number[] }

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<ContainerInput> {
  return parseArrayWithFields(raw, limits, { valueMin: 0, valueMessage: "Each height must be a whole number from 0 up to 999." }) as InputResult<ContainerInput>;
}

export function run(input: ContainerInput, limits: LimitProfile): ExecutionTrace {
  const h = input.values;
  const n = h.length;
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "array", input: { values: [...h] }, maxSteps: limits.maxSteps });
  let left = 0;
  let right = n - 1;
  let best = 0;
  const ptrs = () => ({ left: ptr(left, n), right: ptr(right, n) });
  const span = (extra: Highlight[] = []): Highlight[] => [...h.map((_, k) => cell(k, k >= left && k <= right ? "window" : "visited")), ...extra];

  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `The values in ${fmt(h)} are heights of vertical lines. Find two lines that, with the x-axis, hold the most water: area = shorter height × distance apart.`,
    variables: {}, state: snapshot(h, {}),
  });
  b.step({
    event: { type: "init" }, anchor: "init",
    explanation: "Start with the widest container: left at the first line, right at the last, best area 0.",
    variables: { left, right, best }, state: snapshot(h, ptrs()), highlights: span(),
  });
  while (left < right) {
    b.step({
      event: { type: "compare", a: indexRef(left), b: indexRef(right) }, anchor: "loop",
      explanation: `left (${left}) < right (${right}), so there is still a container to measure.`,
      variables: { left, right, best }, state: snapshot(h, ptrs()), highlights: span([cell(left, "active", "left"), cell(right, "active", "right")]),
    });
    const height = Math.min(h[left]!, h[right]!);
    b.step({
      event: { type: "compare", a: indexRef(left), b: indexRef(right) }, anchor: "measure",
      explanation: `The water level is limited by the shorter line: min(${h[left]}, ${h[right]}) = ${height}.`,
      variables: { left, right, height }, state: snapshot(h, ptrs()), highlights: span([cell(left, "compared"), cell(right, "compared")]),
    });
    const area = height * (right - left);
    b.step({
      event: { type: "assign", target: indexRef(left), value: area }, anchor: "area",
      explanation: `Area = ${height} × (${right} - ${left}) = ${area}.`,
      variables: { left, right, height, area, best }, state: snapshot(h, ptrs()), highlights: span([cell(left, "compared"), cell(right, "compared")]),
    });
    const better = area > best;
    if (better) best = area;
    b.step({
      event: { type: "compare", a: indexRef(left), b: indexRef(right) }, anchor: "update-best",
      explanation: better ? `${area} is bigger than the previous best, so best = ${best}.` : `${area} does not beat the best, ${best}.`,
      variables: { left, right, area, best }, state: snapshot(h, ptrs()), highlights: span(better ? [cell(left, "found"), cell(right, "found")] : []),
    });
    if (h[left]! < h[right]!) {
      left++;
      b.step({
        event: { type: "movePointer", pointer: "left", to: indexRef(Math.min(left, n - 1)) }, anchor: "move-left",
        explanation: `The left line is shorter, so no container using it can be taller. Move left to ${left}.`,
        variables: { left, right, best }, state: snapshot(h, ptrs()), highlights: span(),
      });
    } else {
      right--;
      b.step({
        event: { type: "movePointer", pointer: "right", to: indexRef(Math.max(right, 0)) }, anchor: "move-right",
        explanation: `The right line is not taller, so move right to ${right}.`,
        variables: { left, right, best }, state: snapshot(h, ptrs()), highlights: span(),
      });
    }
  }
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: `The pointers met. The largest container holds ${best}.`,
    variables: { best }, state: snapshot(h, {}), highlights: h.map((_, k) => cell(k, "visited")),
  });
  return b.build({ time: "O(n)", space: "O(1)", result: best });
}

export const containerWithMostWater: AlgorithmDefinition<ContainerInput> = { id: ID, parseInput, run };
