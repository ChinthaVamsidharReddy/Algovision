import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { cellAt, helperAt, tableCells } from "./dp-util";

/** A notebook where each new line is the sum of the two lines above it, written once and never recomputed. */
export const fibonacciDpStory: Story = {
  id: "fibonacci-dp",
  title: "The Notebook Where Nothing Is Worked Out Twice",
  emoji: "📓",
  hook: "Remember the helpers who kept asking the same small questions? Here a student keeps a notebook instead. Line 0 says 0 and line 1 says 1. Every new line is just the sum of the two lines above it, so each line is worked out exactly once, from lines already written.",
  cast: [
    { emoji: "✍️", name: "Student", means: "i: the notebook line being written" },
    { emoji: "📓", name: "Notebook", means: "dp[i]: Fibonacci(i), written once" },
    { emoji: "➕", name: "Sum", means: "the two lines just above" },
  ],
  moral: "Write each answer down the first time you work it out. The recursive version needed an exponential number of calls; this notebook needs one line per number, so O(n).",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const n = Number(trace.input?.n ?? 0);
    const i = variable(step, "i");
    const result = variable(step, "result");
    const cells = tableCells(step, trace, (p) => `line ${p}`);
    const actors = ["loop", "fill"].includes(a) ? helperAt("✍️", "Student", i, step.state.values.length) : [];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `Find Fibonacci(${n}). Instead of asking the same questions again and again, keep a notebook with one line per number.`;
        break;
      case "init-table":
        says = n === 0 ? "Line 0 says 0. That is the whole notebook." : "Write the two starting lines: line 0 is 0 and line 1 is 1.";
        inCode = "dp[0] = 0; dp[1] = 1;";
        break;
      case "loop":
        says = `Next is line ${i}. Look at the two lines just above it, lines ${(i ?? 2) - 1} and ${(i ?? 2) - 2}.`;
        inCode = "for (i = 2; i <= n; i++)";
        break;
      case "fill":
        says = `${cellAt(step, (i ?? 2) - 1)} + ${cellAt(step, (i ?? 2) - 2)} = ${cellAt(step, i ?? 0)}. Write it on line ${i}; it will never be worked out again.`;
        inCode = "dp[i] = dp[i - 1] + dp[i - 2]";
        break;
      case "base-case":
        says = `Fibonacci(${n}) is simply ${result}, so no notebook is needed.`;
        banner = { kind: "good", text: `Fibonacci(${n}) = ${result}.` };
        break;
      case "finish":
        says = `The last line holds the answer: Fibonacci(${n}) = ${result}. Every line was worked out once.`;
        banner = { kind: "good", text: `Fibonacci(${n}) = ${result}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Latest line", text: result === null ? "–" : String(result) } };
  },
};
