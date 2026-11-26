import { anchorOf, variable, type Story, type StoryActor, type StoryCell, type StoryFrame } from "./types";
import { sortTone } from "./sort-util";
import { rolesOf } from "./string-util";

/** A row of seats with one free seat at the end: to let someone in the middle, everyone behind slides one seat along, starting from the back. */
export const insertAtIndexStory: Story = {
  id: "insert-at-index",
  title: "Making Room in the Row",
  emoji: "💺",
  hook: "People sit in a row and there is one free seat at the very end. A newcomer wants a seat in the middle. Nobody can sit on top of somebody else, so everyone from that seat onwards slides one seat to the right. The sliding must start from the back, the person next to the free seat first, or somebody would be overwritten. Then the newcomer sits in the gap.",
  cast: [
    { emoji: "💺", name: "Free seat", means: "the spare slot at the end of the array" },
    { emoji: "➡️", name: "Mover", means: "i: the seat that is being filled by the person on its left" },
    { emoji: "🧍", name: "Newcomer", means: "value: the person who takes the gap" },
  ],
  moral: "Inserting into the middle of an array moves every later element one place, so it takes O(n) time. Shifting from the back is what keeps the data safe.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const first = trace.steps[0]!;
    const n0 = variable(first, "n") ?? 0;
    const index = variable(first, "index") ?? 0;
    const value = variable(first, "value");
    const i = variable(step, "i");
    const roles = rolesOf(step);
    const cells: StoryCell[] = step.state.values.map((v, p) => ({
      main: step.index === 0 && p === n0 ? "–" : String(v),
      sub: p === n0 && step.index === 0 ? "free seat" : `seat ${p + 1}`,
      tone: roles.get(p) === "created" ? "plain" : sortTone(roles.get(p)),
    }));
    const actors: StoryActor[] = [];
    if (i !== null && ["shift-loop", "shift"].includes(a)) actors.push({ id: "m", emoji: "➡️", name: "Mover", at: i });
    if (a === "place") actors.push({ id: "n", emoji: "🧍", name: "Newcomer", at: index });
    const shifts = trace.steps.filter((s) => s.index <= step.index && anchorOf(s) === "shift").length;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `${n0} ${n0 === 1 ? "person sits" : "people sit"} in a row with one free seat at the end. Newcomer ${value} wants seat ${index + 1}.`;
        break;
      case "shift-loop":
        says = `Work from the back. Seat ${(i ?? 0) + 1} must be filled next, by the person now in seat ${i}.`;
        inCode = "for (i = n; i > index; i--)";
        break;
      case "shift":
        says = `${step.state.values[i ?? 0]} slides from seat ${i} to seat ${(i ?? 0) + 1}.`;
        inCode = "values[i] = values[i - 1]";
        break;
      case "place":
        says = `The gap is at seat ${index + 1}. Newcomer ${value} sits down in it.`;
        inCode = "values[index] = value";
        break;
      case "finish":
        says = `Everyone has a seat. The row now has ${step.state.values.length} ${step.state.values.length === 1 ? "person" : "people"}, and ${shifts} ${shifts === 1 ? "person" : "people"} had to move.`;
        banner = { kind: "good", text: `Now: ${step.state.values.join(", ")}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "People who had to move", text: String(shifts) } };
  },
};
