import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { roleTone } from "./ledger-util";
import { rolesOf } from "./string-util";

/** Looking up a word in a long printed list by hopping chapter to chapter, then reading only the one chapter that must hold it. */
export const jumpSearchStory: Story = {
  id: "jump-search",
  title: "Hopping Through Chapters",
  emoji: "🦘",
  hook: "A sorted list is split into equal blocks, like chapters. Instead of reading every entry, you hop from chapter to chapter and look only at the last entry of each. The moment a chapter ends at something at least as big as your number, your number can only be inside that chapter, so you go back to its start and read it entry by entry.",
  cast: [
    { emoji: "🦘", name: "Hopper", means: "prev: the start of the block being checked" },
    { emoji: "🚩", name: "Chapter end", means: "end - 1: the last entry of the block" },
    { emoji: "🔎", name: "Reader", means: "i: the entry being read inside the block" },
  ],
  moral: "Jump search checks about √n block ends and then at most √n entries inside one block, so it takes O(√n) steps: far fewer than reading everything, and it only ever moves forward.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const values = step.state.values;
    const n = values.length;
    const target = variable(trace.steps[0]!, "target") ?? 0;
    let blockSize: number | null = null;
    for (const s of trace.steps) {
      if (s.index > step.index) break;
      blockSize = variable(s, "step") ?? blockSize;
    }
    const prev = variable(step, "prev");
    const end = variable(step, "end");
    const i = variable(step, "i");
    const roles = rolesOf(step);
    const cells = values.map((v, k) => ({ main: String(v), sub: `entry ${k + 1}`, tone: roleTone(roles.get(k) === "window" ? undefined : roles.get(k)) }));
    const lastOfBlock = end !== null ? Math.min(end, n) - 1 : null;
    const actors: StoryActor[] = [];
    if (prev !== null && prev < n && ["init-prev", "block-end", "jump-check", "jump"].includes(a)) actors.push({ id: "p", emoji: "🦘", name: "Hopper", at: prev, row: "bottom" });
    if (lastOfBlock !== null && lastOfBlock >= 0 && ["block-end", "jump-check"].includes(a)) actors.push({ id: "e", emoji: "🚩", name: "Chapter end", at: lastOfBlock });
    if (i !== null && i < n && ["linear-loop", "linear-compare", "found"].includes(a)) actors.push({ id: "r", emoji: "🔎", name: "Reader", at: i });
    const lastValue = lastOfBlock !== null && lastOfBlock >= 0 ? values[lastOfBlock]! : null;
    const here = i !== null && i < n ? values[i]! : null;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `Find ${target} in a sorted list of ${n} entries by hopping a chapter at a time.`;
        break;
      case "init-step":
        says = `Chapters of about the square root of ${n} entries: ${blockSize} ${blockSize === 1 ? "entry" : "entries"} each.`;
        inCode = "step = (int) Math.sqrt(n)";
        break;
      case "init-prev":
        says = "Start at the first chapter, which begins at entry 1.";
        inCode = "prev = 0";
        break;
      case "block-end":
        says = n === 0 ? "There are no entries, so the first chapter is empty." : `This chapter covers entries ${(prev ?? 0) + 1} to ${lastOfBlock === null ? "?" : lastOfBlock + 1}.`;
        inCode = "end = min(prev + step, n)";
        break;
      case "jump-check":
        says = lastValue === null ? "The list is empty, so there is no chapter to look at." : lastValue < target ? `The chapter ends with ${lastValue}, which is smaller than ${target}. Your number is not in this chapter: hop on.` : `The chapter ends with ${lastValue}, which is not smaller than ${target}. If ${target} is in the list, it is in this chapter.`;
        inCode = "while (values[end - 1] < target)";
        break;
      case "jump":
        says = `Hop to the next chapter, which starts at entry ${(prev ?? 0) + 1}.`;
        inCode = "prev = end";
        break;
      case "linear-loop":
        says = `Now read this chapter one entry at a time. Entry ${(i ?? 0) + 1} is next.`;
        inCode = "for (i = prev; i < end; i++)";
        break;
      case "linear-compare":
        says = here === target ? `Entry ${(i ?? 0) + 1} shows ${here}, exactly ${target}.` : `Entry ${(i ?? 0) + 1} shows ${here}, which is not ${target}.`;
        inCode = "if (values[i] == target)";
        break;
      case "found":
        says = `Found ${target} at entry ${(i ?? 0) + 1}.`;
        inCode = "return i";
        banner = { kind: "good", text: `${target} is at entry ${(i ?? 0) + 1} (index ${i}).` };
        break;
      case "not-found":
        says = `The chapter was read to its end and ${target} was not in it, so it is not in the list.`;
        inCode = "return -1";
        banner = { kind: "info", text: `${target} is not in the list.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Chapter size", text: blockSize === null ? "not chosen yet" : `${blockSize}` } };
  },
};
