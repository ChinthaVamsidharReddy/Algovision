import type { TrieFrame, TrieStory } from "./types";
import { anchor, inputText, isLast, letterAt, numberVar, trieTones, walker } from "./trie-util";
import { suffixSays, textStrip } from "./suffix-trie-core";

/** Every piece of a text is the start of one of its endings, so writing all the endings into a tree of roads builds one room per distinct piece. */
export const trieDistinctSubstringsStory: TrieStory = {
  id: "trie-distinct-substrings",
  kind: "trie",
  title: "Every New Room Is a New Piece",
  emoji: "🧩",
  hook: "How many different pieces can be cut out of a word? Write down every ending of the word: for 'aba' that is 'aba', 'ba' and 'a'. Every piece of the word is the beginning of one of these endings. Walk each ending along the letter roads, building a road when it is missing. A road you have to build means a piece nobody has seen before, so the number of rooms built is exactly the number of different pieces.",
  cast: [
    { emoji: "🚶", name: "Walker", means: "current: the room you are standing in" },
    { emoji: "🔤", name: "Text", means: "the word; the marked letter is the next one to walk" },
    { emoji: "🆕", name: "New room", means: "a piece of the text not seen before" },
  ],
  moral: "Every substring is a prefix of some suffix. Put all suffixes in a trie, and the number of nodes (besides the root) is the number of distinct substrings: each walk only builds what is genuinely new.",
  frame(step, trace): TrieFrame {
    const a = anchor(step);
    const s = inputText(trace);
    const count = numberVar(step, "count") ?? 0;
    const ch = letterAt(step);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: TrieFrame["banner"];
    const shared = suffixSays(step, s);
    if (shared) ({ says, inCode } = shared);
    switch (a) {
      case "entry":
        says = s === "" ? "The text is empty, so it has no pieces at all." : `Count the different pieces of "${s}". Write each ending of the text along the roads: every room that has to be built is a new piece.`;
        break;
      case "create":
        says = `Build a new road for "${ch}" and a new room: this piece has never been seen before. Different pieces so far: ${count}.`;
        break;
      case "descend":
        says = `Walk down the "${ch}" road into the next room.`;
        inCode = "node = node.children[ch]";
        break;
      case "finish":
        says = s === "" ? "There is nothing to count." : `Every ending has been written down. The tree has ${count} rooms besides the root.`;
        break;
    }
    if (isLast(step, trace)) {
      const r = numberVar(step, "result") ?? count;
      banner = { kind: "good", text: `The text has ${r} distinct ${r === 1 ? "substring" : "substrings"}.` };
    }
    return { tones: trieTones(step), actors: walker(step), strip: textStrip(step, s), says, inCode, banner, board: { label: "Different pieces so far", text: String(count) } };
  },
};
