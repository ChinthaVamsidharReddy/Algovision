import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { joined, slotCells } from "./ledger-util";

/** A tally sheet: read the votes one by one and keep a count beside each name the first time it is seen. */
export const countFrequenciesStory: Story = {
  id: "count-frequencies",
  title: "The Vote Tally Sheet",
  emoji: "🗳️",
  hook: "Votes are read out one at a time. A clerk keeps a tally sheet: the first time a number is called he writes it on a new line, and every time a number is called he adds one tick to its line. At the end the sheet says how many votes each number got, in the order they first appeared.",
  cast: [
    { emoji: "🧑‍💼", name: "Clerk", means: "i: the vote being read" },
    { emoji: "📋", name: "Tally sheet", means: "the hash map from value to count" },
    { emoji: "🆕", name: "New line", means: "a value seen for the first time" },
  ],
  moral: "A hash map turns counting into one pass: look the value up, add one. Each lookup takes about the same time however long the sheet is, so the whole count is O(n).",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const n = step.state.values.length;
    const i = variable(step, "i");
    const value = variable(step, "value");
    const count = variable(step, "count");
    const order: number[] = [];
    const tally = new Map<number, number>();
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      const id = anchorOf(s);
      const v = variable(s, "value");
      if (id === "first-seen" && v !== null) order.push(v);
      if (id === "increment" && v !== null) tally.set(v, variable(s, "count") ?? 0);
    }
    const sheet = order.map((v) => `${v} ×${tally.get(v) ?? 0}`);
    const cells = slotCells(step, Number.NaN, (k) => `vote ${k + 1}`);
    const actors: StoryActor[] = i !== null && !["entry", "init-map", "build-output", "finish"].includes(a) ? [{ id: "c", emoji: "🧑‍💼", name: "Clerk", at: i }] : [];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "There are no votes to count." : `${n} ${n === 1 ? "vote" : "votes"} to count.`;
        break;
      case "init-map":
        says = "The tally sheet is blank.";
        inCode = "counts = new HashMap()";
        break;
      case "loop":
        says = `Read vote ${(i ?? 0) + 1}: the number ${value}.`;
        inCode = "for (value : values)";
        break;
      case "first-seen":
        says = `${value} has not been called before, so it gets a new line on the sheet.`;
        inCode = "if (!counts.containsKey(value)) order.add(value)";
        break;
      case "increment":
        says = `Add a tick to ${value}'s line. It now has ${count}.`;
        inCode = "counts.put(value, counts.get(value) + 1)";
        break;
      case "build-output":
        says = n === 0 ? "Nothing was read, so the sheet stays empty." : "All votes are read. Copy the sheet out, line by line, in the order the numbers first appeared.";
        inCode = "for (value : order) result.add(value, counts.get(value))";
        break;
      case "finish":
        says = n === 0 ? "No votes, no lines." : `The sheet has ${sheet.length} ${sheet.length === 1 ? "line" : "lines"}.`;
        banner = n === 0 ? { kind: "info", text: "No votes to tally." } : { kind: "good", text: `Tally: ${sheet.join(", ")}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Tally sheet", text: joined(sheet, "blank") } };
  },
};
