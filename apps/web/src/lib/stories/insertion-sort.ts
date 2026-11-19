import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** Sorting playing cards in your hand: pick up the next card and slide it left into its place. */
export const insertionSortStory: Story = {
  id: "insertion-sort",
  title: "Sorting Cards in Your Hand",
  emoji: "🃏",
  hook: "You hold a few cards in order, and a new card is dealt. You pick it up, slide the bigger cards one place to the right, and drop the new card into the gap. Do that for every card and the whole hand is sorted.",
  cast: [
    { emoji: "✋", name: "Card in hand", means: "key: the card being placed, held aside" },
    { emoji: "👀", name: "Comparing", means: "j: the sorted card the key is being compared with" },
    { emoji: "✅", name: "Sorted hand", means: "the green cells left of i: already in order" },
  ],
  moral: "Keep the left part sorted. Each new value slides left past the bigger ones, so the sorted part grows by one each round.",
  frame(step) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const i = variable(step, "i");
    const key = variable(step, "key");
    const j = variable(step, "j");
    const finished = a === "finish";
    const ok = (x: number | null): x is number => x !== null && x >= 0 && x < n;
    const jv = ok(j) ? values[j]! : null;

    const cells: StoryCell[] = values.map((v, k) => ({
      main: String(v),
      sub: `place ${k + 1}`,
      tone: finished || (i !== null && (k < i || (a === "insert" && k <= i))) ? "good" : ok(j) && k === j && ["pick-key", "inner-loop"].includes(a) ? "hit" : "plain",
    }));
    const actors: StoryFrame["actors"] = [];
    if (!finished && ok(i) && ["pick-key", "inner-loop", "shift", "insert"].includes(a)) actors.push({ id: "k", emoji: "✋", name: "In hand", at: i });
    if (!finished && ok(j) && ["pick-key", "inner-loop"].includes(a)) actors.push({ id: "j", emoji: "👀", name: "Compare", at: j });
    const board = key !== null && ["pick-key", "inner-loop", "shift", "insert"].includes(a) ? { label: "Card in hand", text: String(key) } : undefined;

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n < 2 ? "A hand of fewer than two cards is already sorted." : `${n} cards lie in a row. The first card alone is a sorted hand. Now deal the rest in, one at a time.`;
        break;
      case "outer-loop":
        says = `The first ${i} card${i === 1 ? " is" : "s are"} sorted (green). Take the next card, at place ${(i ?? 0) + 1}, and put it where it belongs.`;
        inCode = "for (i = 1; i < n; i++)";
        break;
      case "pick-key":
        says = `Pick up the card ${key} and hold it aside. Compare it with the sorted card to its left.`;
        inCode = "key = values[i]; j = i - 1";
        break;
      case "inner-loop":
        says = jv !== null && key !== null ? (jv > key ? `${jv} is bigger than ${key}, so ${jv} has to slide one place to the right.` : `${jv} is not bigger than ${key}, so the card in hand belongs right after it.`) : `There are no cards left to compare with, so the card in hand goes at the very front.`;
        inCode = "while (j >= 0 && values[j] > key)";
        break;
      case "shift":
        says = "The bigger card slides one place to the right to open a gap. The card in hand is still held aside.";
        inCode = "values[j + 1] = values[j]; j--";
        break;
      case "insert":
        says = `Drop the card ${key} into the gap, at place ${(j ?? -1) + 2}. The first ${(i ?? 0) + 1} cards are now sorted.`;
        inCode = "values[j + 1] = key";
        break;
      case "finish":
        says = "Every card has been placed, so the whole hand is sorted.";
        banner = { kind: "good", text: "The hand is sorted." };
        inCode = "// all cards inserted";
        break;
    }
    return { cells, actors, says, inCode, banner, board };
  },
};
