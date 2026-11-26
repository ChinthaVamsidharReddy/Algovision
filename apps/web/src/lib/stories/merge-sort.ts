import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { indexesWithRole, isLast, listOf, sortCells } from "./sort-util";

const spots = (lo: number | null, hi: number | null): string => (lo === null || hi === null ? "?" : lo === hi ? `spot ${lo + 1}` : `spots ${lo + 1} to ${hi + 1}`);

/** A class sorted by height: split in halves until each pupil stands alone, then merge neighbouring lines by letting the shorter front pupil go first. */
export const mergeSortStory: Story = {
  id: "merge-sort",
  title: "Merging Two Sorted Lines",
  emoji: "🧒",
  hook: "A teacher has to line up a class by height. She splits the class in half, and each half in half again, until every pupil stands alone, because one pupil is already a sorted line. Then she merges neighbouring lines: look at the front pupil of each line, the shorter one steps into a new line, and repeat. Two sorted lines become one sorted line, all the way back up.",
  cast: [
    { emoji: "✂️", name: "Split", means: "mid: where the class is cut in half" },
    { emoji: "👈", name: "Left front", means: "i: the front of the left line" },
    { emoji: "👉", name: "Right front", means: "j: the front of the right line" },
    { emoji: "📋", name: "New line", means: "the temporary buffer that receives the merged pupils" },
  ],
  moral: "Merge sort halves the problem about log n times and each level of merging touches every pupil once, so it takes O(n log n) time in every case. The price is the extra room for the temporary line.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const values = step.state.values;
    const lo = variable(step, "lo");
    const hi = variable(step, "hi");
    const mid = variable(step, "mid");
    const i = variable(step, "i");
    const j = variable(step, "j");
    const cells = sortCells(step, (p) => `spot ${p + 1}`);
    // the new line of the merge in progress, rebuilt from the steps so far
    const merged: number[] = [];
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      const id = anchorOf(s);
      if (id === "merge-init") merged.length = 0;
      if (id === "take-left" || id === "take-right" || id === "copy-rest") {
        const at = indexesWithRole(s, "found")[0];
        if (at !== undefined) merged.push(s.state.values[at]!);
      }
    }
    const inMerge = ["merge-init", "merge-compare", "take-left", "take-right", "copy-rest"].includes(a);
    const actors: StoryActor[] = [];
    if (mid !== null && ["split", "recurse-left", "recurse-right"].includes(a)) actors.push({ id: "s", emoji: "✂️", name: "Split", at: mid });
    if (["merge-init", "merge-compare", "take-left", "take-right"].includes(a)) {
      if (i !== null && i < values.length) actors.push({ id: "l", emoji: "👈", name: "Left", at: i });
      if (j !== null && j < values.length) actors.push({ id: "r", emoji: "👉", name: "Right", at: j, row: "bottom" });
    }
    const vi = i !== null && i < values.length ? values[i]! : null;
    const vj = j !== null && j < values.length ? values[j]! : null;
    const taken = indexesWithRole(step, "found")[0];
    const takenValue = taken === undefined ? null : values[taken]!;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = step.index === 0 ? `Line up ${values.length} ${values.length === 1 ? "pupil" : "pupils"} by height, shortest first: split, sort each half, then merge.` : `A helper takes ${spots(lo, hi)} to sort.`;
        inCode = "mergeSort(lo, hi)";
        break;
      case "base-case":
        says = `${spots(lo, lo)} is a single pupil, so already a sorted line.`;
        inCode = "if (lo == hi) return";
        break;
      case "split":
        says = `Cut ${spots(lo, hi)} in half after spot ${(mid ?? 0) + 1}: the left half is ${spots(lo, mid)}, the right half is ${spots(mid === null ? null : mid + 1, hi)}.`;
        inCode = "mid = (lo + hi) / 2";
        break;
      case "recurse-left":
        says = `First sort the left half, ${spots(lo, mid)}.`;
        inCode = "mergeSort(lo, mid)";
        break;
      case "recurse-right":
        says = `Now sort the right half, ${spots(mid === null ? null : mid + 1, hi)}.`;
        inCode = "mergeSort(mid + 1, hi)";
        break;
      case "merge-call":
        says = `Both halves are sorted lines. Merge ${spots(lo, hi)} into one line.`;
        inCode = "merge(lo, mid, hi)";
        break;
      case "merge-init":
        says = `Look at the front pupil of each line: the left line starts at spot ${(i ?? 0) + 1}, the right line at spot ${(j ?? 0) + 1}. The new line is empty.`;
        inCode = "i = lo; j = mid + 1; k = 0";
        break;
      case "merge-compare":
        says = vi !== null && vj !== null && vi <= vj ? `Left front ${vi} against right front ${vj}: the left one is no taller, so it goes first.` : `Left front ${vi} against right front ${vj}: the right one is shorter, so it goes first.`;
        inCode = "if (values[i] <= values[j])";
        break;
      case "take-left":
        says = `${takenValue} from the left line steps into the new line. New line: ${listOf(merged)}.`;
        inCode = "temp[k++] = values[i++]";
        break;
      case "take-right":
        says = `${takenValue} from the right line steps into the new line. New line: ${listOf(merged)}.`;
        inCode = "temp[k++] = values[j++]";
        break;
      case "copy-rest":
        says = `One line is used up, so the rest of the other line follows in order: ${takenValue} joins the new line. New line: ${listOf(merged)}.`;
        inCode = "copy what is left of either half";
        break;
      case "write-back":
        says = `The new line replaces ${spots(lo, hi)}: they now stand as ${listOf(lo === null || hi === null ? [] : values.slice(lo, hi + 1))}.`;
        inCode = "values[lo..hi] = temp";
        break;
      case "finish":
        if (isLast(step, trace)) {
          says = `Every merge is done. The whole class is in order: ${listOf(values)}.`;
          banner = values.length === 0 ? { kind: "info", text: "Nothing to sort." } : { kind: "good", text: `Sorted: ${values.join(", ")}.` };
        } else {
          says = `${spots(lo, hi)} are now in order. Return to the helper who called this one.`;
        }
        break;
    }
    return { cells, actors, says, inCode, banner, board: inMerge ? { label: "New line so far", text: listOf(merged) } : { label: "Working on", text: lo !== null && hi !== null ? spots(lo, hi) : "the whole class" } };
  },
};
