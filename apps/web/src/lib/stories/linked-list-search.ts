import { chainIds, anchorOf, type ChainActor, type ChainFrame, type ChainStory, type Tone } from "./types";
import { spot, valueOf, present } from "./chain-util";

/** A detective checking one coach after another for the passenger carrying a number. */
export const linkedListSearchStory: ChainStory = {
  id: "linked-list-search",
  kind: "linkedList",
  title: "Finding a Passenger on the Train",
  emoji: "🕵️",
  hook: "You are looking for the passenger who holds a particular number. The train has no map, so you start in the first coach and check each coach in turn, moving backwards one at a time. You stop as soon as you find them, or when the train runs out.",
  cast: [
    { emoji: "🚃", name: "Coach", means: "a node holding a number" },
    { emoji: "🕵️", name: "Detective", means: "current: the coach being checked" },
    { emoji: "🔢", name: "Index", means: "how many coaches you have passed" },
  ],
  moral: "Linked lists have no shortcuts: you can only follow the chain. Search is one coach at a time, so the worst case is the whole train.",
  frame(step, trace) {
    const a = anchorOf(step);
    const order = chainIds(trace.steps[0]!.state);
    const target = trace.steps[0]!.variables.find((v) => v.name === "value")?.value;
    const cur = spot(step, "current");
    const tones: Record<string, Tone> = {};
    const idx = step.variables.find((v) => v.name === "index")?.value;
    order.forEach((id, i) => {
      tones[id] = typeof idx === "number" && i < idx && a !== "found" ? "dim" : "plain";
    });
    if (cur && cur !== "end") tones[cur] = a === "found" ? "good" : "hit";
    const actors: ChainActor[] = cur ? [{ id: "d", emoji: "🕵️", name: "Detective", node: cur }] : [];
    const val = valueOf(step, cur);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = `Looking for the passenger with number ${target} on a train of ${order.length} coaches.`;
        break;
      case "init-index":
        says = "Nobody has been checked yet: the count is 0.";
        inCode = "index = 0";
        break;
      case "init-current":
        says = "The detective boards the first coach.";
        inCode = "current = head";
        break;
      case "loop":
        says = cur === "end" ? "The detective has walked off the end of the train." : `Still more coaches to check, so the search goes on.`;
        inCode = "while (current != null)";
        break;
      case "compare":
        says = `Coach ${idx} holds ${val}. Is it ${target}? ${val === target ? "Yes!" : "No."}`;
        inCode = "if (current.value == value)";
        break;
      case "advance":
        says = cur === "end" ? "No match, and there is no coach behind this one." : `Not this one. On to the next coach, which holds ${val}.`;
        inCode = "current = current.next";
        break;
      case "found":
        says = `Found! Coach number ${idx} holds ${target}.`;
        inCode = "return index";
        banner = { kind: "good", text: `Found ${target} in coach number ${idx} (counting from 0).` };
        break;
      case "not-found":
        says = `The detective checked every coach and ${target} is not on the train.`;
        inCode = "return -1";
        banner = { kind: "bad", text: `${target} is not in the list.` };
        break;
    }
    return { tones: present(step, tones), actors, says, inCode, banner };
  },
};
