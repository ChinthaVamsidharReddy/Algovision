import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** Two teachers at both ends of a line of kids with letter cards: is the line a perfect mirror? */
export const isPalindromeStringStory: Story = {
  id: "is-palindrome-string",
  title: "The Mirror Line",
  emoji: "🪞",
  hook: "Kids line up for a photo, each holding a letter card. A line is a perfect mirror if the kid who is 2nd from the front holds the same letter as the kid who is 2nd from the back, and so on. Two teachers start at both ends and walk inwards, checking each pair.",
  cast: [
    { emoji: "👩‍🏫", name: "Front teacher", means: "the low pointer: starts at the first letter" },
    { emoji: "👨‍🏫", name: "Back teacher", means: "the high pointer: starts at the last letter" },
    { emoji: "🔤", name: "Letter card", means: "a character of the string" },
    { emoji: "🪞", name: "Mirror", means: "a palindrome: reads the same both ways" },
  ],
  moral: "To test a mirror you never need to look at the whole line at once. Check the outermost pair, then the next pair in, and stop at the first mismatch.",
  frame(step) {
    const codes = step.state.values;
    const n = codes.length;
    const a = anchorOf(step);
    const low = variable(step, "low");
    const high = variable(step, "high");
    const result = variable(step, "result");
    const ok = (i: number | null): i is number => i !== null && i >= 0 && i < n;
    const ch = (i: number) => String.fromCharCode(codes[i]!);
    const lo = ok(low) ? low : null;
    const hi = ok(high) ? high : null;
    const mismatch = a === "mismatch" || (a === "finish" && result === 0);
    const match = lo !== null && hi !== null && codes[lo] === codes[hi];

    const cells: StoryCell[] = codes.map((_, i) => {
      const checked = lo !== null && hi !== null && (i < lo || i > hi);
      const here = i === lo || i === hi;
      const tone = a === "finish" && result === 1 ? "good" : mismatch && here ? "warn" : a === "compare" && here && match ? "good" : here ? "hit" : checked ? "good" : "plain";
      return { main: ch(i), sub: `${i + 1}`, tone };
    });
    const actors: StoryFrame["actors"] = [];
    if (lo !== null) actors.push({ id: "f", emoji: "👩‍🏫", name: "Front", at: lo });
    if (hi !== null) actors.push({ id: "b", emoji: "👨‍🏫", name: "Back", at: hi });

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "Nobody is in the line. An empty line is trivially a mirror." : `${n} kids stand in a line, each with a letter card. Are the cards a perfect mirror?`;
        break;
      case "init":
        says = n === 0 ? "No teachers are needed for an empty line." : "The Front teacher stands at the first kid and the Back teacher at the last kid.";
        inCode = "low = 0; high = n - 1";
        break;
      case "compare":
        says = lo !== null && hi !== null ? (lo === hi ? `Both teachers stand at the same kid, "${ch(lo)}". The middle kid has no partner, so there is nothing to compare.` : match ? `The teachers compare cards: "${ch(lo)}" and "${ch(hi)}". The same letter, so this pair is a match!` : `The teachers compare cards: "${ch(lo)}" and "${ch(hi)}". Different letters!`) : says;
        inCode = "if (s[low] != s[high])";
        break;
      case "mismatch":
        says = lo !== null && hi !== null ? `"${ch(lo)}" and "${ch(hi)}" are different, so the line is not a mirror. The teachers stop right here.` : says;
        banner = { kind: "bad", text: "Not a mirror (not a palindrome)." };
        inCode = "return false";
        break;
      case "advance":
        says = `That pair matched, so both teachers take one step inwards: Front to kid ${(lo ?? 0) + 1}, Back to kid ${(hi ?? 0) + 1}.`;
        inCode = "low++; high--";
        break;
      case "finish":
        says = result === 1 ? "The teachers met in the middle and every pair matched. The line is a perfect mirror!" : "The check ended on a mismatch: the line is not a mirror.";
        banner = result === 1 ? { kind: "good", text: "A perfect mirror (a palindrome)." } : { kind: "bad", text: "Not a mirror (not a palindrome)." };
        inCode = result === 1 ? "return true" : "return false";
        break;
    }
    return { cells, actors, says, inCode, banner };
  },
};
