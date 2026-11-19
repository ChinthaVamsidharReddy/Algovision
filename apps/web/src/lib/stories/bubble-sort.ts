import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** Kids sorting themselves by height: neighbours swap if the left one is taller, so the tallest bubbles to the back. */
export const bubbleSortStory: Story = {
  id: "bubble-sort",
  title: "Bubbling Up the Tallest Kid",
  emoji: "🫧",
  hook: "Kids stand in a line and must end up from shortest to tallest (the numbers are heights). A teacher walks along the line comparing two neighbours at a time. If the left kid is taller, the two swap places. After one walk, the tallest kid has bubbled all the way to the back, like an air bubble rising. Walk again over the shorter line that is left.",
  cast: [
    { emoji: "👧", name: "Left kid", means: "the kid at index j" },
    { emoji: "👦", name: "Right kid", means: "the kid at index j + 1" },
    { emoji: "🫧", name: "Bubble", means: "the biggest value of this pass, carried to the back by swaps" },
    { emoji: "✅", name: "Settled kids", means: "values after index end: already in their final places" },
  ],
  moral: "Each pass carries the biggest remaining value to the end of the line, so the unsorted part shrinks by one every pass.",
  frame(step) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const end = variable(step, "end");
    const j = variable(step, "j");
    const left = variable(step, "values[j]");
    const right = variable(step, "values[j+1]");
    const finished = a === "finish";
    const ok = (i: number | null): i is number => i !== null && i >= 0 && i < n;
    const pair = ok(j) && j + 1 < n && ["inner-loop", "compare", "swap"].includes(a);

    const cells: StoryCell[] = values.map((v, i) => ({
      main: String(v),
      sub: `place ${i + 1}`,
      tone: finished || (end !== null && i > end) ? "good" : pair && (i === j || i === j! + 1) ? "hit" : "plain",
    }));
    const actors: StoryFrame["actors"] = [];
    if (pair) actors.push({ id: "l", emoji: "👧", name: "Left", at: j! }, { id: "r", emoji: "👦", name: "Right", at: j! + 1 });

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n < 2 ? "With fewer than two kids the line is already sorted." : `${n} kids stand in a line. The teacher will compare neighbours and swap the ones in the wrong order.`;
        break;
      case "outer-loop":
        says = end !== null && end < n - 1 ? `A new pass begins over places 1 to ${end + 1}. The ${n - 1 - end} tallest kid${n - 1 - end === 1 ? " is" : "s are"} already settled at the back (green).` : `A new pass begins over the whole line. Nobody is settled yet.`;
        inCode = "for (end = n - 1; end > 0; end--)";
        break;
      case "inner-loop":
        says = `The teacher looks at the kids at places ${(j ?? 0) + 1} and ${(j ?? 0) + 2}.`;
        inCode = "for (j = 0; j < end; j++)";
        break;
      case "compare":
        says = left !== null && right !== null ? (left > right ? `${left} is taller than ${right}, so they are in the wrong order.` : `${left} is not taller than ${right}, so they are already in the right order. Nobody swaps.`) : says;
        inCode = "if (values[j] > values[j + 1])";
        break;
      case "swap":
        says = `They swap places: the taller kid (${right}) steps one place back. Taller kids keep getting carried along like a bubble.`;
        inCode = "swap(values[j], values[j + 1])";
        break;
      case "finish":
        says = "Every pass is done, so the whole line stands from shortest to tallest.";
        banner = { kind: "good", text: "Sorted from shortest to tallest." };
        inCode = "// all passes done";
        break;
    }
    return { cells, actors, says, inCode, banner };
  },
};
