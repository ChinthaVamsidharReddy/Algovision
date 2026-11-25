import { anchorOf, variable, type Story, type StoryActor, type StoryCell, type StoryFrame } from "./types";
import { outside, roleTone } from "./ledger-util";
import { rolesOf } from "./string-util";

/** A shelf with several copies of the same book: finding a copy is easy, finding the leftmost copy means not stopping at the first match. */
export const firstOccurrenceStory: Story = {
  id: "binary-search-first-occurrence",
  title: "The Leftmost Copy on the Shelf",
  emoji: "📚",
  hook: "A sorted shelf holds several copies of the book you want, side by side. Opening the middle might land on any of them, and you want the very first. So when you find a copy, you put a bookmark in it and keep looking to its left, in case there is an earlier one. The last bookmark you placed is the leftmost copy.",
  cast: [
    { emoji: "🚩", name: "Start flag", means: "low: the first book still in play" },
    { emoji: "🏁", name: "End flag", means: "high: the last book still in play" },
    { emoji: "🔍", name: "Peek", means: "mid: the middle book you open" },
    { emoji: "🟢", name: "Bookmarked book", means: "result: the leftmost copy found so far, shown in green" },
  ],
  moral: "A match is not the end of the search: record it and keep halving to the left. The last recorded match is the first occurrence, still found in about log n peeks.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const values = step.state.values;
    const n = values.length;
    const target = variable(trace.steps[0]!, "target") ?? 0;
    const low = variable(step, "low");
    const high = variable(step, "high");
    const mid = variable(step, "mid");
    const result = variable(step, "result");
    const roles = rolesOf(step);
    const ok = (i: number | null): i is number => i !== null && i >= 0 && i < n;
    const cells: StoryCell[] = values.map((v, i) => {
      const r = roles.get(i);
      const tone = r === "found" || (result !== null && result >= 0 && i === result) ? roleTone("found") : i === mid && ["mid", "check-equal", "check-less"].includes(a) ? "hit" : outside(i, low, high) ? "dim" : "plain";
      return { main: String(v), sub: `book ${i + 1}`, tone };
    });
    const actors: StoryActor[] = [];
    if (ok(low) && a !== "finish") actors.push({ id: "lo", emoji: "🚩", name: "Start", at: low });
    if (ok(high) && a !== "finish") actors.push({ id: "hi", emoji: "🏁", name: "End", at: high, row: "bottom" });
    if (ok(mid) && ["mid", "check-equal", "check-less", "record"].includes(a)) actors.push({ id: "mid", emoji: "🔍", name: "Peek", at: mid });
    const midValue = ok(mid) ? values[mid]! : null;
    const inPlay = low !== null && high !== null ? Math.max(0, high - low + 1) : n;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? `The shelf is empty, so there is no copy of ${target}.` : `Find the first copy of book ${target} on a sorted shelf of ${n} books. Copies of the same book sit side by side.`;
        break;
      case "init-low":
        says = "The Start flag goes on the first book.";
        inCode = "low = 0";
        break;
      case "init-high":
        says = n > 0 ? "The End flag goes on the last book." : "There is no last book.";
        inCode = "high = n - 1";
        break;
      case "init-result":
        says = "No bookmark yet: no copy has been found.";
        inCode = "result = -1";
        break;
      case "loop":
        says = `${inPlay} ${inPlay === 1 ? "book is" : "books are"} still in play between the flags.`;
        inCode = "while (low <= high)";
        break;
      case "mid":
        says = `Peek at the middle of the books in play: book ${ok(mid) ? mid + 1 : "?"}. It shows ${midValue}.`;
        inCode = "mid = low + (high - low) / 2";
        break;
      case "check-equal":
        says = midValue === target ? `${midValue} is a copy of ${target}, but an earlier copy could be to the left.` : `Book ${ok(mid) ? mid + 1 : "?"} shows ${midValue}, which is not ${target}.`;
        inCode = "if (values[mid] == target)";
        break;
      case "record":
        says = `Put the bookmark in book ${ok(result) ? result + 1 : "?"}: the leftmost copy found so far.`;
        inCode = "result = mid";
        break;
      case "go-left-eq":
        says = `Keep looking for an earlier copy: everything from the bookmark rightwards is thrown away. The End flag moves to book ${high === null ? "?" : high + 1}.`;
        inCode = "high = mid - 1";
        break;
      case "check-less":
        says = midValue !== null && midValue < target ? `${midValue} is smaller than ${target}, so every copy lies to the right.` : `${midValue} is bigger than ${target}, so every copy lies to the left.`;
        inCode = "if (values[mid] < target)";
        break;
      case "go-right":
        says = `Throw away the left half: the Start flag moves to book ${low === null ? "?" : low + 1}.`;
        inCode = "low = mid + 1";
        break;
      case "go-left":
        says = `Throw away the right half: the End flag moves to book ${high === null ? "?" : high + 1}.`;
        inCode = "high = mid - 1";
        break;
      case "finish":
        says = ok(result) ? `Nothing is left in play. The bookmark sits in book ${result + 1}: the first copy of ${target}.` : `Nothing is left in play and no copy of ${target} was ever found.`;
        banner = ok(result) ? { kind: "good", text: `The first copy of ${target} is book ${result + 1} (index ${result}).` } : { kind: "info", text: `${target} is not on the shelf.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Bookmark", text: ok(result) && result >= 0 ? `book ${result + 1}` : "none yet" } };
  },
};
