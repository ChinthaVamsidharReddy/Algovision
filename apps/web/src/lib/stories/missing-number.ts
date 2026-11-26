import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { sortTone } from "./sort-util";
import { rolesOf } from "./string-util";

/** Raffle tickets numbered 0 to n with one ticket lost: the sum that should be there, minus the sum that is, is the lost number. */
export const missingNumberStory: Story = {
  id: "missing-number",
  title: "The Lost Raffle Ticket",
  emoji: "🎟️",
  hook: "A box should hold raffle tickets numbered 0 up to n, but one ticket is lost. There is no need to sort or search. Work out what all the numbers 0 to n would add up to (a quick formula), add up the tickets that are really in the box, and the difference is the number of the lost ticket.",
  cast: [
    { emoji: "🧮", name: "Counter", means: "i: the ticket being added to the running sum" },
    { emoji: "🎟️", name: "Ticket", means: "a number from the box" },
  ],
  moral: "When numbers 0 to n are all present except one, the missing one is (n × (n + 1) / 2) minus the sum of what is there: O(n) time, O(1) space, no sorting.",
  frame(step): StoryFrame {
    const a = anchorOf(step);
    const values = step.state.values;
    const n = values.length;
    const i = variable(step, "i");
    const expected = variable(step, "expected");
    const sum = variable(step, "sum");
    const missing = variable(step, "missing");
    const roles = rolesOf(step);
    const cells = values.map((v, p) => ({ main: String(v), sub: `ticket ${p + 1}`, tone: roles.get(p) === "visited" ? ("good" as const) : sortTone(roles.get(p)) }));
    const actors: StoryActor[] = i !== null && i < n && a === "add" ? [{ id: "c", emoji: "🧮", name: "Counter", at: i }] : [];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `${n} ${n === 1 ? "ticket is" : "tickets are"} in the box, taken from the numbers 0 to ${n}. Exactly one number is missing.`;
        break;
      case "init":
        says = `If nothing were lost, the numbers 0 to ${n} would add up to ${expected}. The running sum of the real tickets starts at 0.`;
        inCode = "expected = n * (n + 1) / 2";
        break;
      case "add":
        says = `Add ticket ${values[i ?? 0]}: the running sum is ${sum}.`;
        inCode = "sum += values[i]";
        break;
      case "finish":
        says = `The tickets add up to ${sum}, but they should add up to ${expected}. The difference, ${missing}, is the lost ticket.`;
        banner = { kind: "good", text: `The missing ticket is ${missing}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Sum so far / should be", text: expected === null ? "not worked out yet" : `${sum ?? 0} / ${expected}` } };
  },
};
