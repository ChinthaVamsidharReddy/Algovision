import type { Tone, TrieFrame } from "./types";
import type { ExecutionStep } from "@algovision/trace-schema";
import { anchor, letterAt, numberVar } from "./trie-util";

type Step = ExecutionStep<"trie">;

/** The text with a marker on the letter being walked: letters before the ending are dim, walked letters good, the next one hit. */
export function textStrip(step: Step, text: string): TrieFrame["strip"] {
  if (text === "") return undefined;
  const i = numberVar(step, "i");
  const pos = step.state.position;
  const label = `The text: ${text}`;
  if (i === null || pos === null) return { label, items: [...text].map((c): { text: string; tone: Tone } => ({ text: c, tone: "plain" })) };
  return {
    label,
    items: [...text].map((c, k): { text: string; tone: Tone } => ({ text: c, tone: k < i ? "dim" : k < i + pos ? "good" : k === i + pos ? "hit" : "plain" })),
    at: i + pos < text.length ? i + pos : undefined,
  };
}

/** Narration shared by the two suffix-trie stories: every ending of the text is written into the tree, one road per letter. */
export function suffixSays(step: Step, text: string): { says: string; inCode?: string } | undefined {
  const a = anchor(step);
  const ch = letterAt(step);
  const i = numberVar(step, "i");
  switch (a) {
    case "init":
      return { says: "Start with only the root, an empty square. No roads yet.", inCode: "root = new TrieNode()" };
    case "suffix":
      return { says: `Next ending: "${step.state.word}", the part of the text from letter ${(i ?? 0) + 1} onwards. The walker starts at the root.`, inCode: "for (i = 0; i < n; i++)  node = root" };
    case "check":
      return { says: step.event.type === "found" ? `The room already has a road for "${ch}": this piece of the text has been seen before.` : `There is no road for "${ch}" here yet.`, inCode: "child = node.children[ch]" };
    case "create":
      return { says: `Build a new road for "${ch}" and a new room: this piece of the text has never been seen before.`, inCode: "node.children[ch] = new TrieNode()" };
    default:
      void text;
      return undefined;
  }
}
