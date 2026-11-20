import { anchorOf, type PileFrame, type PileStory, type Tone } from "./types";
import { inputValues, isLast, roleAt, toneOfRole, variable } from "./pile-util";

const SYMBOL: Record<number, string> = { 1: "(", 2: ")", 3: "[", 4: "]", 5: "{", 6: "}" };
const sym = (n: number | undefined) => (n === undefined ? "?" : (SYMBOL[n] ?? String(n)));
const OPENER = (n: number) => n % 2 === 1;

/** Boxes opened and closed like Russian dolls: a closing bracket must match the box opened most recently. */
export const validParenthesesStory: PileStory = {
  id: "valid-parentheses",
  kind: "pile",
  shape: "stack",
  title: "Boxes Inside Boxes",
  emoji: "📦",
  hook: "You open a box, and inside it you may open more boxes. Each box must be closed with its own matching lid, and always the one opened last must be closed first. You keep a pile of the boxes still open. A new opening bracket goes on the pile. A closing bracket must match the box on top of the pile, and then that box is taken off.",
  cast: [
    { emoji: "📦", name: "Open box", means: "an opening bracket waiting for its closer, on the stack" },
    { emoji: "🔒", name: "Lid", means: "a closing bracket that must match the top box" },
    { emoji: "👇", name: "Reader", means: "the bracket being read right now" },
  ],
  moral: "Brackets are balanced exactly when every closer matches the most recent unmatched opener, and nothing is left open at the end. 'Most recent first' is what a stack does.",
  frame(step, trace): PileFrame {
    const a = anchorOf(step);
    const codes = inputValues(trace);
    const i = variable(step, "i");
    const last = trace.steps[trace.steps.length - 1]!;
    const balancedFinal = variable(last, "balanced");
    const done = i === undefined ? (a === "finish" ? codes.length : 0) : i;
    const strip = {
      label: "Brackets, read left to right",
      items: codes.map((c, k) => ({ text: sym(c), tone: (a === "finish" ? "dim" : k < done ? "dim" : k === done ? "hit" : "plain") as Tone })),
      at: a === "finish" ? undefined : i,
    };
    const items = step.state.items;
    const pile = items.map((c, k) => ({ text: sym(c), tone: toneOfRole(roleAt(step, k)) }));
    const c = variable(step, "c") ?? (i !== undefined ? codes[i] : undefined);
    const top = items[items.length - 1];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: PileFrame["banner"];
    switch (a) {
      case "entry":
        says = codes.length === 0 ? "No brackets at all, so there is nothing to mismatch." : `${codes.length} ${codes.length === 1 ? "bracket" : "brackets"} to check. Nothing is open yet.`;
        break;
      case "loop":
        says = `Read the next bracket: ${sym(c)}.`;
        inCode = "for (c : brackets)";
        break;
      case "check-open":
        says = c !== undefined && OPENER(c) ? `${sym(c)} opens a new box.` : `${sym(c)} is a lid: it should close the box opened last.`;
        inCode = "if (c is an opener)";
        break;
      case "push":
        says = `Put the open box ${sym(c)} on the pile. ${items.length} ${items.length === 1 ? "box is" : "boxes are"} open.`;
        inCode = "stack.push(c)";
        break;
      case "check-empty":
        says = items.length === 0 ? `A lid ${sym(c)} with no box open: nothing for it to close.` : `Look at the box on top of the pile: ${sym(top)}.`;
        inCode = "if (stack.isEmpty()) return false";
        break;
      case "check-match": {
        const bad = variable(step, "balanced") === 0;
        says = bad ? `${sym(top)} and ${sym(c)} do not belong together. The brackets are not balanced.` : `${sym(top)} and ${sym(c)} belong together.`;
        inCode = "if (top does not match c) return false";
        break;
      }
      case "pop":
        says = `The lid fits, so that box is closed and taken off the pile. ${items.length} ${items.length === 1 ? "box is" : "boxes are"} still open.`;
        inCode = "stack.pop()";
        break;
      case "finish":
        says = balancedFinal === 1 ? "Every box was closed by its own lid, and none is left open." : `The brackets ran out but ${items.length} ${items.length === 1 ? "box is" : "boxes are"} still open.`;
        inCode = "return stack.isEmpty()";
        break;
    }
    if (isLast(step, trace)) {
      banner = balancedFinal === 1 ? { kind: "good", text: "Balanced: every bracket is closed by the right kind, in the right order." } : { kind: "bad", text: "Not balanced: a bracket is closed wrongly or left open." };
    }
    return { strip, pile, pileName: "Open boxes (top is at the top)", says, inCode, banner, board: { label: "Boxes still open", text: String(items.length) } };
  },
};
