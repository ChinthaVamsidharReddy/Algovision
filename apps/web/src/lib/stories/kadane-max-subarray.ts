import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";
import type { ArrayTrace } from "./types";

/** Daily profit or loss: which stretch of consecutive days earned the most? */
export const kadaneStory: Story = {
  id: "kadane-max-subarray",
  title: "The Best Streak of Days",
  emoji: "📈",
  hook: "A shop writes down its profit or loss for each day. Which stretch of consecutive days earned the most in total? Walk through the days keeping a running streak. If the streak so far is losing money, it can only drag the next days down, so drop it and start a fresh streak today. Otherwise keep it going. Remember the best streak you have seen.",
  cast: [
    { emoji: "🏃", name: "Today", means: "i: the day being added now" },
    { emoji: "🟨", name: "Current streak", means: "current: the run of days being tracked (yellow)" },
    { emoji: "🏆", name: "Best streak", means: "best: the biggest total seen (green)" },
  ],
  moral: "A streak with a negative total is worth nothing to the future, so throw it away. Then one walk through the days finds the best streak.",
  frame(step, trace: ArrayTrace) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const i = variable(step, "i");
    const current = variable(step, "current");
    const best = variable(step, "best");
    const finished = a === "finish";

    // Replay the run so far to know which days are in the current streak and which in the best one.
    // The "update-best" step runs every round (it is the comparison), so only count it when the best really went up.
    let runStart = 0;
    let bestStart = 0;
    let bestEnd = 0;
    let bestValue = Number.NEGATIVE_INFINITY;
    let improved = false;
    for (const s of trace.steps.slice(0, step.index + 1)) {
      const id = anchorOf(s);
      const at = variable(s, "i");
      improved = false;
      if (id === "init") {
        runStart = 0;
        bestStart = 0;
        bestEnd = 0;
        bestValue = variable(s, "best") ?? bestValue;
      } else if (id === "restart" && at !== null) runStart = at;
      else if (id === "update-best" && at !== null) {
        const b = variable(s, "best");
        if (b !== null && b > bestValue) {
          bestValue = b;
          bestStart = runStart;
          bestEnd = at;
          improved = true;
        }
      }
    }
    const started = !["entry"].includes(a) && n > 0;
    const runEnd = i ?? 0;
    const cells: StoryCell[] = values.map((v, k) => ({
      main: String(v),
      sub: `day ${k + 1}`,
      tone: !started ? "plain" : k >= bestStart && k <= bestEnd ? "good" : !finished && k >= runStart && k <= runEnd ? "hit" : "plain",
    }));
    const actors: StoryFrame["actors"] = [];
    if (!finished && i !== null && i >= 0 && i < n && ["loop", "decide", "restart", "extend", "update-best"].includes(a)) actors.push({ id: "t", emoji: "🏃", name: "Today", at: i });
    const board = !finished && started && current !== null && best !== null ? { label: "Totals", text: `current streak ${current} · best streak ${best}` } : undefined;

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "There are no days to look at." : `${n} days of profit or loss (negative numbers are losses). Find the best stretch of consecutive days.`;
        break;
      case "init":
        says = `Day 1 starts both the current streak and the best streak, at ${current}.`;
        inCode = "current = best = values[0]";
        break;
      case "loop":
        says = `Move on to day ${(i ?? 0) + 1}: ${i !== null ? values[i] : "?"}.`;
        inCode = "for (i = 1; i < n; i++)";
        break;
      case "decide":
        says = current !== null && current < 0 ? `The streak so far totals ${current}: it is losing money. It can only drag the new days down, so drop it.` : `The streak so far totals ${current}: it is not losing money, so keep adding days to it.`;
        inCode = "if (current < 0)";
        break;
      case "restart":
        says = `Start a fresh streak today: it totals ${current}.`;
        inCode = "current = values[i]";
        break;
      case "extend":
        says = `Add today to the streak: it now totals ${current}.`;
        inCode = "current = current + values[i]";
        break;
      case "update-best":
        says = improved ? `${current} beats the old best streak, so this streak (days ${bestStart + 1} to ${bestEnd + 1}) is the new best: ${best}.` : `${current} does not beat the best streak (${best}, days ${bestStart + 1} to ${bestEnd + 1}), so the best stays.`;
        inCode = "best = max(best, current)";
        break;
      case "finish":
        says = `All days are done. The best streak is days ${bestStart + 1} to ${bestEnd + 1}, worth ${best}.`;
        banner = { kind: "good", text: `The best streak earns ${best} (days ${bestStart + 1} to ${bestEnd + 1}).` };
        inCode = "return best";
        break;
    }
    return { cells, actors, says, inCode, banner, board };
  },
};
