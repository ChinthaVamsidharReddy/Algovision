import { anchorOf, type PileFrame, type PileStory, type Tone } from "./types";
import { inputNumber, inputValues, isLast, roleAt, toneOfRole, variable } from "./pile-util";

/** A window slides along a row of people; a short line of 'still could be the tallest' candidates keeps the answer at its front. */
export const slidingWindowMaximumStory: PileStory = {
  id: "sliding-window-maximum",
  kind: "pile",
  shape: "queue",
  title: "The Tallest in the Window",
  emoji: "🪟",
  hook: "A window slides along a row of people, always showing the same number of them. At each position you want the tallest person in view. A short line of candidates keeps the answer. A new person joining at the back sends every shorter candidate home: while this taller person is in view those shorter ones can never be the tallest. People who slide out of view leave from the front. The front of the line is always the tallest in the window.",
  cast: [
    { emoji: "🧍", name: "Person", means: "an element, with its height" },
    { emoji: "🪟", name: "Window", means: "the k people in view right now" },
    { emoji: "🏅", name: "Candidates", means: "the queue: people who could still be the tallest, tallest first" },
  ],
  moral: "Keep candidates in decreasing order: weaker ones at the back are dropped by a stronger newcomer, and old ones at the front drop out when they leave the window. The front is always the maximum, and each person is added and removed once.",
  frame(step, trace): PileFrame {
    const a = anchorOf(step);
    const values = inputValues(trace);
    const k = inputNumber(trace, "k") ?? 1;
    const i = variable(step, "i");
    const items = step.state.items;
    const maxes: number[] = [];
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (s.source.kind === "anchor" && s.source.id === "record") {
        const m = variable(s, "max");
        if (m !== undefined) maxes.push(m);
      }
    }
    const from = i === undefined ? 0 : Math.max(0, i - k + 1);
    const strip = {
      label: `Heights, window of ${k}`,
      items: values.map((v, p) => ({ text: String(v), tone: (a === "finish" ? "dim" : i !== undefined && p >= from && p <= i ? (p === i ? "hit" : "warn") : i !== undefined && p < from ? "dim" : "plain") as Tone })),
      at: a === "finish" ? undefined : i,
    };
    const pile = items.map((v, p) => ({ text: String(v), tone: (roleAt(step, p) === "found" ? "good" : toneOfRole(roleAt(step, p))) as Tone }));
    const v = variable(step, "value");
    const prev = step.index > 0 ? trace.steps[step.index - 1]!.state.items : [];
    const gone = prev.find((x, p) => items[p] !== x) ?? prev[prev.length - 1];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: PileFrame["banner"];
    switch (a) {
      case "entry":
        says = `A window of ${k} slides along ${values.length} ${values.length === 1 ? "person" : "people"}. The candidate line starts empty.`;
        break;
      case "loop":
        says = `The window moves on: person ${(i ?? 0) + 1}, height ${v}, comes into view.`;
        inCode = "for (i = 0; i < n; i++)";
        break;
      case "pop-front":
        says = `The person at the front of the line (height ${gone}) has slid out of the window, so they leave the line.`;
        inCode = "if (deque.front() is outside the window) deque.pollFirst()";
        break;
      case "pop-back":
        says = `The person at the back of the line (height ${prev[prev.length - 1]}) is shorter than the newcomer (${v}). While the newcomer is in view they can never be the tallest, so they go home.`;
        inCode = "while (deque.last() < value) deque.pollLast()";
        break;
      case "push-back":
        says = `The newcomer (${v}) joins the back of the line. The line now has ${items.length}, tallest at the front.`;
        inCode = "deque.addLast(value)";
        break;
      case "record": {
        const m = variable(step, "max");
        says = `The window is full. The tallest in view is the person at the front of the line: ${m}.`;
        inCode = "result.add(deque.peekFirst())";
        break;
      }
      case "finish":
        says = "The window has reached the end of the row.";
        break;
    }
    if (isLast(step, trace)) banner = { kind: "good", text: maxes.length ? `The tallest in each window: ${maxes.join(", ")}.` : "The row is shorter than the window: no full window." };
    return { strip, pile, pileName: "Candidates (tallest is at the front, on the left)", says, inCode, banner, board: { label: "Tallest so far", text: maxes.length ? maxes.join(", ") : "none yet" } };
  },
};
