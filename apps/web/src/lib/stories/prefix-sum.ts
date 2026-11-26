import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { sortCells } from "./sort-util";

/** Daily takings turned into a running total, so the sum of any stretch of days is one subtraction away. */
export const prefixSumStory: Story = {
  id: "prefix-sum",
  title: "The Running Total of Takings",
  emoji: "🧮",
  hook: "A shop writes down its takings day by day. A clerk rewrites the list so that each day shows the total so far: the first day stays as it is, and each later day becomes (the total up to yesterday) plus (today's takings). Afterwards, the takings between any two days are found with a single subtraction instead of adding up the days again.",
  cast: [
    { emoji: "🧮", name: "Clerk", means: "i: the day being rewritten" },
    { emoji: "🟢", name: "Running total", means: "a day that already shows the total so far (green)" },
  ],
  moral: "Spend O(n) once to build running totals, and every range sum afterwards is just prefix[j] − prefix[i − 1]: O(1) per question.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const n = step.state.values.length;
    const orig = trace.steps[0]!.state.values;
    const i = variable(step, "i");
    const total = variable(step, "total");
    const cells = sortCells(step, (p) => `day ${p + 1}`);
    const actors: StoryActor[] = i !== null && i < n && ["loop", "accumulate"].includes(a) ? [{ id: "c", emoji: "🧮", name: "Clerk", at: i }] : [];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "There are no days to add up." : `${n} ${n === 1 ? "day" : "days"} of takings. Rewrite them as running totals.`;
        break;
      case "loop":
        says = `Move to day ${(i ?? 0) + 1}. Day ${i} already shows the total so far: ${i !== null ? step.state.values[i - 1] : "?"}.`;
        inCode = "for (i = 1; i < n; i++)";
        break;
      case "accumulate":
        says = `Day ${(i ?? 0) + 1}: the total so far plus today's takings is ${i !== null ? step.state.values[i - 1] : "?"} + ${i !== null ? orig[i] : "?"} = ${total}.`;
        inCode = "values[i] += values[i - 1]";
        break;
      case "finish":
        says = n === 0 ? "Nothing to rewrite." : `Every day now shows the total so far. The takings between day a and day b are the total at b minus the total just before a.`;
        banner = n === 0 ? { kind: "info", text: "Nothing to add up." } : { kind: "good", text: `Running totals: ${step.state.values.join(", ")}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Total so far", text: total === null ? (n > 0 ? String(step.state.values[0]) : "0") : String(total) } };
  },
};
