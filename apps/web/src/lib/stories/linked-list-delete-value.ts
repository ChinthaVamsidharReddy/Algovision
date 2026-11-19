import { chainIds, anchorOf, type ChainActor, type ChainFrame, type ChainStory, type Tone } from "./types";
import { nextOf, removedIds, spot, valueOf, present } from "./chain-util";

/** A mechanic stands at the coupling before the suspect coach: if it is the one, uncouple it and join its neighbours. */
export const linkedListDeleteValueStory: ChainStory = {
  id: "linked-list-delete-value",
  kind: "linkedList",
  title: "The Mechanic Removes a Coach",
  emoji: "🧑‍🔧",
  hook: "One coach on the train is faulty and must go. A mechanic can only walk forwards, so he stands at the coach before the suspect one. If the next coach is the faulty one he uncouples it and joins the two neighbours together. The first coach has nobody before it, so it is handled separately.",
  cast: [
    { emoji: "🚃", name: "Coach", means: "a node holding a number" },
    { emoji: "🧑‍🔧", name: "Mechanic", means: "prev: the coach just before the one being checked" },
    { emoji: "🗑️", name: "Faulty coach", means: "the node we remove" },
  ],
  moral: "To delete from a linked list, stand one node before the target and make that node skip over it. Remember the special case: if the target is the head, just move the head.",
  frame(step, trace) {
    const a = anchorOf(step);
    const first = trace.steps[0]!;
    const order = chainIds(first.state);
    const gone = removedIds(trace);
    const target = first.variables.find((v) => v.name === "value")?.value;
    const prev = spot(step, "prev");
    const checked = prev && prev !== "end" ? nextOf(step, prev) : undefined;
    const tones: Record<string, Tone> = {};
    for (const id of order) tones[id] = "plain";
    if (prev && prev !== "end") tones[prev] = "hit";
    if (a === "unlink" || a === "delete-head" || a === "finish") for (const id of gone) tones[id] = "warn";
    if (a === "check-head" && order[0]) tones[order[0]] = "hit";
    const actors: ChainActor[] = prev ? [{ id: "m", emoji: "🧑‍🔧", name: "Mechanic", node: prev }] : [];
    const checkedVal = checked ? valueOf(step, checked) : undefined;
    const goneVal = gone.length ? valueOf(first, gone[0]) : undefined;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = `Remove the coach holding ${target} from a train of ${order.length} coaches.`;
        break;
      case "check-empty":
        says = order.length === 0 ? "The train is empty. Nothing to remove." : "The train is not empty, so we can look for the faulty coach.";
        inCode = "if (head == null) return head";
        if (order.length === 0) banner = { kind: "info", text: "The train is empty: nothing was removed." };
        break;
      case "check-head":
        says = `Is the very first coach the faulty one? It holds ${valueOf(step, order[0])}, and we want ${target}.`;
        inCode = "if (head.value == value)";
        break;
      case "delete-head":
        says = `Yes, the first coach is faulty. Uncouple it; the second coach becomes the front.`;
        inCode = "return head.next";
        break;
      case "init-prev":
        says = "Not the first coach. The mechanic stands at the first coach and will check the one after it.";
        inCode = "prev = head";
        break;
      case "loop":
        says = checked ? `The coach after the mechanic holds ${checkedVal}.` : "There is no coach after the mechanic: the end of the train.";
        inCode = "while (prev.next != null && prev.next.value != value)";
        break;
      case "advance":
        says = `Not faulty. The mechanic moves along to the next coach.`;
        inCode = "prev = prev.next";
        break;
      case "check-found":
        says = checked ? `The coach after the mechanic holds ${checkedVal}. That is the faulty one!` : `The mechanic reached the end and found no coach holding ${target}.`;
        inCode = "if (prev.next != null)";
        break;
      case "unlink":
        says = `Uncouple the faulty coach and join its two neighbours together.`;
        inCode = "prev.next = prev.next.next";
        break;
      case "finish":
        if (goneVal !== undefined) {
          says = `Done: the coach holding ${goneVal} is gone and the train closes up.`;
          banner = { kind: "good", text: `Removed the coach holding ${goneVal}.` };
        } else {
          says = `There was no coach holding ${target}, so the train is left as it was.`;
          banner = { kind: "bad", text: `${target} is not on the train: nothing removed.` };
        }
        break;
    }
    return { tones: present(step, tones), actors, says, inCode, banner };
  },
};
