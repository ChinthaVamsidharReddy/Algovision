import { anchorOf, variable, type Story, type StoryActor, type StoryCell, type StoryFrame } from "./types";
import { indexWithRole } from "./ledger-util";

/** Lower bound and upper bound differ by one comparison, so they share one retelling. */
export function boundStory(kind: "lower" | "upper"): Story {
  const lower = kind === "lower";
  const word = lower ? "at least" : "greater than";
  return {
    id: lower ? "lower-bound" : "upper-bound",
    title: lower ? "Where Would My Number Sit?" : "Just Past My Number",
    emoji: lower ? "🎟️" : "🚧",
    hook: lower
      ? "Raffle tickets are laid out in sorted order, with some numbers repeated. You hold a number and want to know the first place on the line where a ticket is at least as big as yours: the spot where yours would be slipped in before any equal ones. If every ticket is smaller, the answer is the spot just after the last ticket."
      : "Raffle tickets are laid out in sorted order, with some numbers repeated. You hold a number and want the first place on the line where a ticket is strictly bigger than yours: just past every ticket equal to yours. If no ticket is bigger, the answer is the spot just after the last ticket.",
    cast: [
      { emoji: "🚩", name: "Start flag", means: "low: the first spot still possible" },
      { emoji: "🔍", name: "Peek", means: "mid: the spot being checked" },
      { emoji: "📍", name: "Answer", means: lower ? "the first value that is at least the target" : "the first value that is greater than the target" },
    ],
    moral: lower
      ? "Lower bound asks the question \"is this value at least the target?\". If yes, the answer is here or to the left (keep mid); if no, it is to the right. The flags close in on the first yes."
      : "Upper bound asks \"is this value greater than the target?\". If yes, the answer is here or to the left (keep mid); if no, it is to the right. The flags close in on the first yes.",
    frame(step, trace): StoryFrame {
      const a = anchorOf(step);
      const values = step.state.values;
      const n = values.length;
      const target = variable(trace.steps[0]!, "target") ?? 0;
      const low = variable(step, "low");
      const high = variable(step, "high");
      const mid = variable(step, "mid");
      const answer = variable(step, "answer");
      const pass = (v: number) => (lower ? v >= target : v > target);
      const cells: StoryCell[] = values.map((v, i) => {
        const inPlay = low !== null && high !== null ? i >= low && i < high : true;
        const done = a === "finish";
        return { main: String(v), sub: `spot ${i}`, tone: done && answer === i ? "good" : i === mid && ["loop", "compare"].includes(a) ? (a === "compare" ? (pass(v) ? "good" : "warn") : "hit") : done ? "dim" : inPlay ? "plain" : "dim" };
      });
      const actors: StoryActor[] = [];
      if (low !== null && low < n && a !== "finish") actors.push({ id: "lo", emoji: "🚩", name: "Start", at: low, row: "bottom" });
      if (mid !== null && mid < n && ["loop", "compare"].includes(a)) actors.push({ id: "mid", emoji: "🔍", name: "Peek", at: mid });
      if (answer !== null && answer < n && a === "finish") actors.push({ id: "ans", emoji: "📍", name: "Answer", at: answer });
      const midValue = mid !== null && mid < n ? values[mid]! : null;
      const remaining = low !== null && high !== null ? Math.max(0, high - low) : n;
      const left = indexWithRole(step, "found");
      void left;
      let says = step.explanation;
      let inCode: string | undefined;
      let banner: StoryFrame["banner"];
      switch (a) {
        case "entry":
          says = n === 0 ? `There are no tickets, so ${target} would go at spot 0.` : `Find the first ticket ${word} ${target} among ${n} sorted tickets. The answer can be spot ${n}, just past the end.`;
          break;
        case "init":
          says = `Every spot from 0 to ${n} is still possible, including the spot after the last ticket.`;
          inCode = "low = 0; high = n";
          break;
        case "loop":
          says = remaining > 0 ? `${remaining} ${remaining === 1 ? "spot is" : "spots are"} still possible. Check the middle one, spot ${mid}, which shows ${midValue}.` : "No spot is left to check.";
          inCode = "while (low < high)";
          break;
        case "compare":
          says = midValue !== null && pass(midValue) ? `${midValue} is ${word} ${target}, so spot ${mid} could be the answer. Keep it and look to the left for an earlier one.` : `${midValue} is not ${word} ${target}, so the answer is somewhere to the right of spot ${mid}.`;
          inCode = lower ? "if (values[mid] >= target)" : "if (values[mid] > target)";
          break;
        case "go-right":
          says = `The answer is after the spot just checked, so the Start flag moves to spot ${low}.`;
          inCode = "low = mid + 1";
          break;
        case "go-left":
          says = `The answer is at spot ${high} or earlier, so everything to its right is thrown away.`;
          inCode = "high = mid";
          break;
        case "finish":
          says = answer !== null && answer < n ? `The flags have met. The first ticket ${word} ${target} is ${values[answer]}, at spot ${answer}.` : `The flags have met after the last ticket: no ticket is ${word} ${target}, so the answer is spot ${n}.`;
          banner = { kind: "good", text: answer !== null && answer < n ? `Answer: spot ${answer} (the ticket ${values[answer]}).` : `Answer: spot ${answer ?? n}, just past the end.` };
          break;
      }
      return { cells, actors, says, inCode, banner, board: { label: "Spots still possible", text: low !== null && high !== null ? (high > low ? `${low} to ${high - 1}` : "none") : `0 to ${n}` } };
    },
  };
}
export const lowerBoundStory = boundStory("lower");
export const upperBoundStory = boundStory("upper");
