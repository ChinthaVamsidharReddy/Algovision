import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** Finding a name in a phone book: open the middle, throw away the half that cannot hold it. */
export const binarySearchStory: Story = {
  id: "binary-search",
  title: "The Phone Book Trick",
  emoji: "📖",
  hook: "You want one name in a thick phone book. You never read from page 1. You open the book in the middle, see whether your name comes before or after that page, and tear off the half that cannot have it. Each peek throws away half of what is left, so even a huge book takes only a few peeks.",
  cast: [
    { emoji: "🚩", name: "Start flag", means: "the low pointer: the first book still in play" },
    { emoji: "🏁", name: "End flag", means: "the high pointer: the last book still in play" },
    { emoji: "🔍", name: "Peek", means: "mid: the middle book you open" },
    { emoji: "📚", name: "Book", means: "a value of the sorted array, numbered from 1 on the shelf" },
  ],
  moral: "Because the shelf is sorted, one peek at the middle tells you which half to throw away. Halving again and again finds anything in about log n peeks.",
  frame(step) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const target = variable(step, "target") ?? 0;
    const low = variable(step, "low");
    const high = variable(step, "high");
    const mid = variable(step, "mid");
    const ok = (i: number | null): i is number => i !== null && i >= 0 && i < n;
    const lo = ok(low) ? low : null;
    const hi = ok(high) ? high : null;
    const mi = ok(mid) ? mid : null;
    const midValue = mi !== null ? values[mi]! : null;
    const inPlay = low !== null && high !== null ? Math.max(0, high - low + 1) : n;
    const foundNow = a === "found" && mi !== null;
    const wholeShelfInPlay = low === null || high === null;

    const cells: StoryCell[] = values.map((v, i) => {
      const out = !wholeShelfInPlay && (i < low! || i > high!);
      return { main: String(v), sub: `book ${i + 1}`, tone: foundNow && i === mi ? "good" : i === mi && (a === "mid" || a === "compare" || a === "check-less") ? "hit" : out ? "dim" : "plain" };
    });
    const actors: StoryFrame["actors"] = [];
    if (lo !== null) actors.push({ id: "lo", emoji: "🚩", name: "Start", at: lo });
    if (hi !== null) actors.push({ id: "hi", emoji: "🏁", name: "End", at: hi });
    if (mi !== null && ["mid", "compare", "check-less", "found"].includes(a)) actors.push({ id: "mid", emoji: "🔍", name: "Peek", at: mi });

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? `The shelf is empty, so ${target} cannot be on it.` : `You want the book numbered ${target} on a sorted shelf of ${n} books. Open the middle and throw away half, again and again.`;
        break;
      case "init-low":
        says = "The Start flag goes on the first book.";
        inCode = "low = 0";
        break;
      case "init-high":
        says = n > 0 ? "The End flag goes on the last book. The whole shelf is still in play." : "There is no last book, so the End flag has nowhere to go.";
        inCode = "high = n - 1";
        break;
      case "loop":
        says = `${inPlay} ${inPlay === 1 ? "book is" : "books are"} still in play between the flags, so keep searching.`;
        inCode = "while (low <= high)";
        break;
      case "mid":
        says = `Peek at the middle of the books in play: book ${mi !== null ? mi + 1 : "?"}. It shows ${midValue}.`;
        inCode = "mid = low + (high - low) / 2";
        break;
      case "compare":
        says = midValue === target ? `${midValue} is exactly ${target}. This is the book we want!` : `${midValue} is not ${target}, so this is not the book.`;
        inCode = "if (values[mid] == target)";
        break;
      case "check-less":
        says = midValue !== null && midValue < target ? `${midValue} is smaller than ${target}. Sorted shelf, so the book we want sits after this one.` : `${midValue} is bigger than ${target}. Sorted shelf, so the book we want sits before this one.`;
        inCode = "if (values[mid] < target)";
        break;
      case "go-right":
        says = `Everything up to the peeked book is too small. Move the Start flag to the right of it: the left half is thrown away.`;
        inCode = "low = mid + 1";
        break;
      case "go-left":
        says = `Everything from the peeked book on is too big. Move the End flag to the left of it: the right half is thrown away.`;
        inCode = "high = mid - 1";
        break;
      case "found":
        says = `Found it! ${target} sits on book ${mi !== null ? mi + 1 : "?"}.`;
        banner = { kind: "good", text: `Found ${target} on book ${mi !== null ? mi + 1 : "?"}.` };
        inCode = "return mid";
        break;
      case "not-found":
        says = `The flags have crossed, so no book is left in play. ${target} is not on the shelf.`;
        banner = { kind: "bad", text: `${target} is not on the shelf.` };
        inCode = "return -1";
        break;
    }
    return { cells, actors, says, inCode, banner };
  },
};
