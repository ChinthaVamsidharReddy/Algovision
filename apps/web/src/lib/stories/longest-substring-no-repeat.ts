import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { inRange, letterCells, letterOf, plural, previousVariable, textOf, windowKids } from "./string-util";

/** Two kids hold a banner over a row of letter tiles. The banner may never cover two tiles with the same letter. */
export const longestSubstringNoRepeatStory: Story = {
  id: "longest-substring-no-repeat",
  title: "The Banner With No Twins",
  emoji: "🎏",
  hook: "Letter tiles lie in a row. Two kids hold a banner over some of them. The banner may never cover two tiles with the same letter, because twins are not allowed. The right kid steps forward and brings in a new tile. If that letter is already under the banner, the left kid steps forward until the twin has gone out from under it. The kids remember the widest banner that was ever twin-free.",
  cast: [
    { emoji: "👧", name: "Right kid", means: "right: the newest tile under the banner" },
    { emoji: "👦", name: "Left kid", means: "left: the oldest tile under the banner" },
    { emoji: "🎏", name: "Banner", means: "the window between them" },
    { emoji: "🏆", name: "Record", means: "best: the widest twin-free banner so far" },
  ],
  moral: "A sliding window: grow on the right, and when a repeat appears, shrink from the left just enough to remove it. Each tile goes in once and out once, so the whole row is read in a single pass.",
  frame(step, trace): StoryFrame {
    const codes = step.state.values;
    const n = codes.length;
    const a = anchorOf(step);
    const left = variable(step, "left");
    const right = variable(step, "right");
    const best = variable(step, "best") ?? 0;
    const prevBest = previousVariable(trace.steps, step, "best") ?? 0;
    // The widest banner so far, replayed from the earlier steps.
    let bestFrom = -1;
    let bestTo = -1;
    let seenBest = 0;
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (s.source.kind === "anchor" && s.source.id === "extend") {
        const b = variable(s, "best") ?? 0;
        if (b > seenBest) {
          seenBest = b;
          bestFrom = variable(s, "left") ?? -1;
          bestTo = variable(s, "right") ?? -1;
        }
      }
    }
    const finished = a === "finish";
    const hasWindow = inRange(left, n) && inRange(right, n) && !finished;
    const cells = letterCells(step, (i, role) => {
      if (finished) return i >= bestFrom && i <= bestTo ? "good" : "plain";
      if (hasWindow && i >= left! && i <= right!) return role === "compared" ? "warn" : role === "found" ? "good" : "hit";
      return "plain";
    });
    const actors = finished ? [] : windowKids(left, right, n);
    const ch = letterOf(codes, right);
    const len = hasWindow ? right! - left! + 1 : 0;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "The row is empty, so no banner can cover anything." : `A banner is held over a row of ${n} letter tiles. The right kid takes in one tile at a time. The banner may never cover two tiles with the same letter.`;
        break;
      case "init":
        says = "The banner starts empty, and the record is 0 tiles.";
        inCode = "left = 0; best = 0";
        break;
      case "loop":
        says = `The right kid takes the tile "${ch}" (place ${(right ?? 0) + 1}) under the banner.`;
        inCode = "for (right = 0; right < n; right++)";
        break;
      case "shrink":
        says = `"${ch}" was already under the banner at place ${left}. The left kid steps forward to place ${(left ?? 0) + 1}, so the twin is out from under the banner.`;
        inCode = "left = lastSeen[ch] + 1";
        break;
      case "extend":
        says = best > prevBest ? `The banner covers ${len} ${plural(len, "tile", "tiles")} with no twins: a new record of ${best}.` : `The banner covers ${len} ${plural(len, "tile", "tiles")} with no twins. That does not beat the record of ${best}.`;
        inCode = "best = max(best, right - left + 1)";
        break;
      case "finish": {
        const r = variable(step, "result") ?? best;
        says = n === 0 ? "There was nothing to cover." : "Every tile has been under the banner once. The record is the answer.";
        banner = { kind: "good", text: `The longest stretch with no repeated letter has length ${r}.` };
        break;
      }
    }
    const recordText = bestFrom >= 0 ? textOf(codes.slice(bestFrom, bestTo + 1)) : "";
    return { cells, actors, says, inCode, banner, board: { label: "Record", text: best > 0 ? `${best} tiles: "${recordText}"` : "none yet" } };
  },
};
