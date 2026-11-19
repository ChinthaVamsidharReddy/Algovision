import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** A keeper writes each new name once while a scout runs ahead and skips repeats on a sorted register. */
export const removeDuplicatesSortedStory: Story = {
  id: "remove-duplicates-sorted",
  title: "The Class Register",
  emoji: "📋",
  hook: "A sorted class register lists some names more than once. Two helpers work through it. The scout runs ahead one name at a time. The keeper points at the last different name that has been kept. When the scout finds a name that differs from the keeper's, the keeper steps forward and copies that name in. Repeats are simply skipped.",
  cast: [
    { emoji: "📋", name: "Keeper", means: "slow: the last unique value kept so far" },
    { emoji: "🔎", name: "Scout", means: "fast: the value being checked now" },
    { emoji: "🗑️", name: "Leftovers", means: "anything after the kept names: ignored" },
  ],
  moral: "Because the list is sorted, equal values sit together, so comparing the scout with the keeper is all it takes. Everything is done in the same list, with no extra copy.",
  frame(step) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const slow = variable(step, "slow");
    const fast = variable(step, "fast");
    const count = variable(step, "count");
    const finished = a === "finish";
    const ok = (x: number | null): x is number => x !== null && x >= 0 && x < n;
    const kept = finished ? (count ?? 0) : ok(slow) ? slow + 1 : 0;

    const cells: StoryCell[] = values.map((v, k) => ({
      main: String(v),
      sub: `entry ${k + 1}`,
      tone: k < kept ? "good" : finished ? "dim" : ok(fast) && k === fast ? "hit" : "plain",
    }));
    const actors: StoryFrame["actors"] = [];
    if (!finished) {
      if (ok(slow)) actors.push({ id: "s", emoji: "📋", name: "Keeper", at: slow });
      if (ok(fast) && ["loop", "compare", "advance-slow", "copy"].includes(a)) actors.push({ id: "f", emoji: "🔎", name: "Scout", at: fast });
    }
    const vs = ok(slow) ? values[slow]! : null;
    const vf = ok(fast) ? values[fast]! : null;

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "The register is empty." : `${n} entries are listed in sorted order, with some names repeated. Keep each different name once.`;
        break;
      case "check-empty":
        says = n === 0 ? "There are no entries, so there is nothing to keep." : "The register has entries, and the very first one is always kept.";
        inCode = "if (n == 0) return 0";
        break;
      case "init-slow":
        says = "The Keeper points at the first entry: the last name kept so far.";
        inCode = "slow = 0";
        break;
      case "loop":
        says = `The Scout moves to entry ${(fast ?? 0) + 1}.`;
        inCode = "for (fast = 1; fast < n; fast++)";
        break;
      case "compare":
        says = vs !== null && vf !== null ? (vs === vf ? `The Scout sees ${vf}, the same as the Keeper's ${vs}. A repeat, so skip it.` : `The Scout sees ${vf}, different from the Keeper's ${vs}. A new name to keep!`) : says;
        inCode = "if (values[fast] != values[slow])";
        break;
      case "advance-slow":
        says = `The Keeper steps forward to entry ${(slow ?? 0) + 1}, the next place for a kept name.`;
        inCode = "slow++";
        break;
      case "copy":
        says = `The Keeper writes ${vf} into entry ${(slow ?? 0) + 1}.`;
        inCode = "values[slow] = values[fast]";
        break;
      case "finish":
        says = `The Scout has read the whole register. ${count} different value${count === 1 ? " is" : "s are"} kept at the front (green). The rest is leftover and ignored.`;
        banner = { kind: "good", text: `${count} different value${count === 1 ? "" : "s"} kept.` };
        inCode = "return slow + 1";
        break;
    }
    return { cells, actors, says, inCode, banner };
  },
};
