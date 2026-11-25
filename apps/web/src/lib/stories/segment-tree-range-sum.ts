import { anchorOf, variable, type ChainFrame, type TreeStory } from "./types";
import { standOn, treeTones } from "./heap-util";

const span = (lo: number | null, hi: number | null): string => (lo === null || hi === null ? "?" : lo === hi ? `day ${lo}` : `days ${lo} to ${hi}`);

/** A pyramid of notebooks: each notebook holds the total of a block of days, so a question about a stretch of days opens only a few notebooks. */
export const segmentTreeStory: TreeStory = {
  id: "segment-tree-range-sum",
  kind: "tree",
  title: "The Pyramid of Notebooks",
  emoji: "📒",
  hook: "A shop keeps one sales figure per day. At the bottom of a pyramid, each notebook holds a single day. Each notebook above holds the total of the two notebooks below it, so the top one holds everything. To total a stretch of days, you start at the top. A notebook that lies completely outside the stretch adds nothing. One completely inside is read whole. One that is only partly inside is split, and you ask both notebooks under it.",
  cast: [
    { emoji: "📒", name: "Notebook", means: "a node: the sum of one block of days" },
    { emoji: "🧑‍💼", name: "Clerk", means: "the node being asked" },
    { emoji: "🟢", name: "Read whole", means: "a node completely inside the range: its stored sum is used" },
    { emoji: "🧮", name: "Total", means: "total: the sum collected so far" },
  ],
  moral: "A segment tree stores the sum of every halved block. A range query reads at most about two whole notebooks per level instead of every day, so it takes O(log n) steps.",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const s = step.state;
    const first = trace.steps[0]!;
    const left = variable(first, "left");
    const right = variable(first, "right");
    const lo = variable(step, "lo");
    const hi = variable(step, "hi");
    const depth = variable(step, "depth");
    const got = variable(step, "got");
    const total = variable(step, "total");
    const sum = variable(step, "sum");
    const out = s.output;
    const tones = treeTones(step);
    const range = span(left, right);
    const actors = s.current && !["entry", "init-tree", "finish"].includes(a) ? [{ id: "c", emoji: "🧑‍💼", name: "Clerk", node: s.current }] : [];
    const created = step.highlights.some((h) => h.role === "created");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = `A shop's daily sales, and one question: what do ${range} add up to?`;
        break;
      case "init-tree":
        says = "First, build the pyramid of notebooks. The top one covers every day, and each notebook splits its days in half.";
        inCode = "tree = new int[4n]";
        break;
      case "build":
        if (depth !== null) {
          says = `Start a notebook for ${span(lo, hi)}. Its total is not known yet.`;
          inCode = "build(node, lo, hi)";
        } else if (created) {
          says = `The notebook for ${span(lo, hi)} exists, but it shows 0 until the notebooks under it are filled in.`;
          inCode = "build(node, lo, hi)";
        } else {
          says = `The notebook for ${span(lo, hi)} is finished.`;
          inCode = "return";
        }
        break;
      case "build-leaf":
        says = `One single day: the notebook for ${span(lo, hi)} just copies that day's sales, ${sum}.`;
        inCode = "tree[node] = values[lo]";
        break;
      case "build-children":
        says = `Split ${span(lo, hi)} in half and make a notebook for each half.`;
        inCode = "mid = (lo + hi) / 2; build(left); build(right)";
        break;
      case "build-sum":
        says = `Both halves are filled in, so ${span(lo, hi)} holds their total: ${sum}.`;
        inCode = "tree[node] = tree[2*node] + tree[2*node+1]";
        break;
      case "query":
        if (lo === null) {
          says = `The pyramid is built. Now total ${range}, starting at the top notebook.`;
          inCode = "query(root, 0, n-1, left, right)";
        } else if (depth !== null) {
          says = `Open the notebook for ${span(lo, hi)}.`;
          inCode = "query(node, lo, hi, left, right)";
        } else {
          says = `The notebook for ${span(lo, hi)} reports back ${got}. The total so far is ${total}.`;
          inCode = "return result";
        }
        break;
      case "query-outside":
        says = `${span(lo, hi)} is entirely outside ${range}. It adds 0.`;
        inCode = "if (hi < left || lo > right) return 0";
        break;
      case "query-inside":
        says = `${span(lo, hi)} is entirely inside ${range}, so read its total, ${got}, without opening anything below. The total so far is ${total}.`;
        inCode = "if (left <= lo && hi <= right) return tree[node]";
        break;
      case "query-split":
        says = `${span(lo, hi)} is only partly inside ${range}. Ask both notebooks under it and add their answers.`;
        inCode = "return query(left) + query(right)";
        break;
      case "finish":
        says = `${range} add up to ${variable(step, "result")}.`;
        banner = { kind: "good", text: `${range} add up to ${variable(step, "result")}.` };
        break;
    }
    const board = ["query", "query-outside", "query-inside", "query-split", "finish"].includes(a) ? { label: "Notebooks read whole", text: out.length ? `${out.join(" + ")} = ${out.reduce((x, y) => x + y, 0)}` : "none yet" } : undefined;
    return { tones, actors: standOn(step, actors), says, inCode, banner, board };
  },
};
