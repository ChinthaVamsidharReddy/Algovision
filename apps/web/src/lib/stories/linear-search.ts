import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** Looking for a lost key by opening a row of lockers one by one. */
export const linearSearchStory: Story = {
  id: "linear-search",
  title: "The Lost Key in the Lockers",
  emoji: "🔑",
  hook: "You lost your key in a row of lockers, and you do not know which one holds it. The only way is to open them one by one from the left. Each empty locker is crossed off. Stop as soon as you find the key, or when the last locker is open.",
  cast: [
    { emoji: "🧍", name: "Seeker", means: "i: the locker being opened now" },
    { emoji: "🔑", name: "Key", means: "the target value you want" },
    { emoji: "🗄️", name: "Locker", means: "a cell of the array" },
  ],
  moral: "With no order to lean on, you may have to open every locker. If the lockers were sorted you could do better (binary search).",
  frame(step) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const target = variable(step, "target") ?? 0;
    const i = variable(step, "i");
    const ok = (x: number | null): x is number => x !== null && x >= 0 && x < n;
    const hit = ok(i) ? values[i]! : null;

    const cells: StoryCell[] = values.map((v, k) => ({
      main: String(v),
      sub: `locker ${k + 1}`,
      tone: a === "found" && k === i ? "good" : a === "not-found" ? "dim" : ok(i) && k < i ? "dim" : ok(i) && k === i ? "hit" : "plain",
    }));
    const actors: StoryFrame["actors"] = [];
    if (ok(i) && a !== "not-found") actors.push({ id: "s", emoji: a === "found" ? "🔑" : "🧍", name: a === "found" ? "Key!" : "Seeker", at: i });

    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? `There are no lockers, so the key (${target}) cannot be in one.` : `${n} lockers in a row. You are looking for the one holding ${target}. Open them from the left.`;
        break;
      case "loop":
        says = `Walk to locker ${(i ?? 0) + 1}.`;
        inCode = "for (i = 0; i < n; i++)";
        break;
      case "compare":
        says = hit === target ? `Locker ${(i ?? 0) + 1} holds ${hit}: that is the key!` : `Locker ${(i ?? 0) + 1} holds ${hit}, not ${target}. Cross it off and keep going.`;
        inCode = "if (values[i] == target)";
        break;
      case "found":
        says = `Found ${target} in locker ${(i ?? 0) + 1}. You stop early, after opening ${(i ?? 0) + 1} of ${n} lockers.`;
        banner = { kind: "good", text: `Found ${target} in locker ${(i ?? 0) + 1}.` };
        inCode = "return i";
        break;
      case "not-found":
        says = `Every locker is open and none holds ${target}, so the key is not here.`;
        banner = { kind: "bad", text: `${target} is not in any locker.` };
        inCode = "return -1";
        break;
    }
    return { cells, actors, says, inCode, banner };
  },
};
