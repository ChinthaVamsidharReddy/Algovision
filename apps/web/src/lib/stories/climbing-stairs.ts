import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { cellAt, helperAt, tableCells } from "./dp-util";

/** Every stair can only be reached from the stair below or the one two below, so its ways are the sum of theirs. */
export const climbingStairsStory: Story = {
  id: "climbing-stairs",
  title: "The Staircase Climber",
  emoji: "🪜",
  hook: "A child climbs a staircase and may take one stair or two stairs at a time. To land on stair 5, the last move came either from stair 4 (one step) or from stair 3 (a jump of two). So the number of ways to reach stair 5 is the ways to reach stair 4 plus the ways to reach stair 3. The child writes each answer on a chalk table so nothing is counted twice.",
  cast: [
    { emoji: "🧗", name: "Climber", means: "i: the stair being worked out" },
    { emoji: "📋", name: "Chalk table", means: "dp[i]: the number of ways to reach stair i" },
    { emoji: "➕", name: "Add", means: "ways(i) = ways(i - 1) + ways(i - 2)" },
  ],
  moral: "When an answer is built from smaller answers of the same kind, write each one down once and add. Climbing stairs, like Fibonacci, needs only the two answers just before it.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const n = Number(trace.input?.n ?? 0);
    const i = variable(step, "i");
    const v = step.state.values;
    const result = variable(step, "result");
    const cells = tableCells(step, trace, (p) => (p === 0 ? "ground" : `stair ${p}`));
    const actors = ["loop", "fill"].includes(a) ? helperAt("🧗", "Climber", i, v.length) : [];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `A staircase of ${n} ${n === 1 ? "stair" : "stairs"}. The climber takes one or two stairs at a time. How many different ways are there to reach the top?`;
        break;
      case "init-table":
        says = n === 1 ? "There is only one way to reach stair 1: a single step." : "The easy stairs first. Stair 1 can be reached in 1 way, and stair 2 in 2 ways (1 + 1, or one jump of 2).";
        inCode = "dp[1] = 1; dp[2] = 2;";
        break;
      case "loop":
        says = `Now stair ${i}. The climber could only have come from stair ${(i ?? 1) - 1} (one step) or from stair ${(i ?? 2) - 2} (a jump of two).`;
        inCode = "for (i = 3; i <= n; i++)";
        break;
      case "fill":
        says = `${cellAt(step, (i ?? 2) - 1)} ways to reach stair ${(i ?? 1) - 1} plus ${cellAt(step, (i ?? 2) - 2)} ways to reach stair ${(i ?? 2) - 2} gives ${cellAt(step, i ?? 0)} ways to reach stair ${i}. Chalk it on the table.`;
        inCode = "dp[i] = dp[i - 1] + dp[i - 2]";
        break;
      case "base-case":
        says = n === 1 ? "With one stair there is only one way: a single step. No table is needed." : "With two stairs there are two ways: 1 + 1, or one jump of 2. No table is needed.";
        banner = { kind: "good", text: `There ${result === 1 ? "is 1 way" : `are ${result} ways`} to climb ${n} ${n === 1 ? "stair" : "stairs"}.` };
        break;
      case "finish":
        says = `The table is done. The top, stair ${n}, can be reached in ${result} ${result === 1 ? "way" : "ways"}.`;
        banner = { kind: "good", text: `There ${result === 1 ? "is 1 way" : `are ${result} ways`} to climb ${n} ${n === 1 ? "stair" : "stairs"}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Ways to reach the latest stair", text: result === null ? "–" : String(result) } };
  },
};
