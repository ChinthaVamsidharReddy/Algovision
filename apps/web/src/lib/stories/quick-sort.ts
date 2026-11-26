import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { indexLabelled, indexesWithRole, isLast, listOf, sortCells } from "./sort-util";

const spots = (lo: number | null, hi: number | null): string => (lo === null || hi === null || hi < lo ? "nobody" : lo === hi ? `spot ${lo + 1}` : `spots ${lo + 1} to ${hi + 1}`);

/** Sorting a crowd around a measuring stick: smaller people to the left, the rest to the right, then the stick stands in its final place. */
export const quickSortStory: Story = {
  id: "quick-sort",
  title: "The Measuring Stick",
  emoji: "📏",
  hook: "A crowd must line up by height. The last person in the group is chosen as the measuring stick (the pivot). Everybody else is compared to the stick: the shorter people are moved to the left, the others stay to the right. At the end the pivot steps between the two sides, and is now exactly where it belongs for good. Then each side is sorted the same way.",
  cast: [
    { emoji: "📏", name: "Pivot", means: "the measuring stick: the last value of the group" },
    { emoji: "🚩", name: "Next small spot", means: "i: where the next smaller person will stand" },
    { emoji: "🔎", name: "Scanner", means: "j: the person being compared with the pivot" },
  ],
  moral: "Partitioning puts the pivot in its final place with one pass. Each side is then a smaller copy of the same problem. With good luck the pivot splits the group evenly (O(n log n)); always picking the largest or smallest makes it O(n²).",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const values = step.state.values;
    const lo = variable(step, "lo");
    const hi = variable(step, "hi");
    const i = variable(step, "i");
    const j = variable(step, "j");
    const pivot = variable(step, "pivot");
    const cells = sortCells(step, (p) => `spot ${p + 1}`);
    const pivotAt = indexLabelled(step, "pivot");
    const actors: StoryActor[] = [];
    if (pivotAt !== undefined && ["choose-pivot", "init-i", "scan", "compare", "swap", "advance"].includes(a)) actors.push({ id: "p", emoji: "📏", name: "Pivot", at: pivotAt, row: "bottom" });
    if (i !== null && i < values.length && ["init-i", "scan", "compare", "swap", "advance"].includes(a)) actors.push({ id: "i", emoji: "🚩", name: "Next small", at: i });
    if (j !== null && j < values.length && ["scan", "compare", "swap"].includes(a) && j !== i) actors.push({ id: "j", emoji: "🔎", name: "Scanner", at: j, row: "bottom" });
    const here = j !== null && j < values.length ? values[j]! : null;
    const swapped = indexesWithRole(step, "swapped");
    const done = values.filter((_, p) => step.highlights.some((h) => h.target.kind === "index" && h.target.index === p && h.role === "sorted")).length;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = step.index === 0 ? `Line up ${values.length} ${values.length === 1 ? "person" : "people"} by height: pick a measuring stick, split the crowd around it, then sort each side.` : `A new group to sort: ${spots(lo, hi)}.`;
        inCode = "quickSort(lo, hi)";
        break;
      case "base-case":
        says = lo !== null && hi !== null && hi < lo ? "Nobody is in this group, so there is nothing to do." : `${spots(lo, hi)} is one person alone: already in the right place.`;
        inCode = "if (lo >= hi) return";
        break;
      case "choose-pivot":
        says = `The last person in the group, ${pivot}, becomes the measuring stick (the pivot).`;
        inCode = "pivot = values[hi]";
        break;
      case "init-i":
        says = `A flag waits at spot ${(i ?? 0) + 1}: the next person shorter than the pivot will be placed there.`;
        inCode = "i = lo";
        break;
      case "scan":
        says = `Measure spot ${(j ?? 0) + 1}: ${here} against the pivot ${pivot}.`;
        inCode = "for (j = lo; j < hi; j++)";
        break;
      case "compare":
        says = here !== null && pivot !== null && here < pivot ? `${here} is shorter than ${pivot}, so it belongs on the left side.` : `${here} is not shorter than ${pivot}, so it stays on the right side.`;
        inCode = "if (values[j] < pivot)";
        break;
      case "swap":
        says = i === j ? "The person is already at the flag, so nobody has to move." : `Swap spots ${swapped.length ? Math.min(...swapped) + 1 : "?"} and ${swapped.length ? Math.max(...swapped) + 1 : "?"}: the shorter person goes to the flag.`;
        inCode = "swap(values, i, j)";
        break;
      case "advance":
        says = `The flag moves on to spot ${(i ?? 0) + 1}.`;
        inCode = "i++";
        break;
      case "place-pivot":
        says = `The pivot ${pivot} steps into spot ${(i ?? 0) + 1}. Everyone to its left is shorter and everyone to its right is not, so ${pivot} is in its final place.`;
        inCode = "swap(values, i, hi)";
        break;
      case "recurse-left":
        says = `Now sort the people left of the pivot: ${spots(lo, i === null ? null : i - 1)}.`;
        inCode = "quickSort(lo, i - 1)";
        break;
      case "recurse-right":
        says = `Now sort the people right of the pivot: ${spots(i === null ? null : i + 1, hi)}.`;
        inCode = "quickSort(i + 1, hi)";
        break;
      case "finish":
        says = `Every group is sorted. The crowd is in order: ${listOf(values)}.`;
        banner = values.length === 0 ? { kind: "info", text: "Nothing to sort." } : { kind: "good", text: `Sorted: ${values.join(", ")}.` };
        break;
    }
    void isLast;
    void trace;
    return { cells, actors, says, inCode, banner, board: { label: "In their final place", text: `${done} of ${values.length}` } };
  },
};
