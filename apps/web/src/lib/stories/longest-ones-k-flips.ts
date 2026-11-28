import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { windowKids } from "./string-util";
import { pl } from "./buy-sell-util";

/** A row of lamps, some dark. At most k dark lamps may be repaired; find the longest stretch that ends up all lit. */
export const longestOnesKFlipsStory: Story = {
  id: "longest-ones-k-flips",
  title: "The Electrician's Repair Coupons",
  emoji: "💡",
  hook: "A street has a row of lamps: 1 is lit and 0 is dark. An electrician holds k repair coupons, so up to k dark lamps may be fixed. What is the longest stretch of lamps that can be all lit? Two kids hold a ribbon over a stretch. The right kid keeps stretching it. Whenever the ribbon covers more dark lamps than there are coupons, the left kid lets go of lamps until it is allowed again.",
  cast: [
    { emoji: "👧", name: "Right kid", means: "right: the newest lamp under the ribbon" },
    { emoji: "👦", name: "Left kid", means: "left: the oldest lamp under the ribbon" },
    { emoji: "🎟️", name: "Repair coupons", means: "k: the dark lamps that may be fixed" },
    { emoji: "🏆", name: "Record", means: "best: the longest stretch so far" },
  ],
  moral: "A sliding window with a budget: grow on the right, and when the window holds more than k zeros, shrink from the left until it is back within budget. Each lamp enters and leaves once: O(n).",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const v = step.state.values;
    const n = v.length;
    const k = variable(step, "k") ?? (typeof trace.input?.k === "number" ? trace.input.k : 0);
    const left = step.state.pointers.left ?? null;
    const right = step.state.pointers.right ?? null;
    const best = variable(step, "best");
    const len = variable(step, "len");
    const inWindow = left !== null && right !== null && left <= right;
    let zeros = 0;
    if (inWindow) for (let i = left; i <= right; i++) if (v[i] === 0) zeros++;
    const roles = new Map(step.highlights.flatMap((h) => (h.target.kind === "index" ? [[h.target.index, h.role] as const] : [])));
    const cells = v.map((x, i) => {
      const r = roles.get(i);
      return { main: x === 1 ? "💡" : "·", sub: x === 1 ? "lit" : "dark", tone: r === "found" ? ("good" as const) : r === "window" ? (x === 0 ? ("warn" as const) : ("hit" as const)) : r === "visited" ? ("dim" as const) : ("plain" as const) };
    });
    const actors = a === "finish" ? [] : windowKids(left, right, n, ["Oldest", "Newest"]);
    const budget = k ?? 0;
    const dark = (c: number) => `${c} dark ${pl(c, "lamp", "lamps")}`;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "There are no lamps at all." : `${n} lamps, and ${budget} repair ${pl(budget, "coupon", "coupons")}. Find the longest stretch that can end up all lit.`;
        break;
      case "init":
        says = "The ribbon starts empty, with no dark lamps under it and a record of 0.";
        inCode = "left = 0; zeros = 0; best = 0";
        break;
      case "expand":
        says = `The right kid stretches the ribbon over lamp ${right} (${v[right ?? 0] === 1 ? "lit" : "dark"}).`;
        inCode = "for (right = 0; right < n; right++)";
        break;
      case "count-zero":
        says = v[right ?? 0] === 0 ? `That lamp is dark, so the ribbon now covers ${dark(zeros)}.` : `That lamp is already lit, so the ribbon still covers ${dark(zeros)}.`;
        inCode = "if (nums[right] == 0) zeros++";
        break;
      case "shrink-check":
        says = zeros > budget ? `${dark(zeros)} is more than the ${budget} ${pl(budget, "repair", "repairs")} allowed, so the left kid must let go of lamps.` : `${dark(zeros)} is within the ${budget} ${pl(budget, "repair", "repairs")} allowed.`;
        inCode = "while (zeros > k)";
        break;
      case "drop":
        says = `The left kid lets go of lamp ${(left ?? 1) - 1} (${v[(left ?? 1) - 1] === 0 ? "dark" : "lit"}). The ribbon now covers ${dark(zeros)}.`;
        inCode = "if (nums[left] == 0) zeros--; left++";
        break;
      case "measure":
        says = left === null || right === null || (len ?? 0) === 0 ? "The ribbon is empty, so the stretch is 0 lamps long." : `The ribbon covers lamps ${left} to ${right}: ${len} in a row once repaired.`;
        inCode = "len = right - left + 1";
        break;
      case "update-best": {
        const improved = [...roles.values()].includes("found");
        says = improved ? `${len} beats the old record, so the longest stretch is now ${best}.` : `${len} does not beat the record, ${best}.`;
        inCode = "best = max(best, len)";
        break;
      }
      case "finish":
        says = n === 0 ? "No lamps, so the longest stretch is 0." : `The longest stretch that can be all lit has ${best} lamps.`;
        banner = { kind: "good", text: `Longest stretch: ${best ?? 0}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Dark lamps under the ribbon · coupons", text: `${zeros} · ${budget}` } };
  },
};
