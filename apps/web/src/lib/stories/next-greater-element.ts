import { anchorOf, type PileFrame, type PileStory, type Tone } from "./types";
import { inputValues, isLast, roleAt, toneOfRole, variable } from "./pile-util";

/** People stand in a line; each wants to know the first taller person standing somewhere to their right. */
export const nextGreaterElementStory: PileStory = {
  id: "next-greater-element",
  kind: "pile",
  shape: "stack",
  title: "Who Is the Next Taller Person?",
  emoji: "📏",
  hook: "People stand in a row, each with a height. Every person wants to know who is the first taller person to their right. Walking along the row, a pile keeps the people who are still waiting for a taller one. When a new person arrives who is taller than the person on top of the pile, that waiting person has found their answer and leaves the pile. People who never find one stay at the end with the answer 'nobody'.",
  cast: [
    { emoji: "🧍", name: "Person", means: "an element, with its height" },
    { emoji: "🕐", name: "Waiting pile", means: "the stack: people still looking for someone taller" },
    { emoji: "👇", name: "Newcomer", means: "the person arriving right now" },
  ],
  moral: "Keep a stack of people still waiting. A newcomer who is taller answers everyone shorter on top of the stack, then joins it. Each person goes on and off the stack once, so the whole row is handled in one pass.",
  frame(step, trace): PileFrame {
    const a = anchorOf(step);
    const values = inputValues(trace);
    const n = values.length;
    // Replay the answers found so far: a pop-assign step gives person j the newcomer's height.
    const answer = new Map<number, number>();
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (s.source.kind === "anchor" && s.source.id === "pop-assign") {
        const j = variable(s, "j");
        const v = variable(s, "value");
        if (j !== undefined && v !== undefined) answer.set(j, v);
      }
    }
    const i = variable(step, "i");
    const items = step.state.items;
    const strip = {
      label: "Heights, left to right",
      items: values.map((v, k) => ({ text: String(v), tone: (answer.has(k) ? "good" : a !== "finish" && k === i ? "hit" : "plain") as Tone })),
      at: a === "finish" ? undefined : i,
    };
    const pile = items.map((idx, k) => ({ text: String(values[idx]), sub: `person ${idx + 1}`, tone: toneOfRole(roleAt(step, k)) }));
    const poppedIdx = variable(step, "j");
    const topIdx = items[items.length - 1];
    const v = variable(step, "value");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: PileFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "Nobody is in the row." : `${n} ${n === 1 ? "person" : "people"} in a row. The waiting pile is empty.`;
        break;
      case "init-result":
        says = "Everybody's answer starts as 'nobody taller' (-1). Answers are filled in as taller people turn up.";
        inCode = "result[] = -1";
        break;
      case "loop":
        says = `Person ${(i ?? 0) + 1}, height ${v}, steps up.`;
        inCode = "for (i = 0; i < n; i++)";
        break;
      case "while-check": {
        const role = roleAt(step, items.length - 1);
        if (items.length === 0) says = "Nobody is waiting, so the newcomer has nobody to answer.";
        else if (role === "found") says = `The person on top of the pile (height ${values[topIdx!]}) is shorter than the newcomer (${v}): this newcomer is their next taller person.`;
        else says = `The person on top of the pile (height ${values[topIdx!]}) is not shorter than the newcomer (${v}), so no one else on the pile can be answered yet.`;
        inCode = "while (!stack.isEmpty() && values[stack.peek()] < value)";
        break;
      }
      case "pop-assign":
        says = `Person ${(poppedIdx ?? 0) + 1} (height ${values[poppedIdx ?? 0]}) leaves the pile with the answer ${v}: the first taller person to their right.`;
        inCode = "result[stack.pop()] = value";
        break;
      case "push":
        says = `The newcomer joins the waiting pile, looking for someone taller of their own. ${items.length} ${items.length === 1 ? "person is" : "people are"} waiting.`;
        inCode = "stack.push(i)";
        break;
      case "finish": {
        says = items.length ? `The row is finished. ${items.length} ${items.length === 1 ? "person is" : "people are"} still waiting, and ${items.length === 1 ? "gets" : "get"} the answer -1 (nobody taller).` : "The row is finished and everyone found a taller person.";
        break;
      }
    }
    if (isLast(step, trace)) {
      const list = values.map((_, k) => (answer.has(k) ? answer.get(k)! : -1));
      banner = { kind: "good", text: `The next taller height for each person: ${list.join(", ")}.` };
    }
    const known = [...answer].sort((x, y) => x[0] - y[0]).map(([k, val]) => `${values[k]} → ${val}`);
    return { strip, pile, pileName: "Waiting pile (top is at the top)", says, inCode, banner, board: { label: "Answers found", text: known.length ? known.join(",  ") : "none yet" } };
  },
};
