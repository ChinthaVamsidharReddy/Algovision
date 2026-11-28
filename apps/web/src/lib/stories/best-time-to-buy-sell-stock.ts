import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { labelAt, roleTone } from "./ledger-util";
import { rolesOf } from "./string-util";

/** Walk through the days remembering the cheapest price seen; selling today earns today's price minus that. */
export const bestTimeToBuySellStockStory: Story = {
  id: "best-time-to-buy-sell-stock",
  title: "Buy Low, Sell Later",
  emoji: "📈",
  hook: "A shopper sees one price per day for something they can buy once and sell once, always selling on a later day than they buy. They walk through the days with a sticky note: the cheapest price seen so far. Each day they ask how much they would earn by selling today against that cheapest day, and keep the biggest answer.",
  cast: [
    { emoji: "🛒", name: "Shopper", means: "i: today" },
    { emoji: "🏷️", name: "Cheapest day", means: "minPrice: the best day to have bought so far" },
    { emoji: "🏆", name: "Best profit", means: "best: the biggest earning found" },
  ],
  moral: "You never need to try every pair of days. Remember only the cheapest price so far, and each day's best sale is today's price minus it: one pass, O(n).",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const v = step.state.values;
    const n = v.length;
    const i = variable(step, "i");
    const minPrice = variable(step, "minPrice");
    const best = variable(step, "best");
    const buy = step.state.pointers.buy ?? null;
    const roles = rolesOf(step);
    const cells = v.map((p, k) => {
      const label = labelAt(step, k);
      return { main: String(p), sub: label === "buy" ? "buy" : label === "sell" ? "sell" : `day ${k}`, tone: roleTone(roles.get(k)) };
    });
    const labelled = (name: string): number | null => {
      const h = step.highlights.find((x) => x.target.kind === "index" && x.label === name);
      return h && h.target.kind === "index" ? h.target.index : null;
    };
    const sell = labelled("sell");
    const buyDay = a === "finish" ? labelled("buy") : buy;
    const actors: StoryActor[] = [];
    if (i !== null && i < n && ["loop", "new-min", "profit"].includes(a)) actors.push({ id: "s", emoji: "🛒", name: "Shopper", at: i });
    if (buy !== null && buy < n && a !== "finish") actors.push({ id: "b", emoji: "🏷️", name: "Cheapest", at: buy, row: "bottom" });
    const price = i !== null ? (v[i] ?? 0) : 0;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `${n} days of prices. Buy on one day and sell on a later day for the biggest profit. Walk forward and remember the cheapest day so far.`;
        break;
      case "init":
        says = `Pretend we buy on day 0 at ${v[0]}. The best profit so far is 0.`;
        inCode = "minPrice = prices[0]; best = 0";
        break;
      case "loop":
        says = `Day ${i}: the price is ${price}.`;
        inCode = "for (i = 1; i < n; i++)";
        break;
      case "new-min":
        says = `${price} is cheaper than every earlier price, so day ${i} becomes the new day to buy.`;
        inCode = "minPrice = prices[i]";
        break;
      case "profit":
        says = sell !== null ? `Selling today earns ${price} − ${minPrice} = ${price - (minPrice ?? 0)}. That beats the best so far, so the best profit is now ${best}.` : `Selling today would earn ${price} − ${minPrice} = ${price - (minPrice ?? 0)}, which does not beat the best so far, ${best}.`;
        inCode = "best = max(best, prices[i] - minPrice)";
        break;
      case "finish":
        says = (best ?? 0) > 0 && buyDay !== null && sell !== null ? `Buy on day ${buyDay} at ${v[buyDay]} and sell on day ${sell} at ${v[sell]}: a profit of ${best}.` : "No day is better for selling than for buying, so the best choice is to do nothing: profit 0.";
        banner = { kind: "good", text: `Best profit: ${best ?? 0}.` };
        break;
    }
    void trace;
    return { cells, actors, says, inCode, banner, board: { label: "Cheapest price so far · best profit", text: `${minPrice ?? "–"} · ${best ?? 0}` } };
  },
};
