import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { isLast, listOf, sortCells } from "./sort-util";

/** A mail room: every parcel is dropped into the pigeonhole with its number, then the holes are emptied in order. */
export const countingSortStory: Story = {
  id: "counting-sort",
  title: "Pigeonholes in the Mail Room",
  emoji: "📮",
  hook: "A mail room has one pigeonhole for every number from 0 to 20. First pass: read the parcels one by one and put a tally mark in the hole with that parcel's number. Nothing is compared with anything. Second pass: walk along the holes from 0 upwards and, for each tally mark, write that number into the next free place of the output row. The row comes out sorted.",
  cast: [
    { emoji: "🧑", name: "Reader", means: "i: the parcel being read in pass one" },
    { emoji: "✍️", name: "Writer", means: "k: the next place to fill in pass two" },
    { emoji: "📮", name: "Pigeonhole", means: "counts[v]: how many parcels carry the number v" },
  ],
  moral: "Counting sort never compares two values. It counts how often each number appears and replays the numbers in order, so it takes O(n + range) time. It is fast when the range of values is small.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const n = step.state.values.length;
    const i = variable(step, "i");
    const k = variable(step, "k");
    const v = variable(step, "v");
    const value = variable(step, "value");
    const holeCount = variable(step, "counts[v]");
    const tally = new Map<number, number>();
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (anchorOf(s) === "count") {
        const x = variable(s, "value");
        if (x !== null) tally.set(x, variable(s, "counts[value]") ?? 0);
      }
    }
    const holes = [...tally.keys()].sort((x, y) => x - y).map((x) => `${x} ×${tally.get(x)}`);
    const cells = sortCells(step, (p) => `place ${p + 1}`);
    const actors: StoryActor[] = [];
    if (a === "count" && i !== null) actors.push({ id: "r", emoji: "🧑", name: "Reader", at: i });
    if (["value-loop", "write"].includes(a) && k !== null && k < n) actors.push({ id: "w", emoji: "✍️", name: "Writer", at: k });
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "There are no parcels to sort." : `${n} ${n === 1 ? "parcel" : "parcels"} to sort. Pass one counts them; pass two writes them out in order.`;
        break;
      case "init-counts":
        says = "Twenty-one empty pigeonholes, numbered 0 to 20, with no tally marks.";
        inCode = "counts = new int[21]";
        break;
      case "count":
        says = `Parcel ${(i ?? 0) + 1} has the number ${value}. Add a tally mark to pigeonhole ${value}: it now has ${holeCount ?? tally.get(value ?? -1)}.`;
        inCode = "counts[value]++";
        break;
      case "value-loop":
        says = (holeCount ?? 0) > 0 ? `Pigeonhole ${v} has ${holeCount} ${holeCount === 1 ? "mark" : "marks"}, so write ${v} ${holeCount === 1 ? "once" : `${holeCount} times`}.` : `Pigeonhole ${v} is empty: nothing to write.`;
        inCode = "for (v = 0; v <= 20; v++)";
        break;
      case "write":
        says = `Write ${v} into place ${(k ?? 1) }. ${holeCount === 0 ? "That hole is empty now." : `${holeCount} more ${v} to write.`}`;
        inCode = "values[k++] = v; counts[v]--";
        break;
      case "finish":
        says = n === 0 ? "Nothing was there to sort." : `All holes are emptied. The row is sorted: ${listOf(step.state.values)}.`;
        banner = n === 0 ? { kind: "info", text: "Nothing to sort." } : { kind: "good", text: `Sorted: ${step.state.values.join(", ")}.` };
        break;
    }
    void isLast;
    return { cells, actors, says, inCode, banner, board: { label: "Tally marks", text: holes.length ? holes.join(", ") : "none yet" } };
  },
};
