import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { inRange, letterCells, letterOf, plural, previousVariable } from "./string-util";

/** A shorthand writer replaces each run of equal letters by the letter and the run length (a run of one stays a single letter). */
export const stringCompressionStory: Story = {
  id: "string-compression-length",
  title: "The Shorthand Writer",
  emoji: "✍️",
  hook: "A writer has a long line of letters and wants to save ink. Every run of the same letter is written as the letter followed by how many there are: 'aaab' becomes 'a3b'. A letter that stands alone is just written as itself. The writer walks along the line, finds where each run starts and how long it is, writes it, and jumps to the next run.",
  cast: [
    { emoji: "✍️", name: "Writer", means: "i: the start of the current run" },
    { emoji: "🔁", name: "Run", means: "a stretch of equal letters" },
    { emoji: "📏", name: "Ink used", means: "total: the length of the shorthand so far" },
  ],
  moral: "Run-length compression reads the text once: find the end of each run, write the letter and (for runs longer than one) the count, and move on. The total is the sum of 1 + digits-of-count per run.",
  frame(step, trace): StoryFrame {
    const codes = step.state.values;
    const n = codes.length;
    const a = anchorOf(step);
    const i = variable(step, "i");
    const run = variable(step, "run") ?? 0;
    const total = variable(step, "total") ?? 0;
    const prevTotal = previousVariable(trace.steps, step, "total") ?? 0;
    // The shorthand written so far, replayed from the emit steps.
    let written = "";
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (s.source.kind === "anchor" && s.source.id === "emit") {
        const idx = variable(s, "i");
        const r = variable(s, "run") ?? 1;
        written += letterOf(s.state.values, idx) + (r > 1 ? String(r) : "");
      }
    }
    const cells = letterCells(step, (_, role) => (role === "found" ? "good" : role === "window" ? "hit" : "plain"));
    const actors = inRange(i, n) && a !== "finish" ? [{ id: "w", emoji: "✍️", name: "Writer", at: i, row: "bottom" as const }] : [];
    const ch = letterOf(codes, i);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "The line is empty, so there is nothing to write." : "Write each run of equal letters as the letter and then the run length. A run of one is just the letter. How long is the shorthand?";
        break;
      case "init":
        says = "Nothing is written yet: the shorthand has length 0.";
        inCode = "total = 0";
        break;
      case "run":
        says = `A run of "${ch}" starts at place ${(i ?? 0) + 1} and is ${run} ${plural(run, "letter", "letters")} long.`;
        inCode = "j = i; while (j < n && s[j] == s[i]) j++";
        break;
      case "emit":
        says = run === 1 ? `Write "${ch}" alone: 1 character. The shorthand is now ${total} long.` : `Write "${ch}${run}": ${total - prevTotal} characters. The shorthand is now ${total} long.`;
        inCode = "total += 1 + digits(run) (or just 1 for a run of one)";
        break;
      case "finish": {
        const r = variable(step, "result") ?? total;
        says = n === 0 ? "There was nothing to write." : "Every run has been written.";
        banner = n === 0 ? { kind: "info", text: "The line was empty, so the shorthand has length 0." } : { kind: "good", text: `The shorthand "${written}" is ${r} characters long.` };
        break;
      }
    }
    return { cells, actors, says, inCode, banner, board: { label: "Shorthand so far", text: written === "" ? "nothing yet" : `${written}  (${total} characters)` } };
  },
};
