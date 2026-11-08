import type { ExecutionTrace } from "@algovision/trace-schema";
import { indexRef } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { slot, stackSnapshot } from "./sequence-common";

export const ID = "valid-parentheses";
/** 1 "(" 2 ")" 3 "[" 4 "]" 5 "{" 6 "}". Odd codes open a bracket; the closer is the next code. */
export const SYMBOLS = ["", "(", ")", "[", "]", "{", "}"] as const;
export interface ParenInput { readonly values: readonly number[] }
const sym = (c: number): string => SYMBOLS[c] ?? "?";
const show = (items: readonly number[]): string => (items.length === 0 ? "empty" : items.map(sym).join(" "));

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<ParenInput> {
  return parseArrayWithFields(raw, limits, {
    noun: "bracket string", valueMin: 1, valueMax: 6,
    valueMessage: "Use codes 1 to 6: 1 = (  2 = )  3 = [  4 = ]  5 = {  6 = }.",
  }) as InputResult<ParenInput>;
}

export function run(input: ParenInput, limits: LimitProfile): ExecutionTrace {
  const { values } = input;
  const stack: number[] = [];
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "stack", input: { values: [...values] }, maxSteps: limits.maxSteps });
  const top = () => slot(stack.length - 1, "active", "top");
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Check whether the brackets ${values.map(sym).join(" ") || "(none)"} are balanced. Keep a stack of openers that are still waiting for their closer.`,
    variables: { size: 0 }, state: stackSnapshot(stack),
  });
  const fail = (anchor: string, event: "underflow" | "peek", text: string, i: number): ExecutionTrace => {
    b.step({
      event: event === "underflow" ? { type: "underflow" } : { type: "peek", element: indexRef(stack.length - 1) },
      anchor, explanation: text, variables: { i, size: stack.length, balanced: 0 }, state: stackSnapshot(stack),
      highlights: stack.length > 0 ? [top()] : [],
    });
    return b.build({ time: "O(n)", space: "O(n)", result: 0 });
  };
  for (let i = 0; i < values.length; i++) {
    const c = values[i]!;
    b.step({
      event: { type: "init" }, anchor: "loop",
      explanation: `Read bracket ${i + 1} of ${values.length}: ${sym(c)}.`,
      variables: { i, c, size: stack.length }, state: stackSnapshot(stack), highlights: stack.length > 0 ? [top()] : [],
    });
    const opener = c % 2 === 1;
    if (opener) {
      b.step({
        event: { type: "init" }, anchor: "check-open",
        explanation: `${sym(c)} is an opening bracket, so it must wait for its closer.`,
        variables: { i, c, size: stack.length }, state: stackSnapshot(stack),
      });
      stack.push(c);
      b.step({
        event: { type: "push", element: indexRef(stack.length - 1) }, anchor: "push",
        explanation: `Push ${sym(c)}. The stack is now ${show(stack)} (top on the right).`,
        variables: { i, c, size: stack.length }, state: stackSnapshot(stack),
        changed: [indexRef(stack.length - 1)], highlights: [slot(stack.length - 1, "created", "top")], motion: "appear",
      });
      continue;
    }
    b.step({
      event: { type: "init" }, anchor: "check-open",
      explanation: `${sym(c)} is a closing bracket, so it must match the most recent opener.`,
      variables: { i, c, size: stack.length }, state: stackSnapshot(stack),
    });
    if (stack.length === 0) {
      return fail("check-empty", "underflow", `The stack is empty, so ${sym(c)} has no opener to match. The brackets are not balanced.`, i);
    }
    b.step({
      event: { type: "peek", element: indexRef(stack.length - 1) }, anchor: "check-empty",
      explanation: `The stack is not empty. The top is ${sym(stack[stack.length - 1]!)}.`,
      variables: { i, c, size: stack.length }, state: stackSnapshot(stack), highlights: [top()],
    });
    const open = stack[stack.length - 1]!;
    if (open !== c - 1) {
      return fail("check-match", "peek", `${sym(open)} on top does not pair with ${sym(c)}. The brackets are not balanced.`, i);
    }
    b.step({
      event: { type: "peek", element: indexRef(stack.length - 1) }, anchor: "check-match",
      explanation: `${sym(open)} and ${sym(c)} are a matching pair.`,
      variables: { i, c, size: stack.length }, state: stackSnapshot(stack), highlights: [slot(stack.length - 1, "found", "match")],
    });
    stack.pop();
    b.step({
      event: { type: "pop", element: indexRef(stack.length) }, anchor: "pop",
      explanation: `Pop ${sym(open)}. The stack is now ${show(stack)}.`,
      variables: { i, c, size: stack.length }, state: stackSnapshot(stack),
      highlights: stack.length > 0 ? [top()] : [], motion: "disappear",
    });
  }
  const ok = stack.length === 0;
  b.step({
    event: { type: "done" }, anchor: "finish",
    explanation: ok ? "All brackets were matched and the stack is empty, so the string is balanced." : `Brackets remain on the stack (${show(stack)}) with no closer, so the string is not balanced.`,
    variables: { size: stack.length, balanced: ok ? 1 : 0 }, state: stackSnapshot(stack),
  });
  return b.build({ time: "O(n)", space: "O(n)", result: ok ? 1 : 0 });
}

export const validParentheses: AlgorithmDefinition<ParenInput> = { id: ID, parseInput, run };
