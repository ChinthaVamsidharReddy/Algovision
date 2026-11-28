import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { roleTone } from "./ledger-util";
import { rolesOf } from "./string-util";

/** Matching socks cancel in the washing basket; the odd sock is what remains. */
export const singleNumberXorStory: Story = {
  id: "single-number-xor",
  title: "The Odd Sock Out",
  emoji: "🧦",
  hook: "A basket holds socks, every kind twice except one. A magic basket has a rule: when a sock joins its twin, both vanish. So drop the socks in one at a time, and when you are done, the one sock still sitting there is the odd one out. XOR is that magic basket: a number XOR itself is 0, and 0 XOR a number is that number.",
  cast: [
    { emoji: "🧦", name: "Sock", means: "i: the value being dropped in" },
    { emoji: "🧺", name: "Magic basket", means: "x: the running XOR; matched pairs have vanished" },
  ],
  moral: "XOR-ing every value cancels each pair (a XOR a = 0) and leaves the single one, in one pass and O(1) extra space, with no counting table.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const v = step.state.values;
    const n = v.length;
    const i = variable(step, "i");
    const x = variable(step, "x") ?? 0;
    const roles = rolesOf(step);
    const cells = v.map((s, k) => ({ main: String(s), sub: `sock ${k + 1}`, tone: roleTone(roles.get(k)) }));
    const actors: StoryActor[] = i !== null && i < n && a === "xor" ? [{ id: "s", emoji: "🧦", name: "Sock", at: i }] : [];
    const val = i !== null ? (v[i] ?? 0) : 0;
    let seen = 0;
    if (i !== null) for (let k = 0; k <= i; k++) if (v[k] === val) seen++;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `${n} socks, every kind in pairs except one. Drop them into the magic basket one by one: a sock meeting its twin makes both vanish.`;
        break;
      case "init":
        says = "The basket starts empty: x is 0.";
        inCode = "x = 0";
        break;
      case "xor":
        says = `Drop in sock ${val}. ${seen % 2 === 0 ? `Its twin was already there, so the pair cancels out` : `No twin is waiting, so it stays`}. The basket now holds ${x}.`;
        inCode = "x ^= nums[i]";
        break;
      case "finish":
        says = `Every pair has vanished. The one sock left, ${x}, is the odd one out.`;
        banner = { kind: "good", text: `The odd one out is ${x}.` };
        break;
    }
    void trace;
    return { cells, actors, says, inCode, banner, board: { label: "Basket (running XOR)", text: String(x) } };
  },
};
