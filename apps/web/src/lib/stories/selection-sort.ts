import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** A teacher scans the whole line for the shortest kid and swaps that kid into the next front place. */
export const selectionSortStory: Story = {
  id: "selection-sort",
  title: "Picking the Shortest Kid",
  emoji: "🔦",
  hook: "Kids stand in a line and must end up from shortest to tallest (the numbers are heights). The teacher shines a torch along the line from the next free front place to the end, remembering the shortest kid seen. When the scan ends, that kid swaps with the kid at the front place. Then the front place moves one step forward.",
  cast: [
    { emoji: "📍", name: "Front place", means: "i: the next place that will get its final kid" },
    { emoji: "🔦", name: "Torch", means: "j: the kid being looked at right now" },
    { emoji: "🏆", name: "Shortest so far", means: "min: the index of the smallest value seen in this scan" },
    { emoji: "✅", name: "Settled kids", means: "everything left of the front place: already final" },
  ],
  moral: "Each scan finds the smallest value that is left and puts it in its final place, so the sorted part grows by one every pass.",
  frame(step) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const i = variable(step, "i");
    const min = variable(step, "min");
    const j = variable(step, "j");
    const finished = a === "finish";
    const ok = (x: number | null): x is number => x !== null && x >= 0 && x < n;

    const cells: StoryCell[] = values.map((v, k) => ({
      main: String(v),
      sub: `place ${k + 1}`,
      tone: finished || (i !== null && (k < i || (a === "swap" && k === i))) ? "good" : ok(min) && k === min && !["outer-loop", "swap"].includes(a) ? "hit" : "plain",
    }));
    const actors: StoryFrame["actors"] = [];
    if (!finished) {
      if (ok(i)) actors.push({ id: "i", emoji: "📍", name: "Front", at: i });
      if (ok(j) && ["inner-loop", "compare", "new-min"].includes(a)) actors.push({ id: "j", emoji: "🔦", name: "Torch", at: j });
      if (ok(min) && ["init-min", "inner-loop", "compare", "new-min"].includes(a)) actors.push({ id: "m", emoji: "🏆", name: "Shortest", at: min });
    }
    const vj = ok(j) ? values[j]! : null;
    const vm = ok(min) ? values[min]! : null;

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n < 2 ? "With fewer than two kids the line is already sorted." : `${n} kids stand in a line. For each front place, the teacher will find the shortest kid still unplaced.`;
        break;
      case "outer-loop":
        says = `The Front place is now place ${(i ?? 0) + 1}. Everything before it (green) is final. Find the shortest kid from here to the end.`;
        inCode = "for (i = 0; i < n - 1; i++)";
        break;
      case "init-min":
        says = `Start by assuming the kid at the front place (height ${vm}) is the shortest.`;
        inCode = "min = i";
        break;
      case "inner-loop":
        says = `The Torch shines on place ${(j ?? 0) + 1}, height ${vj}.`;
        inCode = "for (j = i + 1; j < n; j++)";
        break;
      case "compare":
        says = vj !== null && vm !== null ? (vj < vm ? `${vj} is shorter than the shortest so far (${vm}).` : `${vj} is not shorter than ${vm}, so the shortest stays.`) : says;
        inCode = "if (values[j] < values[min])";
        break;
      case "new-min":
        says = `A new shortest kid: place ${(min ?? 0) + 1}, height ${vm}. Remember this place.`;
        inCode = "min = j";
        break;
      case "swap":
        says = min === i ? "The shortest kid is already standing in the Front place, so nothing needs to move." : `The scan is over. The shortest kid swaps with the kid at the Front place, so place ${(i ?? 0) + 1} now holds ${i !== null ? values[i] : "?"} for good.`;
        inCode = "swap(values[i], values[min])";
        break;
      case "finish":
        says = "Every front place has its final kid, so the line stands from shortest to tallest.";
        banner = { kind: "good", text: "Sorted from shortest to tallest." };
        inCode = "// all places filled";
        break;
    }
    return { cells, actors, says, inCode, banner };
  },
};
