import { anchorOf, variable, type ChainFrame, type TreeStory } from "./types";
import { hasRole, heapId, heapList, heapTones, heapValue, listText, standOn } from "./heap-util";
import { ord } from "./pile-util";

/** A podium with k places: the weakest score on the podium sits at the top, and only a better score can knock it off. */
export const kthLargestStory: TreeStory = {
  id: "kth-largest-element",
  kind: "tree",
  title: "The Podium With k Places",
  emoji: "🏆",
  hook: "A contest has many scores, but you only care about the k best. The podium has exactly k places. While it has room, every score steps up. Once it is full, a new score must beat the weakest score on the podium to get in, and the weakest is knocked off. The weakest is always kept at the top of the chart, so it is the first thing a newcomer has to beat. At the end, the weakest on the podium is the k-th best score.",
  cast: [
    { emoji: "🆕", name: "Newcomer", means: "the score being considered now" },
    { emoji: "🥉", name: "Weakest on the podium", means: "the root of the min-heap" },
    { emoji: "📋", name: "Podium as a list", means: "the heap stored in an array" },
  ],
  moral: "To find the k-th largest, keep only the k largest values in a min-heap. Its root is the smallest of them, which is exactly the k-th largest. Each value costs at most O(log k), and memory stays at k.",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const first = trace.steps[0]!;
    const kRaw = first.variables.find((v) => v.name === "k")?.value;
    const k = typeof kRaw === "number" ? kRaw : 0;
    const v = variable(step, "v");
    const size = variable(step, "size");
    const child = variable(step, "child");
    const parent = variable(step, "parent");
    const root = variable(step, "root");
    const smallest = variable(step, "smallest");
    const tones = heapTones(step);
    const swapped = hasRole(step, "swapped");
    const actors = [];
    const hireAt = a === "push" ? child : a === "sift-up" ? (swapped ? parent : child) : a === "replace" ? 0 : a === "sift-down" ? (swapped ? smallest : root) : null;
    if (hireAt !== null && hireAt !== undefined) actors.push({ id: "n", emoji: "🆕", name: "Newcomer", node: heapId(hireAt) });
    const top = heapValue(step, 0);
    const prev = step.index > 0 ? trace.steps[step.index - 1]! : null;
    const kicked = prev ? variable(prev, "root") : null;
    const list = heapList(step);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = `Find the ${ord(k)} best score. The podium has ${k} ${k === 1 ? "place" : "places"}, and its weakest score always sits at the top of the chart.`;
        break;
      case "next":
        says = `The next score to consider is ${v}.`;
        inCode = "for (value : values)";
        break;
      case "check-size":
        says = size !== null && size < k ? `The podium has ${size} of ${k} places taken, so there is room. Score ${v} steps up.` : `The podium is full. Score ${v} must beat the weakest on the podium (${top}) to get a place.`;
        inCode = "if (heap.size() < k)";
        break;
      case "push":
        says = `Score ${v} takes the next free place at the bottom of the chart.`;
        inCode = "heap.add(value)";
        break;
      case "sift-up": {
        const c = heapValue(step, swapped ? parent : child);
        const p = heapValue(step, swapped ? child : parent);
        if (swapped) says = `They swap: ${c} moves up above ${p}, because the weakest score must stay on top.`;
        else if (hasRole(step, "compared")) says = c !== undefined && p !== undefined ? `${p} is above ${c}. ${p > c ? `${p} is bigger, so the weaker score ${c} must move up: swap them.` : `${p} is not bigger.`}` : says;
        else says = `The score above (${p}) is not bigger than ${c}, so the order holds. Stop.`;
        inCode = "while (heap[parent] > heap[child]) swap";
        break;
      }
      case "compare-root":
        says = root !== null && v !== null ? (v > root ? `${v} beats the weakest on the podium (${root}), so ${root} is knocked off and ${v} takes its place.` : `${v} does not beat the weakest on the podium (${root}), so it is not among the best ${k}. It is ignored.`) : says;
        inCode = "if (value > heap.peek())";
        break;
      case "replace":
        says = `${kicked !== null ? kicked : "The weakest"} leaves the podium. Score ${v} sits at the top for now, but it might not be the weakest any more, so it must settle down.`;
        inCode = "heap[0] = value; siftDown(0)";
        break;
      case "sift-down": {
        if (swapped) says = `They swap: the weaker score moves up to the top, and ${v} moves down one level.`;
        else if (hasRole(step, "compared")) says = smallest !== null && root !== null && smallest === root ? `${v} is not bigger than the scores below it, so it stays. It has settled.` : `The weakest of ${v} and the scores below is ${heapValue(step, smallest)}, so ${v} will swap down with it.`;
        else says = `${v} has no places below it, so it stays here.`;
        inCode = "siftDown(index)";
        break;
      }
      case "finish": {
        const res = variable(step, "result");
        says = `All scores are checked. The weakest on the podium, ${res}, is the ${ord(k)} best score.`;
        banner = { kind: "good", text: `The ${ord(k)} largest value is ${res}.` };
        break;
      }
    }
    return { tones, actors: standOn(step, actors), says, inCode, banner, board: { label: "Podium as a list (weakest first)", text: listText(list) } };
  },
};
