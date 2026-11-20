import { anchorOf, type ChainFrame, type TreeStory } from "./types";
import { standOn, treeTones } from "./heap-util";
import { valueAt } from "./tree-util";

/** On a street where smaller numbers are left and bigger numbers right, the ends are found by always turning the same way. */
export const bstFindMinMaxStory: TreeStory = {
  id: "bst-find-min-max",
  kind: "tree",
  title: "The First and Last House Number",
  emoji: "🏡",
  hook: "In this village the smaller house numbers are down the left road and the bigger ones down the right road. To find the smallest number, you never need to look at anything else: start at the first house and keep turning left until there is no left road. To find the biggest, start again and keep turning right.",
  cast: [
    { emoji: "🚶", name: "Walker", means: "current: the house you are standing at" },
    { emoji: "⬅️", name: "Left road", means: "always towards smaller numbers" },
    { emoji: "➡️", name: "Right road", means: "always towards bigger numbers" },
  ],
  moral: "In a search tree the minimum is the leftmost node and the maximum is the rightmost node. Follow one direction to the end: no comparing, and at most the height of the tree in steps.",
  frame(step): ChainFrame {
    const a = anchorOf(step);
    const tones = treeTones(step);
    const cur = valueAt(step, step.state.current);
    const cn = step.state.nodes.find((n) => n.id === step.state.current);
    const out = step.state.output;
    const actors = step.state.current && !["entry", "finish"].includes(a) ? [{ id: "w", emoji: "🚶", name: "Walker", node: step.state.current }] : [];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = "Find the smallest and the largest house number. The smallest is at the far left end of the village, the largest at the far right end.";
        break;
      case "init-min":
        says = `Start at the first house, ${cur}, and keep taking the left road.`;
        inCode = "current = root";
        break;
      case "loop-min":
        says = cn?.left ? `House ${cur} has a left road, so keep going left.` : `House ${cur} has no left road, so the walk ends here.`;
        inCode = "while (current.left != null)";
        break;
      case "go-left":
        says = `Walk down the left road to house ${cur}.`;
        inCode = "current = current.left";
        break;
      case "record-min":
        says = `The smallest house number is ${out[0]}.`;
        inCode = "min = current.value";
        break;
      case "init-max":
        says = `Go back to the first house, ${cur}, and this time keep taking the right road.`;
        inCode = "current = root";
        break;
      case "loop-max":
        says = cn?.right ? `House ${cur} has a right road, so keep going right.` : `House ${cur} has no right road, so the walk ends here.`;
        inCode = "while (current.right != null)";
        break;
      case "go-right":
        says = `Walk down the right road to house ${cur}.`;
        inCode = "current = current.right";
        break;
      case "record-max":
        says = `The largest house number is ${out[1]}.`;
        inCode = "max = current.value";
        break;
      case "finish":
        says = "Both ends of the village have been found.";
        banner = out.length === 2 ? { kind: "good", text: `Smallest ${out[0]}, largest ${out[1]}.` } : { kind: "info", text: "The village is empty." };
        break;
    }
    return { tones, actors: standOn(step, actors), says, inCode, banner, board: { label: "Found so far", text: out.length === 0 ? "nothing yet" : out.length === 1 ? `smallest ${out[0]}` : `smallest ${out[0]}, largest ${out[1]}` } };
  },
};
