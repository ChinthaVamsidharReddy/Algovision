import { indexRef, type ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { TraceBuilder } from "../trace-builder";
import { parseArrayWithFields } from "./array-input";
import { slot, stackSnapshot } from "./sequence-common";

export const ID = "evaluate-postfix";
/** Operands are 0..99. Operators: -1 "+", -2 "-", -3 "*", -4 "/" (integer division toward zero). */
export const OPS = ["", "+", "-", "*", "/"] as const;
export const MAX_RESULT = 1_000_000;
export interface PostfixInput { readonly values: readonly number[] }
const token = (t: number): string => (t >= 0 ? String(t) : OPS[-t]!);

export function apply(op: number, a: number, b: number): number {
  return (op === -1 ? a + b : op === -2 ? a - b : op === -3 ? a * b : Math.trunc(a / b)) + 0; // + 0 turns -0 into 0
}

/** Reports the first problem in a postfix expression, or null when it is valid. */
function problem(values: readonly number[]): string | null {
  const st: number[] = [];
  for (const t of values) {
    if (t >= 0) { st.push(t); continue; }
    if (st.length < 2) return `The operator ${token(t)} needs two numbers before it.`;
    const r = st.pop()!, l = st.pop()!;
    if (t === -4 && r === 0) return "The expression divides by zero.";
    const v = apply(t, l, r);
    if (Math.abs(v) > MAX_RESULT) return `An intermediate result is larger than ${MAX_RESULT}.`;
    st.push(v);
  }
  return st.length === 1 ? null : st.length === 0 ? "Enter at least one number." : "The expression has too many numbers: operators are missing.";
}

export function parseInput(raw: unknown, limits: LimitProfile): InputResult<PostfixInput> {
  const p = parseArrayWithFields(raw, limits, {
    noun: "expression", valueMin: -4, valueMax: 99,
    valueMessage: "Use 0 to 99 for numbers and -1 + , -2 - , -3 * , -4 / for operators.",
  }) as InputResult<PostfixInput>;
  if (!p.ok) return p;
  const msg = problem(p.value.values);
  if (msg) return { ok: false, errors: [{ field: "values", message: msg } satisfies FieldError] };
  return p;
}

export function run(input: PostfixInput, limits: LimitProfile): ExecutionTrace {
  const { values } = input;
  const stack: number[] = [];
  const b = new TraceBuilder({ algorithmId: ID, stateKind: "stack", input: { values: [...values] }, maxSteps: limits.maxSteps });
  const top = () => slot(stack.length - 1, "active", "top");
  b.step({
    event: { type: "init" }, anchor: "entry",
    explanation: `Evaluate the postfix expression ${values.map(token).join(" ")}. Numbers go on the stack; an operator uses the top two numbers.`,
    variables: { size: 0 }, state: stackSnapshot(stack),
  });
  for (let i = 0; i < values.length; i++) {
    const t = values[i]!;
    b.step({
      event: { type: "init" }, anchor: "loop", explanation: `Read token ${i + 1}: ${token(t)}.`,
      variables: { i, token: token(t), size: stack.length }, state: stackSnapshot(stack), highlights: stack.length > 0 ? [top()] : [],
    });
    if (t >= 0) {
      b.step({
        event: { type: "init" }, anchor: "check-operand", explanation: `${t} is a number, so it goes on the stack.`,
        variables: { i, token: t, size: stack.length }, state: stackSnapshot(stack),
      });
      stack.push(t);
      b.step({
        event: { type: "push", element: indexRef(stack.length - 1) }, anchor: "push-operand", explanation: `Push ${t}. The stack is now ${stack.join(", ")}.`,
        variables: { i, token: t, size: stack.length }, state: stackSnapshot(stack),
        changed: [indexRef(stack.length - 1)], highlights: [slot(stack.length - 1, "created", "top")], motion: "appear",
      });
      continue;
    }
    b.step({
      event: { type: "init" }, anchor: "check-operand", explanation: `${token(t)} is an operator, so take the top two numbers.`,
      variables: { i, token: token(t), size: stack.length }, state: stackSnapshot(stack),
    });
    const right = stack.pop()!;
    b.step({
      event: { type: "pop", element: indexRef(stack.length) }, anchor: "pop-right", explanation: `Pop ${right}: this is the right operand.`,
      variables: { i, right, size: stack.length }, state: stackSnapshot(stack), highlights: stack.length > 0 ? [top()] : [], motion: "disappear",
    });
    const left = stack.pop()!;
    b.step({
      event: { type: "pop", element: indexRef(stack.length) }, anchor: "pop-left", explanation: `Pop ${left}: this is the left operand.`,
      variables: { i, left, right, size: stack.length }, state: stackSnapshot(stack), highlights: stack.length > 0 ? [top()] : [], motion: "disappear",
    });
    const result = apply(t, left, right);
    b.step({
      event: { type: "init" }, anchor: "apply", explanation: `Compute ${left} ${token(t)} ${right} = ${result}.`,
      variables: { i, left, right, result, size: stack.length }, state: stackSnapshot(stack),
    });
    stack.push(result);
    b.step({
      event: { type: "push", element: indexRef(stack.length - 1) }, anchor: "push-result", explanation: `Push the result ${result} back on the stack.`,
      variables: { i, result, size: stack.length }, state: stackSnapshot(stack),
      changed: [indexRef(stack.length - 1)], highlights: [slot(stack.length - 1, "created", "top")], motion: "appear",
    });
  }
  b.step({
    event: { type: "done" }, anchor: "finish", explanation: `Done. One number is left on the stack: ${stack[0]}. That is the value of the expression.`,
    variables: { size: stack.length, result: stack[0]! }, state: stackSnapshot(stack),
  });
  return b.build({ time: "O(n)", space: "O(n)", result: stack[0]! });
}

export const evaluatePostfix: AlgorithmDefinition<PostfixInput> = { id: ID, parseInput, run };
