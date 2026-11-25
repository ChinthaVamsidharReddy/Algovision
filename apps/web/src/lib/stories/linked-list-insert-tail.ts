import { anchorOf, chainIds, type ChainActor, type ChainFrame, type ChainStory, type Tone } from "./types";
import { nextOf, present, spot, valueOf } from "./chain-util";

/** A new coach joins the back of a train: the walker has to go all the way to the last coach before it can be coupled. */
export const linkedListInsertTailStory: ChainStory = {
  id: "linked-list-insert-tail",
  kind: "linkedList",
  title: "A Coach at the Back of the Train",
  emoji: "🚂",
  hook: "A new coach must go at the very back of a train. The station only knows where the front is, so a walker starts at the front coach and walks back, coach by coach, until he finds the one with nothing behind it. Only then can the new coach be coupled on.",
  cast: [
    { emoji: "🚃", name: "Coach", means: "a node in the list" },
    { emoji: "🆕", name: "New coach", means: "the node we create" },
    { emoji: "🚶", name: "Walker", means: "current: the coach being looked at" },
  ],
  moral: "Adding at the end of a plain linked list means walking the whole list to find the last node, so it takes O(n) time. Keeping a tail pointer would make it O(1).",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const first = trace.steps[0]!;
    const value = first.variables.find((v) => v.name === "value")?.value;
    const count = chainIds(first.state).length;
    const fresh = spot(step, "node");
    const cur = spot(step, "current");
    const tones: Record<string, Tone> = {};
    if (fresh && fresh !== "end") tones[fresh] = a === "finish" ? "good" : "warn";
    if (cur && cur !== "end") tones[cur] = a === "loop" ? "warn" : "hit";
    const actors: ChainActor[] = [];
    if (fresh && fresh !== "end") actors.push({ id: "n", emoji: "🆕", name: "New", node: fresh });
    if (cur && cur !== "end" && !["entry", "finish"].includes(a)) actors.push({ id: "w", emoji: "🚶", name: "Walker", node: cur });
    const curVal = cur && cur !== "end" ? valueOf(step, cur) : undefined;
    const behind = cur && cur !== "end" ? nextOf(step, cur) : undefined;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = count === 0 ? `The train is empty. Coach ${value} will be the only one.` : `The train has ${count} ${count === 1 ? "coach" : "coaches"}. Coach ${value} must join at the very back.`;
        break;
      case "create-node":
        says = `A new coach holding ${value} rolls in. It is not coupled to anything yet.`;
        inCode = "node = new Node(value)";
        break;
      case "check-empty":
        says = count === 0 ? "There are no coaches, so the new coach will be the whole train." : "There are coaches already, so the walker must find the last one.";
        inCode = "if (head == null)";
        break;
      case "set-head":
        says = "The new coach is the first and only coach: the front of the train points at it.";
        inCode = "head = node";
        break;
      case "init-current":
        says = `The walker starts at the front coach, ${curVal}.`;
        inCode = "current = head";
        break;
      case "loop":
        says = behind ? `Coach ${curVal} has another coach coupled behind it, so keep walking.` : `Coach ${curVal} has nothing behind it: it is the last coach.`;
        inCode = "while (current.next != null)";
        break;
      case "advance":
        says = `Walk back to the next coach, ${curVal}.`;
        inCode = "current = current.next";
        break;
      case "link-tail":
        says = `Couple the new coach (${value}) behind the last coach (${curVal}).`;
        inCode = "current.next = node";
        break;
      case "finish":
        says = count === 0 ? `Done. The train is just coach ${value}.` : `Done. Coach ${value} is at the back. The walker passed ${count - 1} ${count - 1 === 1 ? "coach" : "coaches"} on the way, so a longer train means a longer walk.`;
        inCode = "return head";
        banner = { kind: "good", text: `Coach ${value} is now at the back.` };
        break;
    }
    return { tones: present(step, tones), actors, says, inCode, banner };
  },
};
