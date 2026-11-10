import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder, type Scalar } from "../trace-builder";
import { parseChecked } from "./array-trace";
import { fmt, slot, stackSnapshot } from "./sequence-common";

interface Values { readonly values: readonly number[] }

/** Stack walk-through where the stack holds positions (indexes) of the input. */
class IndexStack {
  readonly items: number[] = [];
  private readonly b: TraceBuilder<"stack">;
  constructor(id: string, values: readonly number[], limits: LimitProfile) {
    this.b = new TraceBuilder({ algorithmId: id, stateKind: "stack", input: { values: [...values] }, maxSteps: limits.maxSteps });
  }
  step(type: "init" | "push" | "pop" | "peek" | "done", anchor: string, explanation: string, variables: Record<string, Scalar>, role?: "active" | "found" | "compared" | "created"): void {
    const top = this.items.length - 1;
    const event =
      type === "push" ? ({ type, element: indexRef(top) } as const)
      : type === "pop" ? ({ type, element: indexRef(this.items.length) } as const)
      : type === "peek" ? ({ type, element: indexRef(top) } as const)
      : ({ type } as const);
    this.b.step({
      event, anchor, explanation, variables: { size: this.items.length, ...variables }, state: stackSnapshot(this.items),
      highlights: this.items.length > 0 && role ? [slot(top, role, "top")] : [],
      ...(type === "push" ? { changed: [indexRef(top)], motion: "appear" as const } : type === "pop" ? { motion: "disappear" as const } : {}),
    });
  }
  finish(result: unknown, time: string, space: string): ExecutionTrace { return this.b.build({ time, space, result }); }
}

// ---------------------------------------------------------------- stock span
export const SPAN_ID = "stock-span";
export function parseSpan(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one price.", valueMin: 0, valueMax: 999, valueMessage: "Each price must be a whole number from 0 to 999.", noun: "price list" }, () => []);
}
export function runSpan({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const S = new IndexStack(SPAN_ID, values, limits);
  const span: number[] = [];
  S.step("init", "entry", `For each day in ${fmt(values)}, count the consecutive days up to and including it whose price is not higher than its price. The stack keeps the days that are still higher than everything after them, so a pop means "this day is covered by today".`, {});
  for (let i = 0; i < values.length; i++) {
    S.step("init", "loop", `Day ${i} has price ${values[i]}.`, { i, price: values[i]! }, S.items.length ? "active" : undefined);
    for (;;) {
      const top = S.items[S.items.length - 1];
      const covered = top !== undefined && values[top]! <= values[i]!;
      S.step(top === undefined ? "init" : "peek", "while-check", top === undefined ? "The stack is empty: no earlier day is higher." : covered ? `Day ${top} (price ${values[top]}) is not higher than ${values[i]}, so today covers it.` : `Day ${top} (price ${values[top]}) is higher than ${values[i]}, so the span stops there.`, { i, price: values[i]! }, covered ? "found" : "compared");
      if (!covered) break;
      S.items.pop();
      S.step("pop", "pop", `Pop day ${top}.`, { i, price: values[i]! }, "active");
    }
    const prev = S.items[S.items.length - 1];
    const s = prev === undefined ? i + 1 : i - prev;
    span.push(s);
    S.step("init", "compute", prev === undefined ? `Nothing earlier is higher, so the span is all ${i + 1} day${i === 0 ? "" : "s"}. Spans: ${fmt(span)}.` : `The nearest higher day is ${prev}, so the span is ${i} - ${prev} = ${s}. Spans: ${fmt(span)}.`, { i, span: s }, S.items.length ? "active" : undefined);
    S.items.push(i);
    S.step("push", "push", `Push day ${i}: it is the nearest higher day for later prices.`, { i }, "created");
  }
  S.step("done", "finish", `The spans are ${fmt(span)}.`, {});
  return S.finish(span, "O(n)", "O(n)");
}
export const stockSpan: AlgorithmDefinition<Values> = { id: SPAN_ID, parseInput: parseSpan, run: runSpan };

// ---------------------------------------------------------------- largest rectangle in a histogram
export const HIST_ID = "largest-rectangle-histogram";
export function parseHist(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one bar height.", valueMin: 0, valueMax: 99, valueMessage: "Each height must be a whole number from 0 to 99.", noun: "height list" }, () => []);
}
export function runHist({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const n = values.length;
  const S = new IndexStack(HIST_ID, values, limits);
  let best = 0;
  S.step("init", "entry", `Find the largest rectangle that fits under the bars ${fmt(values)}. The stack keeps bars in increasing height; a shorter bar ends the rectangles of the taller bars before it.`, { best });
  for (let i = 0; i <= n; i++) {
    const h = i === n ? 0 : values[i]!;
    S.step("init", "loop", i === n ? "Past the last bar. Use a height of 0 so every remaining bar gets closed." : `Bar ${i} has height ${h}.`, { i, h, best }, S.items.length ? "active" : undefined);
    for (;;) {
      const top = S.items[S.items.length - 1];
      const closes = top !== undefined && values[top]! > h;
      S.step(top === undefined ? "init" : "peek", "while-check", top === undefined ? "The stack is empty." : closes ? `Bar ${top} (height ${values[top]}) is taller than ${h}, so its rectangle ends here.` : `Bar ${top} (height ${values[top]}) is not taller than ${h}, so nothing ends.`, { i, h, best }, closes ? "found" : "compared");
      if (!closes) break;
      const t = S.items.pop()!;
      const prev = S.items[S.items.length - 1];
      const width = prev === undefined ? i : i - prev - 1;
      const area = values[t]! * width;
      const better = area > best;
      if (better) best = area;
      S.step("pop", "pop-area", `Pop bar ${t}. Its rectangle is ${values[t]} tall and ${width} wide, area ${area}${better ? ", a new best" : ""}.`, { i, h, area, best }, "active");
    }
    S.items.push(i);
    S.step("push", "push", i === n ? "Push the end marker." : `Push bar ${i}.`, { i, best }, "created");
  }
  S.step("done", "finish", `The largest rectangle has area ${best}.`, { best });
  return S.finish(best, "O(n)", "O(n)");
}
export const largestRectangleHistogram: AlgorithmDefinition<Values> = { id: HIST_ID, parseInput: parseHist, run: runHist };
