import { anchorOf, type PileFrame, type PileStory, type Tone } from "./types";
import { inputValues, isLast, roleAt, toneOfRole, variable } from "./pile-util";

/** A skyline of buildings: the biggest rectangular billboard that fits against it. */
export const largestRectangleStory: PileStory = {
  id: "largest-rectangle-histogram",
  kind: "pile",
  shape: "stack",
  title: "The Biggest Billboard",
  emoji: "🏙️",
  hook: "A skyline of buildings stands side by side, each one block wide and some number of floors tall. You want to hang the biggest rectangular billboard that fits against the skyline without crossing a gap. You walk along the skyline with a pile of buildings that are still growing taller. When a building shorter than the one on top shows up, the top building can stretch no further right: measure the billboard that building could carry, then drop it from the pile.",
  cast: [
    { emoji: "🏢", name: "Building", means: "a bar of the histogram, with its height" },
    { emoji: "🧱", name: "Rising pile", means: "the stack: buildings in increasing height, still able to stretch right" },
    { emoji: "🪧", name: "Billboard", means: "the area measured when a building leaves the pile" },
  ],
  moral: "A bar's biggest rectangle stretches left and right until a shorter bar blocks it. A stack of rising bars finds both blockers: the next shorter bar pops it, and the bar below it on the stack is the left blocker. The final bar of height 0 forces everyone off.",
  frame(step, trace): PileFrame {
    const a = anchorOf(step);
    const heights = inputValues(trace);
    const i = variable(step, "i");
    const h = variable(step, "h");
    const items = step.state.items;
    const best = variable(step, "best") ?? 0;
    const strip = {
      label: "Building heights, left to right",
      items: heights.map((v, k) => ({ text: String(v), tone: (a !== "finish" && k === i ? "hit" : i !== undefined && k < i ? "dim" : "plain") as Tone })),
      at: a === "finish" || i === undefined || i >= heights.length ? undefined : i,
    };
    const pile = items.map((idx, k) => (idx >= heights.length ? { text: "0", sub: "end marker", tone: toneOfRole(roleAt(step, k)) } : { text: String(heights[idx]), sub: `no. ${idx + 1}`, tone: toneOfRole(roleAt(step, k)) }));
    const prev = step.index > 0 ? trace.steps[step.index - 1]!.state.items : [];
    const goneIdx = prev[prev.length - 1];
    const area = variable(step, "area");
    const sentinel = i !== undefined && i >= heights.length;
    const top = items[items.length - 1];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: PileFrame["banner"];
    switch (a) {
      case "entry":
        says = heights.length === 0 ? "An empty skyline: no billboard fits." : `A skyline of ${heights.length} ${heights.length === 1 ? "building" : "buildings"}. The rising pile starts empty.`;
        break;
      case "loop":
        says = sentinel ? "Past the last building, imagine one more of height 0. It is shorter than everything, so it will clear the whole pile." : `Next building: number ${(i ?? 0) + 1}, height ${h}.`;
        inCode = "for (i = 0; i <= n; i++)  h = (i == n) ? 0 : heights[i]";
        break;
      case "while-check": {
        const role = roleAt(step, items.length - 1);
        if (items.length === 0) says = "The pile is empty, so there is nothing to measure.";
        else if (role === "found") says = `The building on top of the pile (height ${heights[top!]}) is taller than the new one (${h}). It cannot stretch any further right.`;
        else says = `The building on top of the pile (height ${heights[top!]}) is not taller than the new one (${h}), so it can keep stretching.`;
        inCode = "while (!stack.isEmpty() && heights[stack.peek()] > h)";
        break;
      }
      case "pop-area":
        says = `Measure the billboard for building ${(goneIdx ?? 0) + 1} (height ${heights[goneIdx ?? 0]}): area ${area}. The best so far is ${best}.`;
        inCode = "area = height * width; best = max(best, area)";
        break;
      case "push":
        says = "The new building joins the rising pile.";
        inCode = "stack.push(i)";
        break;
      case "finish":
        says = `Every building has been measured. The biggest billboard has area ${best}.`;
        break;
    }
    if (isLast(step, trace)) banner = { kind: "good", text: `The biggest rectangle has area ${best}.` };
    return { strip, pile, pileName: "Rising pile (top is at the top)", says, inCode, banner, board: { label: "Biggest billboard so far", text: String(best) } };
  },
};
