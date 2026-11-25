import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { indexWithRole, slotCells } from "./ledger-util";

/** Finding a member's locker: start at the home locker and follow the same trail, giving up at the first free locker. */
export const hashSearchStory: Story = {
  id: "hash-table-search",
  title: "Finding a Locker by Its Trail",
  emoji: "🔎",
  hook: "A gym's lockers were handed out by a rule: start at your home locker and take the first free one after it. To find a member's locker later, follow the very same trail. If a locker holds their number, found. If you reach a free locker, they were never given one: had they been, they would have stopped there or earlier.",
  cast: [
    { emoji: "🔑", name: "Searcher", means: "index: the locker being looked at" },
    { emoji: "🗄️", name: "Locker", means: "a slot of the table (a dash means free)" },
    { emoji: "🛑", name: "Free locker", means: "the trail ends: the key is not in the table" },
  ],
  moral: "Search follows the same probe sequence as insertion. A free slot proves the key is absent, so a search never has to look at the whole table unless the table is nearly full.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const size = step.state.values.length;
    const first = trace.steps[0]!;
    const key = variable(first, "key");
    const index = variable(step, "index");
    const tries = variable(step, "tries");
    const cells = slotCells(step, -1, (k) => `locker ${k}`);
    const actors: StoryActor[] = index !== null && !["entry", "not-found"].includes(a) ? [{ id: "k", emoji: "🔎", name: "Looking", at: index }] : [];
    const before = indexWithRole(step, "compared");
    const found = trace.steps.some((s) => anchorOf(s) === "found");
    const isLast = step.index === trace.steps.length - 1;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `Find the locker of member ${key} among ${size} lockers.`;
        break;
      case "compute-hash":
        says = `Start at the home locker: ${key} divided by ${size}, remainder ${index}.`;
        inCode = "index = key % size";
        break;
      case "loop":
        says = `Look in locker ${index} (look number ${(tries ?? 0) + 1}).`;
        inCode = "while (tries < size)";
        break;
      case "probe-next":
        says = `Locker ${before} belongs to member ${before === undefined ? "?" : step.state.values[before]}, not ${key}. Try the next locker, ${index}.`;
        inCode = "index = (index + 1) % size";
        break;
      case "empty-slot":
        says = `Locker ${index} is free. Member ${key} would have stopped here or earlier, so they have no locker.`;
        inCode = "if (table[index] == -1) return -1";
        break;
      case "found":
        says = `Locker ${index} holds member ${key}. Found!`;
        inCode = "if (table[index] == key) return index";
        break;
      case "not-found":
        says = `Every locker was checked and member ${key} was not in any of them.`;
        inCode = "return -1";
        break;
    }
    if (isLast) banner = found ? { kind: "good", text: `Member ${key} has locker ${index}.` } : { kind: "info", text: `Member ${key} has no locker.` };
    return { cells, actors, says, inCode, banner, board: { label: "Lockers looked at", text: `${a === "entry" || a === "compute-hash" ? 0 : (tries ?? 0) + (a === "probe-next" ? 0 : 1)}` } };
  },
};
