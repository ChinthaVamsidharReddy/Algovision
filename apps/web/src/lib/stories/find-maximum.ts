import { anchorOf, variable, type Story, type StoryActor, type StoryCell, type StoryFrame } from "./types";
import { barsOf } from "./ledger-util";

/** The tallest person in a line: walk along once, keeping a flag on the tallest seen so far. */
export const findMaximumStory: Story = {
  id: "find-maximum",
  title: "The Tallest in the Line",
  emoji: "🏆",
  hook: "People stand in a line and you want the tallest. You walk along the line once. The first person is the tallest so far. Each time you meet somebody taller than the current champion, the trophy moves to them. At the end of the line, whoever holds the trophy is the tallest.",
  cast: [
    { emoji: "🚶", name: "Walker", means: "i: the person being measured now" },
    { emoji: "🏆", name: "Trophy", means: "best: the tallest seen so far" },
  ],
  moral: "To find the maximum you must look at every value once, and the only thing to remember is the best so far. That is O(n) time and O(1) extra space.",
  frame(step): StoryFrame {
    const a = anchorOf(step);
    const values = step.state.values;
    const n = values.length;
    const i = variable(step, "i");
    const best = variable(step, "best");
    const bestIndex = variable(step, "bestIndex");
    const bars = barsOf(values);
    const cells: StoryCell[] = values.map((v, k) => ({
      main: String(v),
      sub: `person ${k + 1}`,
      bar: bars[k],
      tone: k === bestIndex ? "good" : i !== null && k === i && a !== "finish" ? (a === "compare" ? "warn" : "hit") : "plain",
    }));
    const actors: StoryActor[] = [];
    if (bestIndex !== null && bestIndex < n) actors.push({ id: "t", emoji: "🏆", name: "Trophy", at: bestIndex, row: "bottom" });
    if (i !== null && i < n && a !== "finish" && i !== bestIndex) actors.push({ id: "w", emoji: "🚶", name: "Walker", at: i });
    const here = i !== null && i < n ? values[i]! : null;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `${n} ${n === 1 ? "person" : "people"} in the line. Who is the tallest?`;
        break;
      case "init-max":
        says = `The first person (${best}) holds the trophy to start with.`;
        inCode = "best = values[0]";
        break;
      case "loop":
        says = `Next in line: person ${(i ?? 0) + 1}, height ${here}.`;
        inCode = "for (i = 1; i < n; i++)";
        break;
      case "compare":
        says = here !== null && best !== null && here > best ? `${here} is taller than the champion (${best}).` : `${here} is not taller than the champion (${best}), so the trophy stays.`;
        inCode = "if (values[i] > best)";
        break;
      case "update":
        says = `The trophy moves to person ${(bestIndex ?? 0) + 1}, height ${best}.`;
        inCode = "best = values[i]";
        break;
      case "finish":
        says = `The end of the line. The trophy is with person ${(bestIndex ?? 0) + 1}, height ${best}.`;
        banner = { kind: "good", text: `The tallest is ${best}, person ${(bestIndex ?? 0) + 1}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Champion so far", text: best === null ? "nobody yet" : `${best} (person ${(bestIndex ?? 0) + 1})` } };
  },
};
