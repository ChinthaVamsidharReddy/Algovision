import { anchorOf, type ChainFrame, type TreeStory } from "./types";
import { standOn, treeTones } from "./heap-util";
import { standingAt, valueAt } from "./tree-util";

/** A guide visits the rooms of a hotel floor by floor, using a waiting line of rooms still to visit. */
export const levelOrderStory: TreeStory = {
  id: "level-order-traversal",
  kind: "tree",
  title: "Floor by Floor in the Hotel",
  emoji: "🏨",
  hook: "A hotel guide must visit every room, one floor at a time, from the top floor down, and left to right on each floor. The guide keeps a waiting line of rooms still to visit. Take the room at the front of the line, visit it, then send its left neighbour and its right neighbour to the back of the line. Rooms on the next floor always wait behind the rooms on this floor, so the floors come out in order.",
  cast: [
    { emoji: "🚶", name: "Guide", means: "the node being visited now" },
    { emoji: "🟨", name: "Waiting line", means: "the queue: rooms found but not visited yet" },
    { emoji: "📝", name: "Visit book", means: "the output list, in order" },
  ],
  moral: "Level-order traversal is a queue: take from the front, add the children to the back. Older rooms are always visited before newer ones, so each floor is finished before the next begins.",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const tones = treeTones(step);
    const { node } = standingAt(step);
    const queued = step.highlights.filter((h) => h.label === "queued" && h.target.kind === "node").map((h) => (h.target.kind === "node" ? valueAt(step, h.target.id) : undefined)).filter((v): v is number => v !== undefined);
    const line = queued.length ? queued.join(", ") : "nobody";
    const out = step.state.output;
    const cur = valueAt(step, step.state.current);
    const cn = step.state.nodes.find((n) => n.id === step.state.current);
    const actors = [];
    if (node && ["dequeue", "visit", "enqueue-left", "enqueue-right"].includes(a)) actors.push({ id: "g", emoji: "🚶", name: "Guide", node });
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    const first = trace.steps[0]!;
    switch (a) {
      case "entry":
        says = first.state.root === null ? "The hotel has no rooms, so there is nothing to visit." : "Visit every room floor by floor, top floor first and left to right. A waiting line decides who is next.";
        if (first.state.root === null) banner = { kind: "info", text: "The hotel was empty." };
        break;
      case "enqueue-root":
        says = `The top room (${valueAt(step, step.state.root)}) joins the waiting line.`;
        inCode = "queue.add(root)";
        break;
      case "loop":
        says = `The waiting line is not empty (${line}), so there is still a room to visit.`;
        inCode = "while (!queue.isEmpty())";
        break;
      case "dequeue":
        says = `Take room ${cur} from the front of the line.`;
        inCode = "node = queue.remove()";
        break;
      case "visit":
        says = `Visit room ${cur}: write it in the visit book. Written so far: ${out.join(", ")}.`;
        inCode = "result.add(node.value)";
        break;
      case "enqueue-left": {
        const l = valueAt(step, cn?.left);
        says = `Room ${cur} has a left neighbour, ${l}. It joins the back of the line (now: ${line}).`;
        inCode = "if (node.left != null) queue.add(node.left)";
        break;
      }
      case "enqueue-right": {
        const r = valueAt(step, cn?.right);
        says = `Room ${cur} has a right neighbour, ${r}. It joins the back of the line (now: ${line}).`;
        inCode = "if (node.right != null) queue.add(node.right)";
        break;
      }
      case "finish":
        says = out.length ? "The waiting line is empty, so every room has been visited, floor by floor." : says;
        banner = out.length ? { kind: "good", text: `Floor by floor: ${out.join(", ")}.` } : { kind: "info", text: "The hotel was empty." };
        break;
    }
    return { tones, actors: standOn(step, actors), says, inCode, banner, board: { label: "Visit book", text: out.length ? out.join(", ") : "nothing yet" } };
  },
};
