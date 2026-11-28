import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { cellAt, helperAt, inputList, tableCells } from "./dp-util";

/** A fundraiser may not knock on two neighbouring houses in a row, so at each house it is "ask" or "skip". */
export const houseRobberStory: Story = {
  id: "house-robber",
  title: "The Fundraiser Who Skips a Neighbour",
  emoji: "🏠",
  hook: "A volunteer collects donations along a street. The houses give different amounts, but neighbours talk: if you knock on one house you cannot knock on the next. At every house the volunteer decides between two plans: knock here (this house's gift plus the best from two houses back) or skip here (keep the best from the house just before). The bigger of the two is written in the notebook.",
  cast: [
    { emoji: "🙋", name: "Volunteer", means: "i: the house being decided" },
    { emoji: "📒", name: "Notebook", means: "dp[i]: the most collected using the first i houses" },
    { emoji: "🚪", name: "Knock", means: "take: this gift + dp[i - 2]" },
    { emoji: "🚶", name: "Skip", means: "skip: dp[i - 1]" },
  ],
  moral: "Each house is a choice between two plans, and the best answer so far only depends on the last two answers. Keep the larger one: dp[i] = max(gift + dp[i - 2], dp[i - 1]).",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const gifts = inputList(trace);
    const n = gifts.length;
    const i = variable(step, "i");
    const take = variable(step, "take");
    const skip = variable(step, "skip");
    const result = variable(step, "result");
    const cells = tableCells(step, trace, (p) => (p === 0 ? "no houses" : `house ${p}: ${gifts[p - 1] ?? 0}`));
    const actors = ["loop", "take", "skip", "fill"].includes(a) ? helperAt("🙋", "Volunteer", i, step.state.values.length) : [];
    const gift = i !== null ? (gifts[i - 1] ?? 0) : 0;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 0 ? "The street has no houses, so there is nothing to collect." : `${n} ${n === 1 ? "house" : "houses"} with gifts ${gifts.join(", ")}. No two neighbours may both be asked. Find the most that can be collected.`;
        break;
      case "init-table":
        says = n === 1 ? `With one house the answer is just its gift, ${gifts[0]}.` : `With no houses the total is 0. With only house 1 it is ${gifts[0] ?? 0}.`;
        inCode = "dp[0] = 0; dp[1] = nums[0];";
        break;
      case "loop":
        says = `Now house ${i}, which gives ${gift}. Decide: knock here, or skip it.`;
        inCode = "for (i = 2; i <= n; i++)";
        break;
      case "take":
        says = `Knock at house ${i}: its gift ${gift} plus the best from two houses back (${cellAt(step, (i ?? 2) - 2)}) is ${take}. The neighbour at house ${(i ?? 1) - 1} is left alone.`;
        inCode = "take = nums[i - 1] + dp[i - 2]";
        break;
      case "skip":
        says = `Skip house ${i}: keep the best from the house before, ${skip}.`;
        inCode = "skip = dp[i - 1]";
        break;
      case "fill":
        says = `The bigger of ${take} (knock) and ${skip} (skip) is ${result}. Write ${result} in the notebook for house ${i}.`;
        inCode = "dp[i] = max(take, skip)";
        break;
      case "base-case":
        says = "There are no houses, so there is nothing to collect.";
        banner = { kind: "info", text: "Nothing to collect." };
        break;
      case "finish":
        says = n === 0 ? "Nothing to collect." : `The notebook is done. The most the volunteer can collect is ${result}.`;
        banner = { kind: n === 0 ? "info" : "good", text: n === 0 ? "Nothing to collect." : `Most collected: ${result}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Knock / skip", text: take === null || skip === null ? "–" : `${take} / ${skip}` } };
  },
};
