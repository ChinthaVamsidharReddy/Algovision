import { chainIds, anchorOf, type ChainActor, type ChainFrame, type ChainStory, type Tone } from "./types";
import { removedIds, spot, valueOf, present } from "./chain-util";

/** Two runners joined by a rope n coaches long: when the front runner reaches the end, the back runner is right before the coach to remove. */
export const linkedListRemoveNthStory: ChainStory = {
  id: "linked-list-remove-nth-from-end",
  kind: "linkedList",
  title: "Two Runners and a Rope",
  emoji: "🪢",
  hook: "You must remove the coach that is n-th from the back of a train, but you only know the engine end. Two runners start at the engine. First the front runner runs n coaches ahead and the gap stays fixed from then on. When the front runner reaches the last coach, the back runner stands right before the coach to remove.",
  cast: [
    { emoji: "🏃", name: "Front runner", means: "fast: runs ahead first, then keeps the gap" },
    { emoji: "🚶", name: "Back runner", means: "slow: waits, then follows at the same speed" },
    { emoji: "🪢", name: "Rope", means: "the gap of n coaches between them" },
    { emoji: "🗑️", name: "Removed coach", means: "the coach uncoupled from the train" },
  ],
  moral: "Fix a gap of n between two pointers and move both together: when the front one hits the end, the back one is exactly n from the end. One pass, no length needed.",
  frame(step, trace) {
    const a = anchorOf(step);
    const order = chainIds(trace.steps[0]!.state);
    const gone = removedIds(trace);
    const slow = spot(step, "slow");
    const fast = spot(step, "fast");
    const tones: Record<string, Tone> = {};
    for (const id of order) tones[id] = "plain";
    if (slow && slow !== "end") tones[slow] = "hit";
    if (a === "unlink" || a === "remove-head" || a === "finish") for (const id of gone) tones[id] = "warn";
    const actors: ChainActor[] = [];
    if (slow) actors.push({ id: "b", emoji: "🚶", name: "Back", node: slow });
    if (fast) actors.push({ id: "f", emoji: "🏃", name: "Front", node: fast });
    const n = step.variables.find((v) => v.name === "n")?.value ?? trace.steps[0]!.variables.find((v) => v.name === "n")?.value;
    const val = (id: string | undefined) => (id && id !== "end" ? valueOf(step, id) : undefined);
    const removedVal = gone.length ? valueOf(trace.steps[0]!, gone[0]) : undefined;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = `A train of ${order.length} coaches. Remove the coach that is number ${n} from the back.`;
        break;
      case "init-pointers":
        says = "Both runners start at the engine, the first coach.";
        inCode = "slow = head; fast = head";
        break;
      case "gap-loop":
        says = `The front runner must open a gap of ${n} coaches. Count so far: ${step.variables.find((v) => v.name === "i")?.value}.`;
        inCode = "for (i = 0; i < n; i++)";
        break;
      case "gap-advance":
        says = fast === "end" ? "The front runner steps off the end of the train: the gap is as long as the whole train." : `The front runner steps ahead, to coach ${val(fast)}. The back runner waits.`;
        inCode = "fast = fast.next";
        break;
      case "check-head":
        says = fast === "end" ? "The front runner ran past the end, so the coach to remove is the very first one: the engine." : "The front runner is still on the train, so the coach to remove is further back.";
        inCode = "if (fast == null) return head.next";
        break;
      case "remove-head":
        says = `Uncouple the first coach (${removedVal}). The train now starts with the next one.`;
        inCode = "return head.next";
        break;
      case "loop":
        says = "Is the front runner on the last coach yet? If not, both take another step.";
        inCode = "while (fast.next != null)";
        break;
      case "move-fast":
        says = `The front runner steps ahead, to coach ${val(fast)}.`;
        inCode = "fast = fast.next";
        break;
      case "move-slow":
        says = `The back runner steps ahead too, to coach ${val(slow)}. The rope stays the same length.`;
        inCode = "slow = slow.next";
        break;
      case "unlink":
        says = `The front runner is on the last coach, so the coach right after the back runner is the one to remove (${removedVal}). Couple the back runner to the coach after it.`;
        inCode = "slow.next = slow.next.next";
        break;
      case "finish":
        says = removedVal === undefined ? "Nothing to remove." : `Done: the coach holding ${removedVal} is gone and the train closes up.`;
        banner = { kind: "good", text: removedVal === undefined ? "The train is unchanged." : `Removed the coach holding ${removedVal}.` };
        break;
    }
    return { tones: present(step, tones), actors, says, inCode, banner };
  },
};
