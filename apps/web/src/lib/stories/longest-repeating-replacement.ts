import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { inRange, letterCells, letterOf, plural, previousVariable, textOf, windowKids } from "./string-util";

/** A paint crew may repaint at most k tiles. How wide a stretch can they make all one colour? */
export const longestRepeatingReplacementStory: Story = {
  id: "longest-repeating-replacement",
  title: "The Repaint Crew",
  emoji: "🎨",
  hook: "Letter tiles lie in a row, and a paint crew has enough paint to change at most k tiles. They want the widest stretch that could be made all one letter. Two kids hold a banner over a stretch. The tiles that already match the most common letter under the banner are fine; every other tile would need repainting. If more than k tiles would need paint, the left kid steps forward and the banner shrinks. The widest allowed banner is the record.",
  cast: [
    { emoji: "👧", name: "Right kid", means: "right: the newest tile under the banner" },
    { emoji: "👦", name: "Left kid", means: "left: the oldest tile under the banner" },
    { emoji: "🎨", name: "Paint", means: "k: how many tiles may be repainted" },
    { emoji: "🏆", name: "Record", means: "best: the widest allowed banner so far" },
  ],
  moral: "A window is allowed while (its length - the count of its most common letter) is at most k. Grow on the right, shrink on the left when it breaks, and remember the widest allowed window. One pass is enough.",
  frame(step, trace): StoryFrame {
    const codes = step.state.values;
    const n = codes.length;
    const a = anchorOf(step);
    const k = variable(trace.steps[0]!, "k") ?? 0;
    const left = variable(step, "left");
    const right = variable(step, "right");
    const top = variable(step, "top") ?? 0;
    const best = variable(step, "best") ?? 0;
    const prevBest = previousVariable(trace.steps, step, "best") ?? 0;
    let bestFrom = -1;
    let bestTo = -1;
    let seenBest = 0;
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (s.source.kind === "anchor" && s.source.id === "record") {
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
      if (hasWindow && i >= left! && i <= right!) return role === "found" ? "good" : "hit";
      return "plain";
    });
    const actors = finished ? [] : windowKids(left, right, n);
    const len = hasWindow ? right! - left! + 1 : 0;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "The row is empty, so there is nothing to paint." : `The crew may repaint at most ${k} ${plural(k, "tile", "tiles")}. Find the widest stretch of the ${n} tiles that could end up all one letter.`;
        break;
      case "init":
        says = "The banner starts empty and the record is 0 tiles.";
        inCode = "left = 0; maxCount = 0; best = 0";
        break;
      case "grow":
        says = `The right kid takes the tile "${letterOf(codes, right)}" under the banner. The most common letter has appeared ${top} ${plural(top, "time", "times")} in a banner so far, so at most ${len - top} of the ${len} ${plural(len, "tile", "tiles")} would need paint.`;
        inCode = "maxCount = max(maxCount, ++count[s[right]])";
        break;
      case "shrink": {
        const need = len + 1 - top;
        says = `The banner would need ${need} repainted ${plural(need, "tile", "tiles")}, but the crew has paint for only ${k}. The left kid steps past "${letterOf(codes, (left ?? 1) - 1)}" to place ${(left ?? 0) + 1}.`;
        inCode = "while (right - left + 1 - maxCount > k) left++";
        break;
      }
      case "record":
        says = best > prevBest ? `The banner is ${len} ${plural(len, "tile", "tiles")} wide and the crew has enough paint: a new record of ${best}.` : `The banner is ${len} ${plural(len, "tile", "tiles")} wide and allowed, but it does not beat the record of ${best}.`;
        inCode = "best = max(best, right - left + 1)";
        break;
      case "finish": {
        const r = variable(step, "result") ?? best;
        says = n === 0 ? "There was nothing to paint." : "Every tile has been under the banner once. The record is the answer.";
        banner = { kind: "good", text: `The longest stretch that can become one letter has length ${r}.` };
        break;
      }
    }
    const recordText = bestFrom >= 0 ? textOf(codes.slice(bestFrom, bestTo + 1)) : "";
    return { cells, actors, says, inCode, banner, board: { label: "Record", text: best > 0 ? `${best} tiles: "${recordText}"` : "none yet" } };
  },
};
