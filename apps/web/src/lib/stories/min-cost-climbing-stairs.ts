import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { filledSet, helperAt, inputList } from "./dp-util";
import { roleTone } from "./ledger-util";
import { rolesOf } from "./string-util";

/** Each stair charges a toll; the cheapest way to stand on a stair is its toll plus the cheaper of the two stairs you could have come from. */
export const minCostClimbingStairsStory: Story = {
  id: "min-cost-climbing-stairs",
  title: "Tolls on the Stairs",
  emoji: "💸",
  hook: "Every stair in a building charges a toll to stand on it. You may start on stair 0 or stair 1 and climb one or two stairs at a time. The roof is just past the last stair. To stand on a stair you pay its toll plus the cheapest way of arriving: the cheaper of the totals for the two stairs below. Each stair's cheapest total is written over its toll.",
  cast: [
    { emoji: "🧗", name: "Climber", means: "i: the stair being worked out" },
    { emoji: "💸", name: "Toll", means: "cost[i]: what the stair charges" },
    { emoji: "🏷️", name: "Cheapest total", means: "dp[i]: the least paid to stand on stair i" },
  ],
  moral: "The cheapest way to reach a stair depends only on the cheapest ways to reach the two stairs below it. At the end, the roof can be reached from either of the last two stairs, so take the cheaper one.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const tolls = inputList(trace);
    const n = tolls.length;
    const i = variable(step, "i");
    const cost = variable(step, "cost");
    const best = variable(step, "best");
    const v = step.state.values;
    const roles = rolesOf(step);
    const filled = filledSet(trace, step);
    const cells = v.map((x, p) => ({ main: String(x), sub: filled.has(p) ? "cheapest total" : "toll", tone: filled.has(p) && !roles.get(p) ? ("plain" as const) : roleTone(roles.get(p)) }));
    const actors = a === "fill" ? helperAt("🧗", "Climber", i, n) : [];
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `${n} stairs with tolls ${tolls.join(", ")}. Start on stair 0 or 1, climb one or two at a time, and the roof is just past the last stair. Find the cheapest way up.`;
        break;
      case "init":
        says = `Starting on stair 0 or stair 1 costs only that stair's own toll: ${tolls[0] ?? 0}${n > 1 ? ` and ${tolls[1]}` : ""}.`;
        inCode = "dp[0] = cost[0]; dp[1] = cost[1];";
        break;
      case "fill": {
        const k = i ?? 2;
        const lo = Math.min(v[k - 1] ?? 0, v[k - 2] ?? 0);
        says = `Stair ${k} charges ${cost}. The cheaper way to arrive is from a total of ${lo} (the cheaper of ${v[k - 1]} and ${v[k - 2]}). So standing here costs ${cost} + ${lo} = ${best}.`;
        inCode = "dp[i] = cost[i] + min(dp[i - 1], dp[i - 2])";
        break;
      }
      case "finish":
        says = n < 2 ? `The cheapest way up costs ${best}.` : `The roof can be reached from either of the last two stairs, so take the cheaper total: ${best}.`;
        banner = { kind: "good", text: `Cheapest way to the roof: ${best}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Cheapest so far", text: best === null ? "–" : String(best) } };
  },
};
