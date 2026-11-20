import { anchorOf, type ChainFrame, type Tone, type TreeStory } from "./types";
import { standingAt, valueAt, visitedIds } from "./tree-util";

/** Guessing a house number on a street that forks: smaller numbers are down the left road, bigger ones down the right. */
export const bstSearchStory: TreeStory = {
  id: "bst-search",
  kind: "tree",
  title: "Which Way to House Number…?",
  emoji: "🏘️",
  hook: "A village is laid out so that, at every house, all smaller house numbers are down the left road and all bigger ones are down the right road. You are looking for one number. At each house you only ask one question: is the number I want smaller or bigger than this one? One road is always the wrong one, so you never walk it.",
  cast: [
    { emoji: "🏠", name: "House", means: "a node of the search tree, with its number" },
    { emoji: "🔍", name: "Seeker", means: "current: the house you are standing at" },
    { emoji: "⬅️➡️", name: "Fork", means: "go left if the wanted number is smaller, right if it is bigger" },
    { emoji: "⬜", name: "Empty plot", means: "no house there: the number is not in the village" },
  ],
  moral: "In a search tree each comparison throws away a whole side. Go left for smaller, right for bigger, stop on a match or on an empty plot. On a balanced tree that is about log n steps.",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const first = trace.steps[0]!;
    const raw = first.variables.find((v) => v.name === "value")?.value;
    const want = typeof raw === "number" ? raw : undefined;
    const { node } = standingAt(step);
    const seen = visitedIds(trace, step);
    const here = seen[seen.length - 1] ?? node;
    const tones: Record<string, Tone> = {};
    for (const id of seen) tones[id] = "dim";
    if (node) tones[node] = a === "found" ? "good" : "hit";
    const actors = node ? [{ id: "s", emoji: "🔍", name: "Seeker", node: a === "go-left" || a === "go-right" || a === "not-found" ? (here ?? node) : node }] : [];
    const v = valueAt(step, node);
    const hv = valueAt(step, here);
    if (first.state.nodes.length === 0) {
      const last = step.index === trace.steps.length - 1;
      return { tones: {}, actors: [], says: `The village has no houses, so house ${want} cannot be there.`, inCode: a === "entry" ? undefined : "return false", banner: last ? { kind: "bad", text: `House ${want} is not in the village.` } : undefined };
    }
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = first.state.root === null ? `The village is empty, so house ${want} cannot be there.` : `Looking for house number ${want}.`;
        break;
      case "init":
        says = `Start at the first house, number ${v}.`;
        inCode = "current = root";
        break;
      case "loop":
        says = v === want ? `House ${v}: that is the number we want!` : want !== undefined && want < (v ?? 0) ? `House ${v}. We want ${want}, which is smaller, so it can only be down the left road.` : `House ${v}. We want ${want}, which is bigger, so it can only be down the right road.`;
        inCode = "while (current != null)  if (value == current.value)";
        break;
      case "go-left":
        says = step.state.current === null ? `The left road from house ${hv} ends in an empty plot.` : `Walk down the left road to house ${v}.`;
        inCode = "current = current.left";
        break;
      case "go-right":
        says = step.state.current === null ? `The right road from house ${hv} ends in an empty plot.` : `Walk down the right road to house ${v}.`;
        inCode = "current = current.right";
        break;
      case "found":
        says = `Found it: house ${v}.`;
        inCode = "return true";
        banner = { kind: "good", text: `Found house ${want} after ${seen.length} ${seen.length === 1 ? "house" : "houses"}.` };
        break;
      case "not-found":
        says = `The road ended at an empty plot, so there is no house ${want} in this village.`;
        inCode = "return false";
        banner = { kind: "bad", text: `House ${want} is not in the village.` };
        break;
    }
    return { tones, actors, says, inCode, banner };
  },
};
