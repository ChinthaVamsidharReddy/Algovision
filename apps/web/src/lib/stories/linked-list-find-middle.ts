import { chainIds, anchorOf, type ChainActor, type ChainFrame, type ChainStory, type Tone } from "./types";
import { spot, valueOf, present } from "./chain-util";

/** A tortoise and a rabbit walk a train from the engine: when the rabbit reaches the last coach, the tortoise is in the middle. */
export const linkedListFindMiddleStory: ChainStory = {
  id: "linked-list-find-middle",
  kind: "linkedList",
  title: "The Middle Coach of the Train",
  emoji: "🚂",
  hook: "A long train has no coach numbers and you may only walk from the engine backwards. You want the coach in the middle without counting them first. A tortoise and a rabbit set off together from the engine. The rabbit takes two coaches for each one the tortoise takes.",
  cast: [
    { emoji: "🚃", name: "Coach", means: "a node in the linked list" },
    { emoji: "🐢", name: "Tortoise", means: "the slow pointer: 1 coach per round" },
    { emoji: "🐇", name: "Rabbit", means: "the fast pointer: 2 coaches per round" },
  ],
  moral: "When the fast runner finishes, the slow runner has covered half the distance. One pass, no counting, and the slow pointer is the middle (the second of the two middles when the length is even).",
  frame(step, trace) {
    const a = anchorOf(step);
    const order = chainIds(trace.steps[0]!.state);
    const slow = spot(step, "slow");
    const fast = spot(step, "fast");
    const tones: Record<string, Tone> = {};
    for (const id of order) tones[id] = "plain";
    if (slow && slow !== "end") tones[slow] = a === "finish" ? "good" : "hit";
    const actors: ChainActor[] = [];
    if (slow) actors.push({ id: "t", emoji: "🐢", name: "Tortoise", node: slow });
    if (fast) actors.push({ id: "r", emoji: "🐇", name: "Rabbit", node: fast });
    const val = (id: string | undefined) => (id && id !== "end" ? valueOf(step, id) : undefined);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = order.length === 0 ? "The train is empty: there is no middle coach." : `A train of ${order.length} coaches. Both animals will start at the engine.`;
        break;
      case "init-pointers":
        says = "Both animals wait together at the first coach.";
        inCode = "slow = head; fast = head";
        break;
      case "loop":
        says = fast === "end" || (fast && fast !== "end" && step.state.nodes.find((n) => n.id === fast)?.next === null) ? "The Rabbit is on the last coach or past it, so the walk will end." : "The Rabbit still has coaches ahead, so both keep walking.";
        inCode = "while (fast != null && fast.next != null)";
        break;
      case "move-slow":
        says = `The Tortoise takes one step, to coach ${val(slow)}.`;
        inCode = "slow = slow.next";
        break;
      case "move-fast":
        says = fast === "end" ? "The Rabbit takes two steps and runs right off the end of the train." : `The Rabbit takes two steps, to coach ${val(fast)}.`;
        inCode = "fast = fast.next.next";
        break;
      case "finish":
        says = `The Rabbit is out of track, and the Tortoise stands on coach ${val(slow)}. That is the middle.`;
        inCode = "return slow";
        banner = { kind: "good", text: `The middle coach holds ${val(slow)}.` };
        break;
    }
    return { tones: present(step, tones), actors, says, inCode, banner };
  },
};
