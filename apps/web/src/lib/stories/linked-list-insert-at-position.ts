import { anchorOf, chainIds, type ChainActor, type ChainFrame, type ChainStory, type Tone } from "./types";
import { nextOf, present, spot, valueOf } from "./chain-util";

/** Squeezing a new coach into the middle of a train: find the coach before the gap, then couple in the right order. */
export const linkedListInsertAtPositionStory: ChainStory = {
  id: "linked-list-insert-at-position",
  kind: "linkedList",
  title: "A Coach into the Middle",
  emoji: "🚃",
  hook: "A new coach must be placed at a chosen position in a train. A walker goes to the coach just before the gap. Then comes the careful part: first couple the new coach to the coach that will follow it, then couple the walker's coach to the new one. Do it the other way round and the back half of the train is lost.",
  cast: [
    { emoji: "🚃", name: "Coach", means: "a node in the list" },
    { emoji: "🆕", name: "New coach", means: "the node we create" },
    { emoji: "🚶", name: "Walker", means: "prev: the coach just before the gap" },
  ],
  moral: "To insert in the middle, point the new node at the old next node first, then point the previous node at the new node. Finding the spot takes up to O(n) steps; the two pointer changes themselves take O(1).",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const first = trace.steps[0]!;
    const num = (name: string) => first.variables.find((v) => v.name === name)?.value;
    const value = num("value");
    const position = num("position") as number;
    const fresh = spot(step, "node");
    const prev = spot(step, "prev");
    const i = step.variables.find((v) => v.name === "i")?.value;
    const tones: Record<string, Tone> = {};
    if (fresh && fresh !== "end") tones[fresh] = a === "finish" ? "good" : "warn";
    if (prev && prev !== "end") tones[prev] = a === "walk-loop" ? "warn" : "hit";
    const actors: ChainActor[] = [];
    if (fresh && fresh !== "end") actors.push({ id: "n", emoji: "🆕", name: "New", node: fresh });
    if (prev && prev !== "end" && !["entry", "finish"].includes(a)) actors.push({ id: "w", emoji: "🚶", name: "Walker", node: prev });
    const prevVal = prev && prev !== "end" ? valueOf(step, prev) : undefined;
    const after = fresh && fresh !== "end" ? nextOf(step, fresh) : null;
    const afterVal = after ? valueOf(step, after) : undefined;
    const steps = Math.max(position - 1, 0);
    const count = chainIds(first.state).length;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = `${count === 0 ? "The train is empty" : `The train has ${count} ${count === 1 ? "coach" : "coaches"}`}. Coach ${value} must end up at position ${position} (the front is position 0).`;
        break;
      case "create-node":
        says = `A new coach holding ${value} rolls in. It is not coupled to anything yet.`;
        inCode = "node = new Node(value)";
        break;
      case "check-head":
        says = position === 0 ? "Position 0 means the new coach goes at the very front." : `Position ${position} is not the front, so find the coach just before that spot.`;
        inCode = "if (position == 0)";
        break;
      case "link-new-head":
        says = count === 0 ? "The train was empty, so the new coach becomes the whole train." : "Couple the new coach to the old front coach, then make it the new front.";
        inCode = "node.next = head; head = node";
        break;
      case "init-prev":
        says = `The walker starts at the front coach, ${prevVal}. It must walk ${steps} ${steps === 1 ? "step" : "steps"} to reach the coach before the gap.`;
        inCode = "prev = head";
        break;
      case "walk-loop":
        says = typeof i === "number" && i < steps ? `Step ${i + 1} of ${steps}: the walker is not at the gap yet.` : `The walker is at coach ${prevVal}, just before the gap.`;
        inCode = "for (i = 0; i < position - 1; i++)";
        break;
      case "advance":
        says = `Walk on to coach ${prevVal}.`;
        inCode = "prev = prev.next";
        break;
      case "link-new":
        says = afterVal === undefined ? "Nothing comes after the gap, so the new coach is coupled to nothing and will be the last." : `Couple the new coach to the coach that will follow it (${afterVal}), so nothing behind is lost.`;
        inCode = "node.next = prev.next";
        break;
      case "link-prev":
        says = `Now couple coach ${prevVal} to the new coach. Coach ${value} is in the train.`;
        inCode = "prev.next = node";
        break;
      case "finish":
        says = `Done. Coach ${value} now sits at position ${position}.`;
        banner = { kind: "good", text: `Coach ${value} is now at position ${position}.` };
        break;
    }
    return { tones: present(step, tones), actors, says, inCode, banner };
  },
};
