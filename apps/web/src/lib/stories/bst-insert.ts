import { anchorOf, type ChainFrame, type Tone, type TreeStory } from "./types";
import { standingAt, valueAt, visitedIds } from "./tree-util";

/** A new house is built at the one empty plot where the "smaller left, bigger right" rule says it belongs. */
export const bstInsertStory: TreeStory = {
  id: "bst-insert",
  kind: "tree",
  title: "Building a New House",
  emoji: "🏗️",
  hook: "In this village smaller house numbers are down the left road and bigger ones down the right road. A builder arrives with a new house number. He walks from the first house, asking at each one: smaller or bigger? He keeps going until the road he must take is an empty plot. That is where the new house is built.",
  cast: [
    { emoji: "🏠", name: "House", means: "a node of the tree" },
    { emoji: "👷", name: "Builder", means: "current: the house the builder is standing at" },
    { emoji: "🆕", name: "New house", means: "the node being added, always a new leaf" },
    { emoji: "⬜", name: "Empty plot", means: "the free spot where the new house is attached" },
  ],
  moral: "To insert into a search tree, search for the value; the empty spot where the search would end is exactly where the new node goes. Existing houses never move.",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const first = trace.steps[0]!;
    const raw = first.variables.find((v) => v.name === "value")?.value;
    const value = typeof raw === "number" ? raw : undefined;
    const { node } = standingAt(step);
    const seen = visitedIds(trace, step);
    const created = step.highlights.find((h) => h.label === "new")?.target;
    const newId = created && created.kind === "node" ? created.id : null;
    const tones: Record<string, Tone> = {};
    for (const id of seen) tones[id] = "dim";
    if (newId) tones[newId] = a === "finish" ? "good" : "warn";
    if (node && node !== newId) tones[node] = "hit";
    const actors = [];
    if (newId && (a === "check-empty" || a === "finish" || a === "attach-left" || a === "attach-right")) actors.push({ id: "n", emoji: "🆕", name: "New house", node: newId });
    if (node && node !== newId) actors.push({ id: "b", emoji: "👷", name: "Builder", node });
    const v = valueAt(step, node);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = first.state.root === null ? `The village is empty. House ${value} will be the very first.` : `A new house numbered ${value} is to be built.`;
        break;
      case "create-node":
        says = `The builder prepares house ${value}, but has not chosen where it goes yet.`;
        inCode = "node = new Node(value)";
        break;
      case "check-empty":
        says = first.state.root === null ? `There are no houses at all, so house ${value} becomes the first one.` : `There are houses already, so the builder must find the right plot.`;
        inCode = "if (root == null) return node";
        break;
      case "compare":
        says = value !== undefined && v !== undefined ? `At house ${v}: ${value} is ${value < v ? "smaller" : "not smaller"} than ${v}, so the builder takes the ${value < v ? "left" : "right"} road.` : step.explanation;
        inCode = "if (value < current.value)";
        break;
      case "go-left":
        says = `Down the left road to house ${v}.`;
        inCode = "current = current.left";
        break;
      case "go-right":
        says = `Down the right road to house ${v}.`;
        inCode = "current = current.right";
        break;
      case "attach-left":
        says = `The left road from house ${v} is an empty plot. Build house ${value} there.`;
        inCode = "current.left = node";
        break;
      case "attach-right":
        says = `The right road from house ${v} is an empty plot. Build house ${value} there.`;
        inCode = "current.right = node";
        break;
      case "finish":
        says = `House ${value} stands in its place. Every older house stayed where it was.`;
        inCode = "return root";
        banner = { kind: "good", text: `House ${value} was built.` };
        break;
    }
    return { tones, actors, says, inCode, banner };
  },
};
