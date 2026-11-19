import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** A shopkeeper pairs two coins that add up to the price, using a notebook of the coins already seen. */
export const twoSumHashStory: Story = {
  id: "two-sum-hash",
  title: "The Shopkeeper's Notebook",
  emoji: "📓",
  hook: "A shopkeeper needs two coins that add up to the price. He walks along the counter. For each coin he works out the partner coin he would need, then looks in his notebook. If the partner is there, he has his pair. If not, he writes this coin in the notebook and moves on. He never has to compare every pair of coins.",
  cast: [
    { emoji: "🧑‍💼", name: "Shopkeeper", means: "j: the coin being looked at now" },
    { emoji: "📓", name: "Notebook", means: "the hash map: each coin seen so far and its place" },
    { emoji: "🪙", name: "Coin", means: "a value of the array" },
    { emoji: "🎯", name: "Partner", means: "need = target - value: the coin that would finish the pair" },
  ],
  moral: "Instead of searching for a partner each time, remember what you have seen. A notebook lookup is instant, so one walk along the counter is enough.",
  frame(step, trace) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    // The final step records only the pair, so the price is read from the first step.
    const target = variable(step, "target") ?? variable(trace.steps[0]!, "target") ?? 0;
    const j = variable(step, "j");
    const need = variable(step, "need");
    const foundAt = variable(step, "i");
    const ok = (x: number | null): x is number => x !== null && x >= 0 && x < n;

    // The notebook, rebuilt from the array: every coin before this one was written down (a later copy of a value replaces an earlier one).
    const upTo = ok(j) ? (a === "store" ? j : j - 1) : -1;
    const book = new Map<number, number>();
    for (let k = 0; k <= upTo; k++) book.set(values[k]!, k);
    const noted = new Set(book.values());
    const text = book.size === 0 ? "empty" : [...book.entries()].map(([v, k]) => `${v} (place ${k + 1})`).join(", ");

    const cells: StoryCell[] = values.map((v, k) => ({
      main: String(v),
      sub: noted.has(k) && a !== "found" ? "noted" : `place ${k + 1}`,
      tone: a === "found" && (k === j || k === foundAt) ? "good" : ok(j) && k === j && a !== "not-found" ? "hit" : "plain",
    }));
    const actors: StoryFrame["actors"] = [];
    if (ok(j) && a !== "not-found" && a !== "init-map" && a !== "entry") actors.push({ id: "s", emoji: "🧑‍💼", name: "Shopkeeper", at: j });
    const board = ["init-map", "loop", "compute-complement", "check-seen", "store"].includes(a) ? { label: "Notebook", text } : undefined;
    const vj = ok(j) ? values[j]! : null;

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n < 2 ? `With fewer than two coins there is no pair that makes ${target}.` : `${n} coins on the counter. The price is ${target}. Find two coins that add up to it.`;
        break;
      case "init-map":
        says = "The shopkeeper opens a fresh notebook. It is empty.";
        inCode = "seen = {}";
        break;
      case "loop":
        says = `The shopkeeper picks up the coin at place ${(j ?? 0) + 1}: ${vj}.`;
        inCode = "for (j = 0; j < n; j++)";
        break;
      case "compute-complement":
        says = `To reach ${target} with ${vj}, he needs a partner coin worth ${need}.`;
        inCode = "need = target - values[j]";
        break;
      case "check-seen":
        says = need !== null && book.has(need) ? `He looks in the notebook: ${need} is written there, at place ${book.get(need)! + 1}!` : `He looks in the notebook: ${need} is not written there.`;
        inCode = "if (need in seen)";
        break;
      case "store":
        says = `No partner yet, so he writes ${vj} (place ${(j ?? 0) + 1}) in the notebook and moves to the next coin.`;
        inCode = "seen[values[j]] = j";
        break;
      case "found":
        says = `Place ${(foundAt ?? 0) + 1} holds ${foundAt !== null ? values[foundAt] : "?"} and place ${(j ?? 0) + 1} holds ${vj}: together ${target}. Pair found!`;
        banner = { kind: "good", text: `Places ${(foundAt ?? 0) + 1} and ${(j ?? 0) + 1} make ${target}.` };
        inCode = "return [seen[need], j]";
        break;
      case "not-found":
        says = `He has been through every coin and no two add up to ${target}.`;
        banner = { kind: "bad", text: `No two coins make ${target}.` };
        inCode = "return []";
        break;
    }
    return { cells, actors, says, inCode, banner, board };
  },
};
