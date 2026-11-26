import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { listOf, sortCells } from "./sort-util";

/** Seating people by height, first comparing people far apart so big mistakes are fixed early, then closer and closer. */
export const shellSortStory: Story = {
  id: "shell-sort",
  title: "Sorting Across the Gaps",
  emoji: "🪑",
  hook: "Putting people in height order by swapping only neighbours is slow when a very tall person sits at the far end. So first sort the people who are a big gap apart (every 2nd or 3rd seat), which sends the tall ones far to the right in a single move. Then shrink the gap and repeat. The last pass, with a gap of 1, is ordinary insertion sort, but on a row that is already almost in order.",
  cast: [
    { emoji: "✋", name: "In hand", means: "i / temp: the person picked up to be placed" },
    { emoji: "🔎", name: "Looking back", means: "j: the seat being compared, a gap to the left" },
    { emoji: "↔️", name: "Gap", means: "gap: how many seats apart the compared people are" },
  ],
  moral: "Shell sort is insertion sort on widely spaced seats first. Big gaps fix large disorder cheaply, so when the gap reaches 1 almost nothing is left to move. It is usually much faster than plain insertion sort.",
  frame(step): StoryFrame {
    const a = anchorOf(step);
    const values = step.state.values;
    const n = values.length;
    const gap = variable(step, "gap");
    const i = variable(step, "i");
    const j = variable(step, "j");
    const temp = variable(step, "temp");
    const cells = sortCells(step, (p) => `seat ${p + 1}`);
    const actors: StoryActor[] = [];
    if (i !== null && i < n && ["pick"].includes(a)) actors.push({ id: "i", emoji: "✋", name: "In hand", at: i });
    if (j !== null && j < n && ["compare", "shift", "place"].includes(a)) actors.push({ id: "j", emoji: "🔎", name: "Looking", at: j, row: "bottom" });
    const back = j !== null && gap !== null ? j - gap : null;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `${n} ${n === 1 ? "person" : "people"} to seat by height. Start by comparing people who sit far apart.`;
        break;
      case "gap-loop":
        says = gap === 1 ? "Gap 1: now only neighbours are compared. This is ordinary insertion sort, but the row is nearly in order already." : `Gap ${gap}: only compare people ${gap} seats apart. Each chain of every ${gap}th seat is sorted on its own.`;
        inCode = "for (gap = n / 2; gap > 0; gap /= 2)";
        break;
      case "pick":
        says = `Pick up ${temp} from seat ${(i ?? 0) + 1}. It will slide back along the seats that are ${gap} apart until it fits.`;
        inCode = "temp = values[i]";
        break;
      case "compare":
        if (back === null || back < 0) says = `There is no seat ${gap} places to the left of seat ${(j ?? 0) + 1}, so the search stops.`;
        else if (values[back]! > (temp ?? 0)) says = `${values[back]} (seat ${back + 1}) is taller than ${temp}, so it has to move ${gap} ${gap === 1 ? "seat" : "seats"} to the right.`;
        else says = `${values[back]} (seat ${back + 1}) is no taller than ${temp}, so ${temp} belongs at seat ${(j ?? 0) + 1}.`;
        inCode = "while (j >= gap && values[j - gap] > temp)";
        break;
      case "shift":
        says = `${values[j ?? 0]} moves from seat ${(j ?? 0) - (gap ?? 0) + 1} to seat ${(j ?? 0) + 1}, leaving a gap behind.`;
        inCode = "values[j] = values[j - gap]";
        break;
      case "place":
        says = `${temp} sits down at seat ${(j ?? 0) + 1}.`;
        inCode = "values[j] = temp";
        break;
      case "finish":
        says = `Gap 1 is done. The row is in order: ${listOf(values)}.`;
        banner = values.length === 0 ? { kind: "info", text: "Nothing to sort." } : { kind: "good", text: `Sorted: ${values.join(", ")}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: gap === null ? "Gap" : "Gap · in hand", text: gap === null ? "not chosen yet" : `${gap}${temp !== null && ["pick", "compare", "shift", "place"].includes(a) ? ` · ${temp}` : ""}` } };
  },
};
