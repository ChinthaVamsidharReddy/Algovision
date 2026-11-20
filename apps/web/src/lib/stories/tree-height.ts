import { anchorOf, type ChainFrame, type Tone, type TreeStory } from "./types";
import { standingAt, valueAt } from "./tree-util";

/** Counting generations in a family tree: a person's tree is one more generation than their taller side. */
export const treeHeightStory: TreeStory = {
  id: "tree-height",
  kind: "tree",
  title: "How Many Generations?",
  emoji: "🌳",
  hook: "A family tree starts with one ancestor and each person has up to two children. How many generations does it span? You cannot see the whole tree at once, so you ask each person to count their own side: 'how tall is your left family, how tall is your right?' Each answers by asking their own children, all the way down to people with no children.",
  cast: [
    { emoji: "👤", name: "Person", means: "a node of the tree" },
    { emoji: "🧮", name: "Counter", means: "the recursive call working out this person's height" },
    { emoji: "⬜", name: "No child", means: "an empty side counts 0 generations" },
  ],
  moral: "Height is the taller of the two sides plus one for yourself, and an empty side is 0. Every person only has to know their two children's answers.",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const { node, emptyAhead } = standingAt(step);
    const tones: Record<string, Tone> = {};
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (s.source.kind === "anchor" && s.source.id === "combine" && s.state.current) tones[s.state.current] = "good";
    }
    if (node) tones[node] = a === "combine" ? "good" : "hit";
    const actors = node ? [{ id: "c", emoji: "🧮", name: "Counter", node }] : [];
    const get = (name: string) => step.variables.find((x) => x.name === name)?.value;
    const left = get("left");
    const right = get("right");
    const result = get("result");
    const v = valueAt(step, node);
    const stack = step.state.callStack;
    const parentId = emptyAhead ? node : (stack[stack.length - 2] ?? null);
    const pv = valueAt(step, parentId);
    const total = trace.steps[0]!.state.nodes.length;
    if (total === 0) {
      const last = step.index === trace.steps.length - 1;
      return { tones: {}, actors: [], says: "There is nobody in this family tree, so the height is 0.", inCode: "if (node == null) return 0", banner: last ? { kind: "info", text: "An empty family tree is 0 generations tall." } : undefined };
    }
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = total === 0 ? "There is nobody in this family tree: 0 generations." : step.state.current === null ? `A family of ${total} people. Ask the oldest ancestor how many generations the whole tree has.` : `Ask person ${v}: how many generations are in your family?`;
        break;
      case "go-left":
        says = emptyAhead ? `Person ${pv} has no left child, so that side is empty.` : `Person ${pv} asks the left child, ${v}: how tall is your family?`;
        inCode = "height(node.left)";
        break;
      case "go-right":
        says = emptyAhead ? `Person ${pv} has no right child, so that side is empty.` : `Person ${pv} asks the right child, ${v}: how tall is your family?`;
        inCode = "height(node.right)";
        break;
      case "base-case":
        says = `Nobody there: an empty side is 0 generations. Back to person ${v}.`;
        inCode = "if (node == null) return 0";
        break;
      case "combine": {
        const last = step.state.callStack.length === 0;
        says = `Person ${v === undefined ? "at the top" : v}: left side ${left}, right side ${right}. The taller is ${Math.max(Number(left), Number(right))}, plus 1 for themselves makes ${result}.`;
        inCode = "return 1 + max(left, right)";
        if (last) banner = { kind: "good", text: `The family tree is ${result} ${result === 1 ? "generation" : "generations"} tall.` };
        break;
      }
    }
    return { tones, actors, says, inCode, banner };
  },
};
