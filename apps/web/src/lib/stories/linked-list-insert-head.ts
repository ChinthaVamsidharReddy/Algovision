import { chainIds, anchorOf, type ChainActor, type ChainFrame, type ChainStory, type Tone } from "./types";
import { spot, valueOf, present } from "./chain-util";

/** A new coach joins the front of the train: couple it to the old first coach, then make it the engine. */
export const linkedListInsertHeadStory: ChainStory = {
  id: "linked-list-insert-head",
  kind: "linkedList",
  title: "A New Engine Coach",
  emoji: "🚆",
  hook: "A new coach arrives and must go at the very front of the train. The order of the two steps matters: first couple the new coach to the old front, then declare it the new front. Do it the other way round and the rest of the train is left behind.",
  cast: [
    { emoji: "🚃", name: "Coach", means: "a node in the list" },
    { emoji: "🆕", name: "New coach", means: "the node we create" },
    { emoji: "🔗", name: "Coupling", means: "the next pointer joining two coaches" },
  ],
  moral: "Inserting at the head takes constant time: make the node, point it at the old head, then move the head. No walking along the list.",
  frame(step, trace) {
    const a = anchorOf(step);
    const first = trace.steps[0]!;
    const value = first.variables.find((v) => v.name === "value")?.value;
    const created = spot(step, "node");
    const tones: Record<string, Tone> = {};
    for (const id of chainIds(first.state)) tones[id] = "plain";
    if (created && created !== "end") tones[created] = a === "finish" ? "good" : "hit";
    const actors: ChainActor[] = created ? [{ id: "n", emoji: "🆕", name: "New", node: created }] : [];
    const oldFront = chainIds(first.state)[0];
    const oldVal = valueOf(first, oldFront);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = oldFront ? `The train has ${chainIds(first.state).length} coaches. Coach ${value} must join at the front.` : `The train is empty. Coach ${value} will be the only one.`;
        break;
      case "create-node":
        says = `A new coach holding ${value} rolls in. It is not coupled to anything yet.`;
        inCode = "node = new Node(value)";
        break;
      case "link-next":
        says = oldFront ? `Couple the new coach to the old front coach (${oldVal}), so nobody is lost.` : "There is no old front, so the new coach is coupled to nothing.";
        inCode = "node.next = head";
        break;
      case "move-head":
        says = `Now the new coach is the front of the train: the head moves to it.`;
        inCode = "head = node";
        break;
      case "finish":
        says = `Done. The train now starts with ${value}.`;
        inCode = "return head";
        banner = { kind: "good", text: `Coach ${value} is now at the front.` };
        break;
    }
    return { tones: present(step, tones), actors, says, inCode, banner };
  },
};
