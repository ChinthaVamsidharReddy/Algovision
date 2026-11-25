import { anchorOf, variable, type Story, type StoryActor, type StoryCell, type StoryFrame, type Tone } from "./types";
import { rolesOf } from "./string-util";

/** A row of shortcut notebooks: each position remembers the total of the last few days ending there, so a running total needs only a few additions. */
export const fenwickStory: Story = {
  id: "fenwick-tree-prefix-sum",
  title: "Shortcut Notebooks for Running Totals",
  emoji: "🧮",
  hook: "To answer \"what did the shop earn from day 1 up to day k?\" quickly, each numbered notebook stores a block total: position j holds the sum of the last (j & -j) days ending at day j. When a day's sales are written, every notebook whose block contains that day is updated: jump from position j to j + (lowest set bit of j). To total the first k days, start at k, add that notebook, and jump down by removing its lowest set bit, until nothing is left.",
  cast: [
    { emoji: "🧑", name: "Clerk", means: "j: the notebook position being used" },
    { emoji: "📒", name: "Notebook", means: "a tree position; the small number is its position (1 is the first)" },
    { emoji: "🧮", name: "Total", means: "total: the running sum collected" },
  ],
  moral: "A Fenwick tree needs only n cells. Both writing a value and summing a prefix take about log n steps, because each jump follows the lowest set bit of the position.",
  frame(step, trace): StoryFrame {
    const a = anchorOf(step);
    const values = step.state.values;
    const n = values.length;
    const roles = rolesOf(step);
    const first = trace.steps[0]!;
    const index = variable(first, "index");
    const j = variable(step, "j");
    const i = variable(step, "i");
    const total = variable(step, "total");
    const nextPos = variable(step, "next");
    const tone = (k: number): Tone => {
      const r = roles.get(k);
      return r === "active" ? "hit" : r === "swapped" || r === "found" ? "good" : r === "compared" ? "warn" : "plain";
    };
    const cells: StoryCell[] = values.map((v, k) => ({ main: String(v), sub: `#${k + 1}`, tone: tone(k) }));
    const here = a === "entry" || a === "init-tree" || a === "finish" || j === null || j < 1 || j > n ? null : j - 1;
    const actors: StoryActor[] = here === null ? [] : [{ id: "c", emoji: "🧑", name: "Clerk", at: here }];
    const upTo = index === null ? "?" : `day ${index + 1}`;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `${n} ${n === 1 ? "day" : "days"} of sales. The question: what is the total up to and including ${upTo}?`;
        break;
      case "init-tree":
        says = `Set out ${n} empty notebooks, numbered 1 to ${n}.`;
        inCode = "tree = new int[n + 1]";
        break;
      case "build":
        says = `Day ${i}'s sales go into every notebook whose block contains that day. Start at notebook ${j}.`;
        inCode = "for (j = i; j <= n; j += j & -j)";
        break;
      case "build-add":
        says = `Notebook ${j} covers day ${i}, so add today's sales. It now shows ${values[(j ?? 1) - 1]}.`;
        inCode = "tree[j] += value";
        break;
      case "build-climb":
        says = nextPos !== null && nextPos > n ? `The next notebook would be ${nextPos}, which does not exist. Day ${i} is finished.` : `Jump to notebook ${nextPos}: it also covers day ${i}.`;
        inCode = "j += j & -j";
        break;
      case "query":
        says = `All notebooks are written. Now total up to ${upTo}: start at notebook ${j} with a total of 0.`;
        inCode = "for (j = index + 1; j > 0; j -= j & -j)";
        break;
      case "query-add":
        says = `Notebook ${j} holds the sum of the last ${(j ?? 0) & -(j ?? 0)} days ending here. Add ${values[(j ?? 1) - 1]}. The total is ${total}.`;
        inCode = "sum += tree[j]";
        break;
      case "query-climb":
        says = j === 0 ? "Nothing is left, so every day up to the target has been counted." : `Drop the lowest set bit: jump to notebook ${j}.`;
        inCode = "j -= j & -j";
        break;
      case "finish":
        says = `The total up to ${upTo} is ${total}.`;
        banner = { kind: "good", text: `Total up to ${upTo}: ${total}.` };
        break;
    }
    const board = ["query", "query-add", "query-climb", "finish"].includes(a) ? { label: "Total so far", text: String(total ?? 0) } : undefined;
    return { cells, actors, says, inCode, banner, board };
  },
};
