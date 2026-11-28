import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { helperAt, inputList, inputNumber } from "./dp-util";
import { roleTone } from "./ledger-util";
import { rolesOf } from "./string-util";

/** Coins are allowed one kind at a time, so a mix of coins is counted once, however it is ordered. */
export const coinChangeWaysStory: Story = {
  id: "coin-change-ways",
  title: "Ways to Pay Exactly",
  emoji: "🧾",
  hook: "How many different mixes of coins add up to exactly an amount? A shopkeeper allows one kind of coin at a time. With the first kind allowed, the chart counts the ways that use only it. Then the next kind is allowed: for each amount, the ways grow by the ways to pay what is left after one more of the new coin. Because kinds are added one by one, the same mix in a different order is never counted twice.",
  cast: [
    { emoji: "🧑‍💼", name: "Shopkeeper", means: "a: the amount being updated" },
    { emoji: "🪙", name: "Coin kind", means: "coin: the kind now allowed" },
    { emoji: "📊", name: "Chart", means: "dp[a]: the number of mixes that make amount a" },
  ],
  moral: "Loop over the coin kinds on the outside and the amounts on the inside, and add dp[a - coin] to dp[a]. That counts mixes, not orderings. The ways to pay 0 is 1: use no coins.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const coins = inputList(trace);
    const amount = inputNumber(trace, "amount");
    const v = step.state.values;
    const at = step.state.pointers.a ?? null;
    const coin = variable(step, "coin");
    const ways = variable(step, "ways");
    const roles = rolesOf(step);
    const cells = v.map((x, p) => ({ main: String(x), sub: `$${p}`, tone: roleTone(roles.get(p)) }));
    const actors = a === "fill" ? helperAt("🧑‍💼", "Shopkeeper", at, v.length) : [];
    const rest = at !== null && coin !== null ? at - coin : 0;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `Count the different mixes of ${coins.length ? coins.map((c) => `$${c}`).join(", ") : "no"} coins that make exactly $${amount}.`;
        break;
      case "init":
        says = "There is exactly one way to pay $0: use no coins. Every other amount starts with 0 ways.";
        inCode = "dp[0] = 1;";
        break;
      case "coin-loop":
        says = `Now allow the $${coin} coin. Coins are allowed one kind at a time, so the same mix in a different order is never counted twice.`;
        inCode = "for (coin : coins)";
        break;
      case "fill":
        says = `For $${at}: the ${v[rest] ?? 0} ${v[rest] === 1 ? "way" : "ways"} to pay $${rest}, plus one $${coin} coin, are new ways to pay $${at}. The chart for $${at} now says ${v[at ?? 0]}.`;
        inCode = "dp[a] += dp[a - coin]";
        break;
      case "finish":
        says = `Every coin kind has been allowed. There ${ways === 1 ? "is 1 mix" : `are ${ways} mixes`} of coins that make exactly $${amount}.`;
        banner = { kind: "good", text: `${ways} ${ways === 1 ? "way" : "ways"} to pay $${amount}.` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Coin kinds allowed", text: coin === null ? "none yet" : coins.slice(0, Math.max(0, coins.indexOf(coin) + 1)).map((c) => `$${c}`).join("  ") || "none yet" } };
  },
};
