import { anchorOf, variable, type Story, type StoryFrame } from "./types";
import { helperAt, inputList, inputNumber } from "./dp-util";
import { roleTone } from "./ledger-util";
import { rolesOf } from "./string-util";

/** A cashier fills a chart: for every amount, the fewest coins that make it, built from the chart's earlier answers. */
export const coinChangeMinCoinsStory: Story = {
  id: "coin-change-min-coins",
  title: "The Cashier's Change Chart",
  emoji: "🪙",
  hook: "A cashier must pay out an exact amount using the fewest coins. Instead of guessing, they make a chart: for every amount from 0 upward, the fewest coins that make it. To fill an amount, try each coin: take that coin away, look up the chart for what is left, and add one coin. Keep the smallest result. An amount no coin can reach stays at infinity.",
  cast: [
    { emoji: "🧑‍💼", name: "Cashier", means: "a: the amount being worked out" },
    { emoji: "🪙", name: "Coin", means: "coin: the kind being tried" },
    { emoji: "📊", name: "Chart", means: "dp[a]: the fewest coins for amount a" },
    { emoji: "♾️", name: "Infinity", means: "no way found yet" },
  ],
  moral: "Fill the chart from small amounts to big ones. For each amount, try every coin and reuse the chart for the amount left over. If the target is still infinity at the end, it cannot be paid.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const coins = inputList(trace);
    const amount = inputNumber(trace, "amount");
    const v = step.state.values;
    const at = step.state.pointers.a ?? null;
    const from = step.state.pointers.from ?? null;
    const coin = variable(step, "coin");
    const result = variable(step, "result");
    const roles = rolesOf(step);
    const txt = (x: number | undefined) => (x === undefined || x > amount ? "∞" : String(x));
    const cells = v.map((x, p) => ({ main: txt(x), sub: `$${p}`, tone: x > amount && !roles.get(p) ? ("dim" as const) : roleTone(roles.get(p)) }));
    const actors = at !== null ? helperAt("🧑‍💼", "Cashier", at, v.length) : [];
    const rest = at !== null && coin !== null ? at - coin : 0;
    const restTxt = from !== null ? txt(v[from]) : "";
    const helps = [...roles.values()].includes("found");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `Pay exactly $${amount} with the fewest coins from ${coins.length ? coins.join(", ") : "an empty till"}. Build a chart, one amount at a time.`;
        break;
      case "init-table":
        says = "Paying $0 takes 0 coins. Every other amount starts at infinity: no way found yet.";
        inCode = "dp[0] = 0; the rest = amount + 1";
        break;
      case "loop":
        says = `Fill the chart for $${at}. Try each coin in turn.`;
        inCode = "for (a = 1; a <= amount; a++)";
        break;
      case "try-coin":
        says = from === null ? `A $${coin} coin is bigger than $${at}, so it cannot be used.` : `Try a $${coin} coin on $${at}. Leaving $${rest} to pay, and the chart says that takes ${restTxt === "∞" ? "no known way (∞)" : `${restTxt} ${restTxt === "1" ? "coin" : "coins"}`}.`;
        inCode = "for (coin : coins)";
        break;
      case "check": {
        const old = txt(v[at ?? 0]);
        const rv = from !== null ? v[from] : undefined;
        if (rv === undefined || rv > amount) says = `There is no way to pay the rest, so the $${coin} coin does not help.`;
        else says = helps ? `${rv} + 1 = ${rv + 1} coins beats the old best for $${at} (${old}), so this coin helps.` : `${rv} + 1 = ${rv + 1} coins is not better than the old best for $${at} (${old}). Keep the old answer.`;
        inCode = "if (dp[a - coin] + 1 < dp[a])";
        break;
      }
      case "fill":
        says = `Write ${result} ${result === 1 ? "coin" : "coins"} on the chart for $${at}.`;
        inCode = "dp[a] = dp[a - coin] + 1";
        break;
      case "finish":
        if (result === -1) {
          says = `The chart still says infinity for $${amount}: these coins cannot make it exactly.`;
          banner = { kind: "bad", text: `$${amount} cannot be paid with these coins.` };
        } else {
          says = `The chart is done. The fewest coins for $${amount} is ${result}.`;
          banner = { kind: "good", text: `Fewest coins: ${result}.` };
        }
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Coins in the till", text: coins.length ? coins.map((c) => `$${c}`).join("  ") : "none" } };
  },
};
