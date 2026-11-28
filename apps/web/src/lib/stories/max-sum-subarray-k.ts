import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { windowKids } from "./string-util";
import { pl } from "./buy-sell-util";

/** A frame of exactly k days slides along the sales; each slide drops one day and adds one instead of re-adding all k. */
export const maxSumSubarrayKStory: Story = {
  id: "max-sum-subarray-k",
  title: "The Sliding Photo Frame",
  emoji: "🖼️",
  hook: "A shop lists its takings day by day. Which k days in a row earned the most? Adding up k days for every starting day repeats a lot of work. Instead, a frame that is exactly k days wide slides along the list. Each slide, one day leaves on the left and one joins on the right, so the new total is the old total minus the day that left plus the day that came in.",
  cast: [
    { emoji: "👧", name: "Right kid", means: "right: the newest day in the frame" },
    { emoji: "👦", name: "Left kid", means: "left: the oldest day in the frame" },
    { emoji: "🖼️", name: "Frame", means: "the k days being added" },
    { emoji: "🏆", name: "Record", means: "best: the biggest total seen so far" },
  ],
  moral: "A fixed-size sliding window: keep the running total, and slide by subtracting the value that leaves and adding the value that enters. Every day is added once and removed once, so O(n).",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const v = step.state.values;
    const n = v.length;
    const k = variable(step, "k") ?? (typeof trace.input?.k === "number" ? trace.input.k : 0);
    const left = step.state.pointers.left ?? null;
    const right = step.state.pointers.right ?? null;
    const sum = variable(step, "windowSum");
    const best = variable(step, "best");
    const roles = new Map(step.highlights.flatMap((h) => (h.target.kind === "index" ? [[h.target.index, h.role] as const] : [])));
    const cells = v.map((x, i) => {
      const r = roles.get(i);
      return { main: String(x), sub: `day ${i + 1}`, tone: r === "found" ? ("good" as const) : r === "window" ? ("hit" as const) : r === "active" ? ("warn" as const) : r === "visited" ? ("dim" as const) : ("plain" as const) };
    });
    const actors = a === "finish" ? [] : windowKids(left, right, n, ["Oldest", "Newest"]);
    const entered = step.highlights.find((h) => h.label === "in");
    const enteredIdx = entered && entered.target.kind === "index" ? entered.target.index : null;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `Find the best ${k} days in a row among ${n} days of takings. Slide a frame ${k} days wide instead of re-adding every time.`;
        break;
      case "init-sum":
        says = "The frame is empty, so the total starts at 0.";
        inCode = "windowSum = 0";
        break;
      case "first-window":
        says = `Fill the first frame: add day ${(right ?? 0) + 1}, worth ${v[right ?? 0]}. The total is ${sum}.`;
        inCode = "windowSum += nums[i]";
        break;
      case "init-best":
        says = `The first frame, days ${(left ?? 0) + 1} to ${(right ?? 0) + 1}, totals ${sum}. That is the best so far.`;
        inCode = "best = windowSum";
        break;
      case "slide":
        says = `Slide the frame one day right: it now covers days ${(left ?? 0) + 1} to ${(right ?? 0) + 1}.`;
        inCode = "for (i = k; i < n; i++)";
        break;
      case "update-sum":
        says = `Day ${(left ?? 0)} leaves (worth ${v[(left ?? 1) - 1]}) and day ${(enteredIdx ?? right ?? 0) + 1} comes in (worth ${v[enteredIdx ?? right ?? 0]}). The new total is ${sum}.`;
        inCode = "windowSum += nums[i] - nums[i - k]";
        break;
      case "compare":
        says = (sum ?? 0) > (best ?? 0) ? `${sum} is more than the best so far, ${best}. A new record!` : `${sum} does not beat the best so far, ${best}.`;
        inCode = "if (windowSum > best)";
        break;
      case "new-best":
        says = `Write down ${best} as the new record.`;
        inCode = "best = windowSum";
        break;
      case "finish":
        says = `The best ${k} ${pl(k, "day", "days")} in a row are days ${(left ?? 0) + 1} to ${(right ?? 0) + 1}, totalling ${best}.`;
        banner = { kind: "good", text: `Best total: ${best}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Frame total · record", text: `${sum ?? "–"} · ${best ?? "–"}` } };
  },
};
