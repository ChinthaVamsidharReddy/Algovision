import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { inRange, letterCells, letterOf, plural } from "./string-util";

/** Roll call: first count how often each letter appears, then walk the row again and stop at the first loner. */
export const firstUniqueCharacterStory: Story = {
  id: "first-unique-character",
  title: "The First Loner",
  emoji: "🕵️",
  hook: "Letter tiles stand in a row. You want the first tile whose letter appears nowhere else in the row, the first loner. An inspector walks along the row twice. On the first walk the inspector just counts how often each letter appears. On the second walk the inspector stops at the first tile whose letter was counted only once.",
  cast: [
    { emoji: "🕵️", name: "Inspector", means: "i: the tile being looked at" },
    { emoji: "📋", name: "Tally", means: "the count of each letter" },
    { emoji: "🏆", name: "Loner", means: "the answer: the first letter counted once" },
  ],
  moral: "Two passes beat comparing every pair: count first, then look for the first count of 1. The counts live in a small table, so the whole job is O(n).",
  frame(step, trace): StoryFrame {
    const codes = step.state.values;
    const n = codes.length;
    const a = anchorOf(step);
    const i = variable(step, "i");
    const seen = variable(step, "seen") ?? 0;
    const result = variable(step, "result");
    // The tally so far, replayed from the counting steps (letters in the order they first appeared).
    const tally = new Map<string, number>();
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (s.source.kind === "anchor" && s.source.id === "count") {
        const idx = variable(s, "i");
        const c = variable(s, "seen");
        if (idx !== null && c !== null) tally.set(letterOf(s.state.values, idx), c);
      }
    }
    const scanning = a === "scan" || a === "found" || a === "none";
    const finalCount = (idx: number) => {
      let c = 0;
      for (const v of codes) if (v === codes[idx]) c++;
      return c;
    };
    const cells = letterCells(
      step,
      (idx, role) => {
        if (a === "found") return idx === i ? "good" : idx < (i ?? 0) ? "dim" : "plain";
        if (a === "none") return "dim";
        if (a === "scan") return idx === i ? "warn" : idx < (i ?? 0) ? "dim" : "plain";
        if (a === "count") return idx === i ? "hit" : role === "visited" ? "plain" : "plain";
        return "plain";
      },
      (idx) => (scanning ? `×${finalCount(idx)}` : `${idx + 1}`),
    );
    const actors = inRange(i, n) && a !== "none" ? [{ id: "i", emoji: "🕵️", name: "Inspector", at: i, row: "bottom" as const }] : [];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    const ch = letterOf(codes, i);
    switch (a) {
      case "entry":
        says = n === 0 ? "The row is empty, so there is no loner." : `Find the first tile in a row of ${n} whose letter appears only once. First count the letters, then look for the first count of 1.`;
        break;
      case "count":
        says = `Walk 1: the inspector counts "${ch}". It has now been seen ${seen} ${plural(seen, "time", "times")}.`;
        inCode = "count[s[i]]++";
        break;
      case "scan":
        says = `Walk 2: "${ch}" appears ${seen} ${plural(seen, "time", "times")}, so it is not a loner. Keep walking.`;
        inCode = "if (count[s[i]] == 1) return i";
        break;
      case "found":
        says = `Walk 2: "${ch}" appears only once. It is the first loner, at index ${i}.`;
        inCode = "return i";
        break;
      case "none":
        says = n === 0 ? "The row is empty, so there is no loner. The answer is -1." : "Every letter appears more than once, so there is no loner. The answer is -1.";
        inCode = "return -1";
        break;
    }
    if (a === "found" && result !== null) banner = { kind: "good", text: `The first letter that appears only once is "${letterOf(codes, result)}", at index ${result}.` };
    if (a === "none") banner = { kind: "bad", text: "Every letter repeats, so the answer is -1." };
    const tallyText = tally.size ? [...tally].map(([c, k]) => `${c}×${k}`).join(", ") : "empty";
    return { cells, actors, says, inCode, banner, board: { label: "Tally", text: tallyText } };
  },
};
