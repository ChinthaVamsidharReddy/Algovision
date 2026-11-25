import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { indexWithRole, joined, slotCells } from "./ledger-util";

/** A doorman with a guest list: each arriving badge number is checked against the list; the first number seen twice is caught. */
export const firstRepeatingStory: Story = {
  id: "first-repeating-element",
  title: "The Doorman Who Spots a Repeat",
  emoji: "🚪",
  hook: "Guests arrive one by one, each holding a badge number. The doorman keeps a list of every number that has already come in. When a guest arrives, he looks at the list: if the number is there, somebody with that badge came earlier, and he stops the line. If not, he writes the number down and lets the guest in.",
  cast: [
    { emoji: "🧑‍💼", name: "Doorman", means: "i: the guest being checked" },
    { emoji: "📝", name: "Guest list", means: "the hash set of numbers seen so far" },
    { emoji: "✋", name: "Stop!", means: "the first repeated number" },
  ],
  moral: "A hash set answers \"have I seen this?\" in about one step, so the first repeat is found in a single pass instead of comparing every pair.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const n = step.state.values.length;
    const i = variable(step, "i");
    const value = variable(step, "value");
    const seen: number[] = [];
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      if (anchorOf(s) === "store") {
        const v = variable(s, "value");
        if (v !== null) seen.push(v);
      }
    }
    const last = trace.steps[trace.steps.length - 1]!;
    const repeat = anchorOf(last) === "found" ? variable(last, "value") : null;
    const cells = slotCells(step, Number.NaN, (k) => `guest ${k + 1}`);
    const actors: StoryActor[] = i !== null && !["entry", "init-set", "finish"].includes(a) ? [{ id: "d", emoji: "🧑‍💼", name: "Doorman", at: i }] : [];
    const earlier = indexWithRole(step, "found");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "Nobody is arriving." : `${n} ${n === 1 ? "guest" : "guests"} will arrive. The doorman watches for the first badge number he sees twice.`;
        break;
      case "init-set":
        says = "The guest list is blank.";
        inCode = "seen = new HashSet()";
        break;
      case "loop":
        says = `Guest ${(i ?? 0) + 1} arrives with badge ${value}.`;
        inCode = "for (value : values)";
        break;
      case "check-seen":
        says = seen.includes(value ?? NaN) ? `Badge ${value} is on the list already!` : `Badge ${value} is not on the list, so this is a new guest.`;
        inCode = "if (seen.contains(value))";
        break;
      case "store":
        says = `Write ${value} on the list and let the guest in.`;
        inCode = "seen.add(value)";
        break;
      case "found":
        says = `Stop the line! Badge ${value} came in as guest ${(earlier ?? 0) + 1} and has now arrived again as guest ${(i ?? 0) + 1}.`;
        inCode = "return value";
        banner = { kind: "bad", text: `First repeat: badge ${value}.` };
        break;
      case "not-found":
        says = "Every guest has been checked and no badge came twice.";
        inCode = "return -1";
        banner = { kind: "good", text: "No repeats: every badge was new." };
        break;
    }
    if (repeat === null && a === "found") banner = { kind: "bad", text: `First repeat: badge ${value}.` };
    return { cells, actors, says, inCode, banner, board: { label: "Guest list", text: joined(seen, "blank") } };
  },
};
