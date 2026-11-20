import { anchorOf, type PileFrame, type PileStory, type Tone } from "./types";
import { inputValues, isLast, roleAt, toneOfRole, variable } from "./pile-util";

/** A streak counter: for each day, how many days in a row (counting today) had a price no higher than today's? */
export const stockSpanStory: PileStory = {
  id: "stock-span",
  kind: "pile",
  shape: "stack",
  title: "How Long Has Today Been the Best?",
  emoji: "📈",
  hook: "A shop records its price each day. For every day you want to know: counting back from today, how many days in a row had a price no higher than today's? A pile keeps the earlier days that were pricier than everything after them. A day with a lower or equal price than today is useless for the answer, so it is thrown off the pile. Whatever day is left on top is the last pricier day, and the days after it make today's streak.",
  cast: [
    { emoji: "📅", name: "Day", means: "an element, with its price" },
    { emoji: "🏔️", name: "Higher-day pile", means: "the stack: earlier days that no later day has beaten yet" },
    { emoji: "📏", name: "Span", means: "today's streak length" },
  ],
  moral: "Today's span runs back to the nearest earlier day with a higher price. A stack that throws away every day no higher than today finds that day instantly, and each day is pushed and popped once.",
  frame(step, trace): PileFrame {
    const a = anchorOf(step);
    const prices = inputValues(trace);
    const spans: number[] = [];
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (s.source.kind === "anchor" && s.source.id === "compute") {
        const sp = variable(s, "span");
        if (sp !== undefined) spans.push(sp);
      }
    }
    const i = variable(step, "i");
    const items = step.state.items;
    const strip = {
      label: "Daily prices",
      items: prices.map((p, k) => ({ text: String(p), tone: (a !== "finish" && k === i ? "hit" : k < spans.length ? "good" : "plain") as Tone })),
      at: a === "finish" ? undefined : i,
    };
    const pile = items.map((idx, k) => ({ text: String(prices[idx]), sub: `day ${idx + 1}`, tone: toneOfRole(roleAt(step, k)) }));
    const price = variable(step, "price");
    const topIdx = items[items.length - 1];
    const span = variable(step, "span");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: PileFrame["banner"];
    switch (a) {
      case "entry":
        says = prices.length === 0 ? "No days recorded." : `${prices.length} ${prices.length === 1 ? "day" : "days"} of prices. The pile of higher days starts empty.`;
        break;
      case "loop":
        says = `Day ${(i ?? 0) + 1}: the price is ${price}.`;
        inCode = "for (i = 0; i < n; i++)";
        break;
      case "while-check": {
        const role = roleAt(step, items.length - 1);
        if (items.length === 0) says = "No earlier day is on the pile, so no earlier day is higher.";
        else if (role === "found") says = `The day on top of the pile (price ${prices[topIdx!]}) is not higher than today (${price}), so it is part of today's streak: remove it.`;
        else says = `The day on top of the pile (price ${prices[topIdx!]}) is higher than today (${price}), so today's streak stops right after it.`;
        inCode = "while (!stack.isEmpty() && prices[stack.peek()] <= price)";
        break;
      }
      case "pop":
        says = "That day is no higher than today, so it leaves the pile. It can never matter again, because today is at least as high.";
        inCode = "stack.pop()";
        break;
      case "compute":
        says = `Today's streak is ${span} ${span === 1 ? "day" : "days"}: ${items.length === 0 ? "every day so far" : `every day after day ${topIdx! + 1}`} was no higher.`;
        inCode = "span = stack.isEmpty() ? i + 1 : i - stack.peek()";
        break;
      case "push":
        says = "Today joins the pile of days that have not been beaten yet.";
        inCode = "stack.push(i)";
        break;
      case "finish":
        says = "Every day has its streak.";
        break;
    }
    if (isLast(step, trace)) banner = { kind: "good", text: `The streak for each day: ${spans.join(", ")}.` };
    return { strip, pile, pileName: "Higher-day pile (top is at the top)", says, inCode, banner, board: { label: "Streaks so far", text: spans.length ? spans.join(", ") : "none yet" } };
  },
};
