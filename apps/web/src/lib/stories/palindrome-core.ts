import { anchorOf, variable, type StoryActor, type StoryFrame } from "./types";
import type { ExecutionStep } from "@algovision/trace-schema";
import { inRange, letterCells, letterOf, plural, rolesOf, textOf } from "./string-util";

type Step = ExecutionStep<"array">;

/** Narration and picture shared by the two palindrome stories, which walk the same centres and differ only in what they keep. */
export function palindromeFrame(step: Step, mode: "count" | "longest"): StoryFrame {
  const codes = step.state.values;
  const n = codes.length;
  const a = anchorOf(step);
  const left = variable(step, "left");
  const right = variable(step, "right");
  const kept = variable(step, mode === "count" ? "total" : "best") ?? 0;
  const roles = rolesOf(step);
  const cells = letterCells(step, (_, role) => (role === "found" ? "good" : role === "compared" ? "warn" : role === "pointer" ? "hit" : "plain"));
  const actors: StoryActor[] = [];
  if ((a === "centre" || a === "expand") && inRange(left, n) && inRange(right, n)) {
    actors.push({ id: "l", emoji: "👦", name: "Left", at: left, row: "bottom" });
    actors.push({ id: "r", emoji: "👧", name: "Right", at: right });
  }
  // The two letters that did not match (the stop step marks them as compared).
  const clash = [...roles].filter(([, r]) => r === "compared").map(([i]) => i).sort((x, y) => x - y);
  let says = step.explanation;
  let inCode: string | undefined;
  let banner: StoryFrame["banner"];
  switch (a) {
    case "entry":
      says = n === 0 ? "The text is empty, so there is nothing to mirror." : `A mirror reads the same forwards and backwards. Every mirror has a centre: a letter, or the gap between two letters. Try each of the ${2 * n - 1} centres, and grow outwards while the two ends match.`;
      break;
    case "init":
      says = mode === "count" ? "The count of mirrors starts at 0." : "The longest mirror starts at length 0.";
      inCode = mode === "count" ? "total = 0" : "best = 0";
      break;
    case "centre": {
      const c = (left ?? 0) + (right ?? 0) + 1;
      const where = left === right ? `the letter "${letterOf(codes, left)}"` : `the gap between "${letterOf(codes, left)}" and "${letterOf(codes, right)}"`;
      says = `Centre ${c} of ${2 * n - 1}: ${where}. One kid stands on each side of it.`;
      inCode = "left = i; right = i (or i + 1)";
      break;
    }
    case "expand": {
      const piece = inRange(left, n) && inRange(right, n) ? textOf(codes.slice(left, right + 1)) : "";
      const len = piece.length;
      says = len === 1 ? `The letter "${piece}" on its own is a mirror.` : `"${letterOf(codes, left)}" and "${letterOf(codes, right)}" match, so "${piece}" is a mirror of length ${len}.`;
      says += mode === "count" ? ` Mirrors so far: ${kept}.` : ` The longest so far is ${kept}.`;
      inCode = mode === "count" ? "while (left >= 0 && right < n && s[left] == s[right]) { total++; left--; right++; }" : "while (... s[left] == s[right]) best = max(best, right - left + 1)";
      break;
    }
    case "stop":
      says = clash.length >= 2 ? `Stop for this centre: "${letterOf(codes, clash[0])}" and "${letterOf(codes, clash[clash.length - 1])}" are different, so nothing wider can be a mirror.` : "Stop for this centre: the kids have reached the edge of the row.";
      inCode = "// the loop ends";
      break;
    case "finish": {
      const r = variable(step, "result") ?? kept;
      says = n === 0 ? "There was nothing to check." : "Every centre has been tried.";
      banner = mode === "count" ? { kind: "good", text: `The text has ${r} palindromic ${plural(r, "piece", "pieces")}.` } : { kind: "good", text: `The longest mirror has length ${r}.` };
      break;
    }
  }
  return { cells, actors, says, inCode, banner, board: mode === "count" ? { label: "Mirrors so far", text: String(kept) } : { label: "Longest mirror so far", text: String(kept) } };
}
