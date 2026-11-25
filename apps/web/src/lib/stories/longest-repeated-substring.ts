import type { TrieFrame, TrieStory } from "./types";
import { anchor, inputText, isLast, letterAt, numberVar, pathText, trieTones, walker } from "./trie-util";
import { suffixSays, textStrip } from "./suffix-trie-core";

/** In the tree of all endings, a room that two endings walk through is a piece that appears at least twice; the deepest such room is the answer. */
export const longestRepeatedStory: TrieStory = {
  id: "longest-repeated-substring",
  kind: "trie",
  title: "The Deepest Shared Road",
  emoji: "🛣️",
  hook: "Which piece of a word appears at least twice? Write down every ending of the word and walk each one along the letter roads. Every room remembers how many endings have walked through it. If two endings walk through the same room, the letters on the road to that room appear in two places of the word. The deepest room with a count of two or more gives the longest piece that repeats.",
  cast: [
    { emoji: "🚶", name: "Walker", means: "current: the room you are standing in" },
    { emoji: "🔤", name: "Text", means: "the word; the marked letter is the next one to walk" },
    { emoji: "×2", name: "Count", means: "how many endings have walked through this room" },
  ],
  moral: "A room reached by two or more suffixes means its path is a substring that appears at least twice. The deepest such room is the longest repeated substring. The counts on the nodes do the whole job.",
  frame(step, trace): TrieFrame {
    const a = anchor(step);
    const s = inputText(trace);
    const best = numberVar(step, "best") ?? 0;
    const ch = letterAt(step);
    const cur = step.state.nodes.find((n) => n.id === step.state.current);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: TrieFrame["banner"];
    const shared = suffixSays(step, s);
    if (shared) ({ says, inCode } = shared);
    const badges: Record<string, string> = {};
    for (const n of step.state.nodes) if (n.count >= 2) badges[n.id] = `×${n.count}`;
    switch (a) {
      case "entry":
        says = s === "" ? "The text is empty, so nothing can repeat." : `Find the longest piece of "${s}" that appears at least twice. Write each ending along the roads, and let every room count the endings that walk through it.`;
        break;
      case "create":
        says = `Build a new road for "${ch}" and a new room: this piece has not been seen before.`;
        break;
      case "descend":
        says = `Walk down the "${ch}" road. This room's count goes up to ${cur?.count ?? 1}${(cur?.count ?? 1) >= 2 ? ": two endings have been here, so the road to it is a piece that appears twice" : ""}.`;
        inCode = "node = node.children[ch]; node.count++";
        break;
      case "best":
        says = `Two endings share this road, so a piece of length ${best} appears at least twice. It is the longest found so far.`;
        inCode = "if (node.count >= 2) best = max(best, depth)";
        break;
      case "finish":
        says = s === "" ? "There is nothing to search." : "Every ending has been written down. The deepest room with a count of two or more holds the answer.";
        break;
    }
    if (isLast(step, trace)) {
      const r = numberVar(step, "result") ?? best;
      const target = step.highlights.find((h) => h.target.kind === "node" && h.role === "found" && (h.label ?? "").startsWith("len"));
      const text = target && target.target.kind === "node" ? pathText(step, target.target.id) : "";
      banner = r === 0 ? { kind: "info", text: "No piece of the text appears twice: length 0." } : { kind: "good", text: `The longest piece that appears twice is "${text}", length ${r}.` };
    }
    return { tones: trieTones(step), actors: walker(step), strip: textStrip(step, s), badges, says, inCode, banner, board: { label: "Longest repeated piece so far", text: `length ${best}` } };
  },
};
