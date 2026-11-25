import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { slotCells } from "./ledger-util";

/** Lockers: each member's number picks a home locker; a taken door means trying the next one, wrapping round at the end. */
export const hashInsertStory: Story = {
  id: "hash-table-insert-linear-probing",
  title: "Lockers with Taken Doors",
  emoji: "🗄️",
  hook: "A gym has a row of numbered lockers. A member's home locker is their membership number divided by the number of lockers, keeping the remainder. If that locker is taken, they try the next one, and the next, going back to the first after the last. If every locker is taken they leave without one.",
  cast: [
    { emoji: "🔑", name: "Member", means: "key: the number being stored" },
    { emoji: "🗄️", name: "Locker", means: "a slot of the table (a dash means free)" },
    { emoji: "➡️", name: "Next locker", means: "linear probing: index + 1, wrapping round" },
  ],
  moral: "In a hash table with linear probing, the hash picks a home slot, and a collision is settled by walking forward to the first free slot. The longer the clumps get, the longer that walk, which is why tables are kept from filling up.",
  frame(step): StoryFrame {
    const a = anchorOf(step);
    const size = step.state.values.length;
    const key = variable(step, "key");
    const index = variable(step, "index");
    const cells = slotCells(step, -1, (k) => `locker ${k}`);
    const actors: StoryActor[] = index !== null && ["compute-hash", "probe-check", "probe-next", "place"].includes(a) ? [{ id: "k", emoji: "🔑", name: `Member ${key}`, at: index }] : [];
    const at = index === null ? undefined : step.state.values[index];
    const taken = step.state.values.filter((v) => v !== -1).length;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `${size} lockers, all free. Members come one at a time, and each number decides which locker they try first.`;
        break;
      case "init-table":
        says = "Every locker is free (shown as a dash).";
        inCode = "table[i] = -1";
        break;
      case "loop":
        says = `Member number ${key} arrives.`;
        inCode = "for (key : keys)";
        break;
      case "compute-hash":
        says = `Home locker: ${key} divided by ${size}, remainder ${index}. Try locker ${index}.`;
        inCode = "index = key % size";
        break;
      case "probe-check":
        says = at === -1 ? `Locker ${index} is free.` : `Locker ${index} already belongs to member ${at}.`;
        inCode = "if (table[index] == -1)";
        break;
      case "probe-next":
        says = `Taken. Try the next locker, ${index} (after the last locker comes locker 0 again).`;
        inCode = "index = (index + 1) % size";
        break;
      case "table-full":
        says = `Every locker is taken, so member ${key} goes home without one.`;
        inCode = "if (tries == size) skip";
        break;
      case "place":
        says = `Member ${key} takes locker ${index}.`;
        inCode = "table[index] = key";
        break;
      case "finish":
        says = `All members have been handled. ${taken} of ${size} lockers are in use.`;
        banner = { kind: "good", text: `Final lockers: ${step.state.values.map((v) => (v === -1 ? "free" : v)).join(", ")}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Lockers in use", text: `${taken} of ${size}` } };
  },
};
