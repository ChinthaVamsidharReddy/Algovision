import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** Reversing a row of books on a shelf with two hands, swapping the pair at both ends and stepping inward. */
export const reverseInPlaceStory: Story = {
  id: "reverse-in-place",
  title: "Flipping the Bookshelf",
  emoji: "📚",
  hook: "You want a shelf of books in exactly the opposite order, without a second shelf. Put one hand on the first book and one on the last, swap the two books, then step both hands inward. When the hands meet in the middle, the whole shelf is flipped.",
  cast: [
    { emoji: "✋", name: "Left hand", means: "the left pointer: starts on the first book" },
    { emoji: "🤚", name: "Right hand", means: "the right pointer: starts on the last book" },
    { emoji: "📚", name: "Book", means: "a value of the array" },
  ],
  moral: "Swap the outer pair, then the next pair in, and so on. Each book is touched once, and no extra shelf (memory) is needed.",
  frame(step) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const left = variable(step, "left");
    const right = variable(step, "right");
    const ok = (i: number | null): i is number => i !== null && i >= 0 && i < n;
    const li = ok(left) ? left : null;
    const ri = ok(right) ? right : null;
    const finished = a === "finish";
    const both = li !== null && ri !== null;

    const cells: StoryCell[] = values.map((v, i) => ({
      main: String(v),
      sub: `slot ${i + 1}`,
      tone: finished ? "good" : both && (i === li || i === ri) ? "hit" : both && (i < li! || i > ri!) && a !== "init-left" && a !== "init-right" && a !== "entry" ? "good" : "plain",
    }));
    const actors: StoryFrame["actors"] = [];
    if (!finished) {
      if (li !== null) actors.push({ id: "l", emoji: "✋", name: "Left", at: li });
      if (ri !== null) actors.push({ id: "r", emoji: "🤚", name: "Right", at: ri });
    }

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n < 2 ? "With fewer than two books there is nothing to flip." : `${n} books stand in a row. Flip the order using only two hands.`;
        break;
      case "init-left":
        says = "The Left hand goes on the first book.";
        inCode = "left = 0";
        break;
      case "init-right":
        says = n > 0 ? "The Right hand goes on the last book." : "There is no last book.";
        inCode = "right = n - 1";
        break;
      case "loop":
        says = `The hands are on slots ${(li ?? 0) + 1} and ${(ri ?? 0) + 1}, two different books, so this pair still needs swapping.`;
        inCode = "while (left < right)";
        break;
      case "swap":
        says = `The hands swap their books: ${li !== null ? values[li] : "?"} and ${ri !== null ? values[ri] : "?"} just changed places.`;
        inCode = "swap(values[left], values[right])";
        break;
      case "move":
        says = `Both hands step inward: the Left hand to slot ${(li ?? 0) + 1}, the Right hand to slot ${(ri ?? 0) + 1}. The books they left behind are done.`;
        inCode = "left++; right--";
        break;
      case "finish":
        says = "The hands have met or crossed, so every pair has been swapped and the shelf is flipped.";
        banner = { kind: "good", text: "The shelf is reversed." };
        inCode = "// left >= right: done";
        break;
    }
    return { cells, actors, says, inCode, banner };
  },
};
