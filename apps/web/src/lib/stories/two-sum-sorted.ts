import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** Two friends at a price-sorted shelf spending one shared budget on a gift each. */
export const twoSumSortedStory: Story = {
  id: "two-sum-sorted",
  title: "Two Friends and the Gift Shelf",
  emoji: "🎁",
  hook: "Asha and Ravi have one shared budget and want to buy one gift each. The shelf is arranged from the cheapest gift to the dearest. Asha starts at the cheap end and Ravi at the expensive end, and they walk towards each other until their two prices add up to the budget.",
  cast: [
    { emoji: "👧", name: "Asha", means: "the left pointer: picks from the cheap end" },
    { emoji: "👦", name: "Ravi", means: "the right pointer: picks from the expensive end" },
    { emoji: "🎁", name: "Gift", means: "a value in the sorted array: its price" },
    { emoji: "💰", name: "Budget", means: "the target sum" },
  ],
  moral: "On a sorted shelf, a total that is too big can only be fixed by the dearer friend choosing cheaper, and a total that is too small only by the cheaper friend choosing dearer. Each step throws away a gift for good, so the walk is quick.",
  frame(step) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const target = variable(step, "target") ?? 0;
    const left = variable(step, "left");
    const right = variable(step, "right");
    const sum = variable(step, "sum");
    const ok = (i: number | null): i is number => i !== null && i >= 0 && i < n;
    const li = ok(left) ? left : null;
    const ri = ok(right) ? right : null;
    const lo = li ?? 0;
    const hi = ri ?? n - 1;

    const cells: StoryCell[] = values.map((v, i) => {
      const out = li !== null && ri !== null && (i < lo || i > hi);
      const picked = (i === li || i === ri) && (a === "found" || a === "check-equal") && sum === target;
      return { main: String(v), sub: `gift ${i + 1}`, tone: picked ? "good" : out ? "dim" : i === li || i === ri ? "hit" : "plain" };
    });
    const actors: StoryFrame["actors"] = [];
    if (li !== null) actors.push({ id: "a", emoji: "👧", name: "Asha", at: li });
    if (ri !== null) actors.push({ id: "r", emoji: "👦", name: "Ravi", at: ri });

    const meter = sum !== null && li !== null && ri !== null ? { label: `${values[li]} + ${values[ri]} = ${sum}`, value: sum, target, verdict: sum === target ? ("match" as const) : sum < target ? ("low" as const) : ("high" as const) } : undefined;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? `The shelf is empty, so there is nothing to buy. The budget is ${target}.` : `The shelf holds ${n} gifts, cheapest first. The budget is ${target}. Asha and Ravi will each choose one gift so that the two prices add up to exactly ${target}.`;
        break;
      case "init-left":
        says = "Asha stands at the cheapest gift, at the left end of the shelf.";
        inCode = "left = 0";
        break;
      case "init-right":
        says = n > 0 ? "Ravi stands at the dearest gift, at the right end of the shelf." : "There is nobody to stand on the shelf.";
        inCode = "right = n - 1";
        break;
      case "loop":
        says = `Asha is at gift ${(li ?? 0) + 1} and Ravi at gift ${(ri ?? 0) + 1}. They are at two different gifts, so they can still try a pair.`;
        inCode = "while (left < right)";
        break;
      case "sum":
        says = `They add up their prices: ${li !== null && ri !== null ? values[li] : "?"} + ${li !== null && ri !== null ? values[ri] : "?"} = ${sum}. The budget is ${target}.`;
        inCode = "sum = nums[left] + nums[right]";
        break;
      case "check-equal":
        says = sum === target ? `${sum} is exactly the budget!` : `${sum} is not exactly ${target}, so this pair does not work.`;
        inCode = "if (sum == target)";
        break;
      case "found":
        says = `Perfect! ${li !== null ? values[li] : "?"} + ${ri !== null ? values[ri] : "?"} = ${target}. Asha and Ravi take these two gifts home.`;
        banner = { kind: "good", text: `Found a pair that costs exactly ${target}.` };
        inCode = "return [left, right]";
        break;
      case "check-less":
        says = sum !== null && sum < target ? `${sum} is below the budget of ${target}: there is money left over, so they can spend more.` : `${sum} is above the budget of ${target}: they are overspending.`;
        inCode = "if (sum < target)";
        break;
      case "move-left":
        says = `Too cheap! Only a dearer gift can help, so Asha steps right to gift ${(li ?? 0) + 1}. The gift she leaves can never be part of an answer, so it is crossed out.`;
        inCode = "left = left + 1";
        break;
      case "move-right":
        says = `Too costly! Only a cheaper gift can help, so Ravi steps left to gift ${(ri ?? 0) + 1}. The gift he leaves can never be part of an answer, so it is crossed out.`;
        inCode = "right = right - 1";
        break;
      case "not-found":
        says = "Asha and Ravi have met in the middle and every gift has been ruled out. No two gifts add up to the budget.";
        banner = { kind: "bad", text: `No two gifts cost exactly ${target}.` };
        inCode = "return []";
        break;
    }
    return { cells, actors, says, inCode, meter, banner };
  },
};
