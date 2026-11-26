import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { sortCells } from "./sort-util";

/** Somebody leaves a row of seats: everyone behind them slides one seat to the left to close the gap. */
export const deleteAtIndexStory: Story = {
  id: "delete-at-index",
  title: "Closing the Gap",
  emoji: "🚪",
  hook: "People sit in a row and one of them leaves. A gap would look odd, so everyone who sat to the right of the leaver slides one seat to the left, starting with the person next to the gap. The last seat is left over, and the row is now one person shorter.",
  cast: [
    { emoji: "👋", name: "Leaver", means: "index: the person who leaves" },
    { emoji: "⬅️", name: "Mover", means: "i: the seat being filled by the person on its right" },
  ],
  moral: "Deleting from the middle of an array moves every later element one place to the left, so it takes O(n) time. Deleting the last element needs no movement at all.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const first = trace.steps[0]!;
    const index = variable(first, "index") ?? 0;
    const n0 = variable(first, "n") ?? 0;
    const i = variable(step, "i");
    const cells = sortCells(step, (p) => `seat ${p + 1}`);
    const actors: StoryActor[] = [];
    if (a === "entry") actors.push({ id: "l", emoji: "👋", name: "Leaver", at: index });
    if (i !== null && ["shift-loop", "shift"].includes(a)) actors.push({ id: "m", emoji: "⬅️", name: "Mover", at: i });
    const shifts = trace.steps.filter((s) => s.index <= step.index && anchorOf(s) === "shift").length;
    const gone = first.state.values[index];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `${n0} ${n0 === 1 ? "person sits" : "people sit"} in a row. The person in seat ${index + 1} (${gone}) leaves.`;
        break;
      case "shift-loop":
        says = `Seat ${(i ?? 0) + 1} must be filled next, by the person now in seat ${(i ?? 0) + 2}.`;
        inCode = "for (i = index; i < n - 1; i++)";
        break;
      case "shift":
        says = `${step.state.values[i ?? 0]} slides from seat ${(i ?? 0) + 2} to seat ${(i ?? 0) + 1}.`;
        inCode = "values[i] = values[i + 1]";
        break;
      case "finish": {
        const left = step.state.values.length;
        says = left === 0 ? "The only person left, so the row is empty." : `The last seat held a leftover copy, so the row is one shorter: ${left} ${left === 1 ? "person" : "people"} now.`;
        banner = left === 0 ? { kind: "info", text: "The row is empty." } : { kind: "good", text: `Now: ${step.state.values.join(", ")}.` };
        break;
      }
    }
    return { cells, actors, says, inCode, banner, board: { label: "People who had to move", text: String(shifts) } };
  },
};
