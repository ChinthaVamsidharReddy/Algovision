import { anchorOf, type ChainFrame, type Tone, type TreeStory } from "./types";
import { standOn } from "./heap-util";
import { standingAt, valueAt } from "./tree-util";

/** Dead-end houses: each house asks the two sides how many dead ends they hold, and adds the answers. */
export const countLeavesStory: TreeStory = {
  id: "count-leaves",
  kind: "tree",
  title: "Counting the Dead-End Houses",
  emoji: "🏘️",
  hook: "A village's roads fork into a left road and a right road. A house with no road leading on from it is a dead end. To count the dead ends, nobody can see the whole village. So each house just asks the two sides: 'how many dead ends are down your road?' A house with no roads is a dead end itself and answers 1. Any other house adds the two answers it gets.",
  cast: [
    { emoji: "🏠", name: "House", means: "a node of the tree" },
    { emoji: "🧮", name: "Counter", means: "the call counting the dead ends in this house's part" },
    { emoji: "🏁", name: "Dead end", means: "a leaf: a node with no children, counted as 1" },
  ],
  moral: "A leaf is worth 1, an empty side is worth 0, and every other node simply adds the leaves of its two sides. Each house only needs the answers of its two children.",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const { node } = standingAt(step);
    const prev = step.index > 0 ? trace.steps[step.index - 1]! : null;
    const tones: Record<string, Tone> = {};
    const isLeaf = (id: string) => {
      const n = step.state.nodes.find((x) => x.id === id);
      return !!n && n.left === null && n.right === null;
    };
    // A house is finished when the algorithm marks it visited; dead ends are shown in green.
    for (const h of step.highlights) {
      if (h.target.kind !== "node") continue;
      if (h.role === "visited") tones[h.target.id] = isLeaf(h.target.id) ? "good" : "dim";
    }
    if (step.state.current) tones[step.state.current] = "hit";
    const actors = node && a !== "base-case" ? [{ id: "c", emoji: "🧮", name: "Counter", node }] : [];
    const result = step.variables.find((v) => v.name === "result")?.value;
    const left = step.variables.find((v) => v.name === "left")?.value;
    const right = step.variables.find((v) => v.name === "right")?.value;
    const cur = valueAt(step, step.state.current);
    const from = prev ? valueAt(prev, prev.state.current) : undefined;
    const rootEmpty = trace.steps[0]!.state.root === null;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = step.event.type === "call" ? (cur === undefined ? "The first question goes to the top of the village, but there is no house there." : `The first question goes to the top house, ${cur}: how many dead ends are in your part of the village?`) : rootEmpty ? "The village is empty, so there are no houses and no dead ends." : "Count the dead-end houses: houses with no road leading on.";
        inCode = step.event.type === "call" ? "countLeaves(root)" : undefined;
        break;
      case "base-case":
        says = "An empty side has no houses, so it holds 0 dead ends.";
        inCode = "if (node == null) return 0";
        break;
      case "check-leaf":
        if (step.event.type === "return") {
          says = typeof result === "number" && result === 1 ? `House ${from} has no roads leading on: it is a dead end. It answers 1.` : `House ${from} answers ${result}.`;
        } else says = `House ${cur} has a road leading on, so it is not a dead end. Ask the sides below it.`;
        inCode = "if (node.left == null && node.right == null) return 1";
        break;
      case "go-left":
        says = cur === undefined ? "Ask the left road. It leads nowhere: there is no house on this side." : `Ask the left road, which leads to house ${cur}.`;
        inCode = "left = countLeaves(node.left)";
        break;
      case "go-right":
        says = cur === undefined ? "Ask the right road. It leads nowhere: there is no house on this side." : `Ask the right road, which leads to house ${cur}.`;
        inCode = "right = countLeaves(node.right)";
        break;
      case "combine":
        says = `House ${from}: ${left} dead ${left === 1 ? "end" : "ends"} on the left plus ${right} on the right makes ${result}.`;
        inCode = "return left + right";
        break;
    }
    const last = step.index === trace.steps.length - 1;
    if (last) {
      const total = typeof result === "number" ? result : 0;
      banner = { kind: "good", text: `The village has ${total} dead-end ${total === 1 ? "house" : "houses"}.` };
    }
    return { tones, actors: standOn(step, actors), says, inCode, banner };
  },
};
