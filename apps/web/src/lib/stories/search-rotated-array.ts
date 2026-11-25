import { anchorOf, variable, type Story, type StoryActor, type StoryCell, type StoryFrame } from "./types";
import { outside } from "./ledger-util";

/** A sorted row of lockers whose start was turned like a dial: one side of the middle is always still in order. */
export const searchRotatedStory: Story = {
  id: "search-rotated-array",
  title: "The Turned Dial",
  emoji: "🔄",
  hook: "A row of numbered lockers was in order, but somebody turned the row like a dial, so the smallest numbers now sit near the middle or the end. Binary search still works, thanks to one fact: whichever way you split the row, at least one half is still perfectly in order. Check that half: if your number lies inside its range, go there; otherwise it must be in the other half.",
  cast: [
    { emoji: "🚩", name: "Start flag", means: "low: the first locker in play" },
    { emoji: "🏁", name: "End flag", means: "high: the last locker in play" },
    { emoji: "🔍", name: "Peek", means: "mid: the locker being checked" },
  ],
  moral: "In a rotated sorted array one half around the middle is always sorted. Test whether the target falls inside that half's range to decide where to go, and the search stays O(log n).",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const values = step.state.values;
    const n = values.length;
    const target = variable(trace.steps[0]!, "target") ?? 0;
    const low = variable(step, "low");
    const high = variable(step, "high");
    const mid = variable(step, "mid");
    const ok = (i: number | null): i is number => i !== null && i >= 0 && i < n;
    const midValue = ok(mid) ? values[mid]! : null;
    const lowValue = ok(low) ? values[low]! : null;
    const last = trace.steps[trace.steps.length - 1]!;
    const foundAt = anchorOf(last) === "found" && ok(variable(last, "mid")) && values[variable(last, "mid")!] === target ? variable(last, "mid") : null;
    const cells: StoryCell[] = values.map((v, i) => ({
      main: String(v),
      sub: `locker ${i + 1}`,
      tone: foundAt === i && step.index === trace.steps.length - 1 ? "good" : i === mid && ["loop", "found", "which-half"].includes(a) ? "hit" : outside(i, low, high) ? "dim" : "plain",
    }));
    const actors: StoryActor[] = [];
    if (ok(low) && a !== "finish") actors.push({ id: "lo", emoji: "🚩", name: "Start", at: low, row: "bottom" });
    if (ok(high) && a !== "finish") actors.push({ id: "hi", emoji: "🏁", name: "End", at: high, row: "bottom" });
    if (ok(mid) && ["loop", "found", "which-half"].includes(a)) actors.push({ id: "mid", emoji: "🔍", name: "Peek", at: mid });
    const leftSorted = lowValue !== null && midValue !== null && lowValue <= midValue;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? `There are no lockers, so ${target} is not here.` : `Find ${target} in a row of ${n} lockers that was in order before somebody turned the dial.`;
        break;
      case "init":
        says = "All the lockers are in play.";
        inCode = "low = 0; high = n - 1";
        break;
      case "loop":
        says = `Open the middle locker, number ${(mid ?? 0) + 1}.`;
        inCode = "mid = low + (high - low) / 2";
        break;
      case "found":
        says = midValue === target ? `${midValue} is exactly ${target}. Found it!` : `Locker ${(mid ?? 0) + 1} holds ${midValue}, which is not ${target}.`;
        inCode = "if (values[mid] == target) return mid";
        if (midValue === target) banner = { kind: "good", text: `${target} is in locker ${(mid ?? 0) + 1} (index ${mid}).` };
        break;
      case "which-half":
        says = leftSorted ? `The first locker in play (${lowValue}) is no bigger than the middle (${midValue}), so the left half is still in order.` : `The first locker in play (${lowValue}) is bigger than the middle (${midValue}), so the dial was turned inside the left half. The right half is the one still in order.`;
        inCode = "if (values[low] <= values[mid])";
        break;
      case "in-left":
        says = `${target} belongs to the left part, so the End flag moves to locker ${(high ?? 0) + 1}.`;
        inCode = "high = mid - 1";
        break;
      case "in-right":
        says = `${target} belongs to the right part, so the Start flag moves to locker ${(low ?? 0) + 1}.`;
        inCode = "low = mid + 1";
        break;
      case "finish":
        says = `No lockers are left in play, and ${target} was not in any of the ones opened.`;
        inCode = "return -1";
        break;
    }
    if (step.index === trace.steps.length - 1 && a !== "found") banner = { kind: "info", text: `${target} is not in the row.` };
    if (step.index === trace.steps.length - 1 && a === "found" && midValue !== target) banner = { kind: "info", text: `${target} is not in the row.` };
    return { cells, actors, says, inCode, banner, board: { label: "Lockers in play", text: ok(low) && ok(high) && high >= low ? `${low + 1} to ${high + 1}` : "none" } };
  },
};
