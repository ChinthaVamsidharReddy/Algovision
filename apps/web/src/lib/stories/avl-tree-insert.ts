import { anchorOf, variable, type ChainFrame, type TreeStory } from "./types";
import { standOn, treeTones } from "./heap-util";
import { standingAt, valueAt } from "./tree-util";

/** A village that never lets one side grow more than one level taller than the other: a lopsided stretch is rotated back into balance. */
export const avlInsertStory: TreeStory = {
  id: "avl-tree-insert",
  kind: "tree",
  title: "The Village That Never Leans",
  emoji: "⚖️",
  hook: "Houses are built one at a time, smaller numbers to the left and bigger to the right. If you keep building on one side the village leans and becomes a long, slow road. So after every new house, an inspector walks back up the road and checks each house: is its left side more than one level taller than its right side, or the other way round? If it leans too far, the inspector rotates the houses around, lifting the middle one up, until the village is level again.",
  cast: [
    { emoji: "🧑‍🔧", name: "Inspector", means: "the node being checked right now" },
    { emoji: "⚖️", name: "Lean", means: "balance factor: left height minus right height" },
    { emoji: "🔄", name: "Rotation", means: "rotate left / right: a local re-hanging that restores balance" },
  ],
  moral: "After each insert, walk back up and check each node's balance. When one side is two levels taller, a rotation fixes it in a few pointer changes, so the tree stays about log n tall and every search stays fast.",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const tones = treeTones(step);
    const { node } = standingAt(step);
    const value = variable(step, "value");
    const nodeVal = variable(step, "node");
    const up = variable(step, "up");
    const balance = variable(step, "balance");
    const n = trace.steps[0]?.variables.find((v) => v.name === "n")?.value;
    const count = typeof n === "number" ? n : 0;
    const cv = valueAt(step, step.state.current);
    const actors = node && ["compare", "go-left", "go-right", "balance", "balanced", "rotate-left", "rotate-right"].includes(a) ? [{ id: "i", emoji: "🧑‍🔧", name: "Inspector", node }] : [];
    const ret = step.event.type === "return";
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = count === 0 ? "No houses to build, so the village stays empty." : `${count} ${count === 1 ? "house" : "houses"} will be built one at a time. After each one, the inspector checks that the village is not leaning.`;
        break;
      case "next":
        says = `Next house to build: number ${value}.`;
        inCode = "for (value : values) root = insert(root, value)";
        break;
      case "insert":
        says = nodeVal === null ? `There is an empty plot here. House ${value} can be built on it.` : `At house ${nodeVal}: where does house ${value} belong?`;
        inCode = "insert(node, value)";
        break;
      case "create":
        says = ret ? `House ${value} is built. The inspector now walks back up the road, checking every house on the way.` : `The plot is empty, so house ${value} is built here.`;
        inCode = ret ? "return newNode" : "if (node == null) return new Node(value)";
        break;
      case "duplicate":
        says = `A house numbered ${value} already stands here, so this one is skipped. The village does not change.`;
        inCode = "if (value == node.value) return node";
        break;
      case "compare":
        says = cv !== undefined && value !== null ? `${value} is ${value < cv ? "smaller than" : value > cv ? "bigger than" : "equal to"} ${cv}, so it belongs on the ${value < cv ? "left" : "right"}.` : says;
        inCode = "if (value < node.value)";
        break;
      case "go-left":
        says = `Take the left road from house ${cv}.`;
        inCode = "node.left = insert(node.left, value)";
        break;
      case "go-right":
        says = `Take the right road from house ${cv}.`;
        inCode = "node.right = insert(node.right, value)";
        break;
      case "balance": {
        const b = balance ?? 0;
        says = `Back at house ${cv}: ${b === 0 ? "both sides are equally tall, so it is level." : Math.abs(b) === 1 ? `it leans slightly to the ${b > 0 ? "left" : "right"}, which is allowed.` : `it leans too far to the ${b > 0 ? "left" : "right"} (one side is two levels taller). It must be rotated.`}`;
        inCode = "balance = height(left) - height(right)";
        break;
      }
      case "rotate-left":
      case "rotate-right": {
        const dir = a === "rotate-left" ? "left" : "right";
        says = ret ? `That part of the village is level again, with house ${nodeVal} on top. The inspector reports it to the road above.` : `Rotate ${dir}: house ${up} is lifted up and house ${nodeVal} steps down, which evens out the two sides.`;
        inCode = ret ? "return newRoot" : a === "rotate-left" ? "rotateLeft(node)" : "rotateRight(node)";
        break;
      }
      case "balanced":
        says = "Nothing needs fixing here. The inspector walks on up.";
        inCode = "return node";
        break;
      case "finish": {
        const h = variable(step, "height");
        says = count === 0 ? "The village is empty, so its height is 0." : "Every house has been built and checked.";
        banner = h === null || h === 0 ? { kind: "info", text: "The village is empty: 0 levels tall." } : { kind: "good", text: `The village is ${h} ${h === 1 ? "level" : "levels"} tall.` };
        break;
      }
    }
    return { tones, actors: standOn(step, actors), says, inCode, banner };
  },
};
