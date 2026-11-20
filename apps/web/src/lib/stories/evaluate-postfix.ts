import { anchorOf, type PileFrame, type PileStory, type Tone } from "./types";
import { inputValues, roleAt, toneOfRole, variable } from "./pile-util";

const OPS: Record<number, string> = { [-1]: "+", [-2]: "−", [-3]: "×", [-4]: "÷" };
const tok = (n: number | undefined) => (n === undefined ? "" : n < 0 ? (OPS[n] ?? String(n)) : String(n));

/** A calculator that reads numbers first and the operation after them: numbers wait on a pile until a sign needs two of them. */
export const evaluatePostfixStory: PileStory = {
  id: "evaluate-postfix",
  kind: "pile",
  shape: "stack",
  title: "A Calculator with a Pile of Numbers",
  emoji: "🧮",
  hook: "This calculator reads an expression where the sign comes after its two numbers, like 2 3 + for 2 plus 3. It keeps a pile of numbers. A number is put on the pile. A sign takes the top two numbers off the pile, does the sum, and puts the answer back. When the expression ends, the one number left is the answer.",
  cast: [
    { emoji: "🔢", name: "Number", means: "an operand: waits on the pile" },
    { emoji: "➕", name: "Sign", means: "an operator: uses the top two numbers" },
    { emoji: "👇", name: "Reader", means: "the token being read right now" },
  ],
  moral: "In postfix, a sign always works on the two most recent numbers, which are exactly the two on top of the stack. So there is no need for brackets or precedence rules.",
  frame(step, trace): PileFrame {
    const a = anchorOf(step);
    const tokens = inputValues(trace);
    const i = variable(step, "i");
    const items = step.state.items;
    const strip = {
      label: "The expression, read left to right",
      items: tokens.map((t, k) => ({ text: tok(t), tone: (a === "finish" ? "dim" : i !== undefined && k < i ? "dim" : k === i ? "hit" : "plain") as Tone })),
      at: a === "finish" ? undefined : i,
    };
    const pile = items.map((v, k) => ({ text: String(v), tone: toneOfRole(roleAt(step, k)) }));
    const t = i !== undefined ? tokens[i] : undefined;
    const left = variable(step, "left");
    const right = variable(step, "right");
    const result = variable(step, "result");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: PileFrame["banner"];
    switch (a) {
      case "entry":
        says = tokens.length === 0 ? "An empty expression: nothing to calculate." : `An expression of ${tokens.length} ${tokens.length === 1 ? "token" : "tokens"}. The pile of numbers starts empty.`;
        break;
      case "loop":
        says = `Read the next token: ${tok(t)}.`;
        inCode = "for (token : expression)";
        break;
      case "check-operand":
        says = t !== undefined && t >= 0 ? `${tok(t)} is a number.` : `${tok(t)} is a sign: it needs two numbers.`;
        inCode = "if (token is a number)";
        break;
      case "push-operand":
        says = `Put ${tok(t)} on the pile of numbers.`;
        inCode = "stack.push(token)";
        break;
      case "pop-right":
        says = `Take the top number off the pile: ${right}. It is the right-hand side.`;
        inCode = "right = stack.pop()";
        break;
      case "pop-left":
        says = `Take the next number off the pile: ${left}. It is the left-hand side.`;
        inCode = "left = stack.pop()";
        break;
      case "apply":
        says = `Work it out: ${left} ${tok(t)} ${right} = ${result}.`;
        inCode = "result = left (op) right";
        break;
      case "push-result":
        says = `Put the answer ${result} back on the pile, ready for the next sign.`;
        inCode = "stack.push(result)";
        break;
      case "finish":
        says = items.length === 1 ? `The expression is finished and one number is left on the pile: ${items[0]}.` : "The expression is finished.";
        banner = items.length === 1 ? { kind: "good", text: `The expression equals ${items[0]}.` } : { kind: "info", text: "The expression did not leave exactly one number." };
        inCode = "return stack.pop()";
        break;
    }
    return { strip, pile, pileName: "Numbers (top is at the top)", says, inCode, banner, board: { label: "Numbers on the pile", text: String(items.length) } };
  },
};
