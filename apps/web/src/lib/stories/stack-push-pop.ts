import { anchorOf, type PileFrame, type PileStory, type Tone } from "./types";
import { inputNumber, inputValues, joined, roleAt, toneOfRole, variable } from "./pile-util";

/** A pile of plates: the last plate put on is the first one taken off. */
export const stackPushPopStory: PileStory = {
  id: "stack-push-pop",
  kind: "pile",
  shape: "stack",
  title: "The Pile of Plates",
  emoji: "🍽️",
  hook: "In a canteen the clean plates are stacked in a narrow rack. You can only put a plate on the top, and you can only take a plate from the top. The plate you put on last is the one you take off first. Nothing can be pulled from the middle or the bottom.",
  cast: [
    { emoji: "🍽️", name: "Plate", means: "an item in the stack" },
    { emoji: "🔝", name: "Top", means: "the only end where plates go on and come off" },
    { emoji: "📥", name: "Push", means: "put a plate on the top" },
    { emoji: "📤", name: "Pop", means: "take the top plate off" },
  ],
  moral: "A stack is last in, first out. Push and pop both work only at the top, so both take constant time, and the order things come off is the reverse of the order they went on.",
  frame(step, trace): PileFrame {
    const a = anchorOf(step);
    const values = inputValues(trace);
    const pops = inputNumber(trace, "pops") ?? 0;
    const items = step.state.items;
    let pushed = 0;
    let popped = 0;
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (s.source.kind === "anchor" && s.source.id === "push") pushed++;
      if (s.source.kind === "anchor" && s.source.id === "pop") popped++;
    }
    const strip = {
      label: "Plates waiting to go on, in order",
      items: values.map((v, i) => ({ text: String(v), tone: (i < pushed ? "dim" : i === pushed && a !== "finish" && popped === 0 ? "hit" : "plain") as Tone })),
    };
    const pile = items.map((v, i) => ({ text: String(v), tone: toneOfRole(roleAt(step, i)) }));
    const top = items[items.length - 1];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: PileFrame["banner"];
    switch (a) {
      case "entry":
        says = `An empty rack. ${values.length} ${values.length === 1 ? "plate comes" : "plates come"} in, then ${pops} ${pops === 1 ? "is" : "are"} taken off the top.`;
        break;
      case "push":
        says = `Put plate ${variable(step, "pushed")} on top of the pile. The pile now has ${items.length}.`;
        inCode = "stack.push(value)";
        break;
      case "check-empty":
        says = items.length === 0 ? "Before taking a plate, look: the rack is empty, so there is nothing to take." : `Before taking a plate, check the rack is not empty. The top plate is ${top}.`;
        inCode = "if (stack.isEmpty())";
        break;
      case "underflow":
        says = "The rack is empty, so there is no plate to take. The request is skipped.";
        inCode = "underflow: nothing to pop";
        break;
      case "pop":
        says = `Take the top plate off: ${variable(step, "popped")}. It was the last one put on, so it is the first to leave.`;
        inCode = "value = stack.pop()";
        break;
      case "finish":
        says = items.length ? `All done. Left in the rack, bottom to top: ${joined(items)}.` : "All done. The rack is empty.";
        banner = { kind: "good", text: items.length ? `Left in the stack, bottom to top: ${joined(items)}.` : "The stack is empty." };
        break;
    }
    return { strip, pile, pileName: "Rack (top is at the top)", says, inCode, banner, board: { label: "Plates in the rack", text: String(items.length) } };
  },
};
