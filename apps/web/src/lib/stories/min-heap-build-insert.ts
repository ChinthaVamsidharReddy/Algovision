import { anchorOf, variable, type ChainFrame, type TreeStory } from "./types";
import { heapId, heapList, heapTones, heapValue, listText, standOn } from "./heap-util";

/** New hires join at the bottom of a company chart and climb while they are more senior than their boss. */
export const minHeapBuildInsertStory: TreeStory = {
  id: "min-heap-build-insert",
  kind: "tree",
  title: "Climbing the Company Ladder",
  emoji: "🪜",
  hook: "A company chart has one rule: every boss has a smaller rank number than the people who report to them (rank 1 is the most senior). New hires arrive one at a time and are given the next free desk at the bottom. If the new hire has a smaller number than their boss, they swap places with the boss, and keep climbing until the rule holds again.",
  cast: [
    { emoji: "🆕", name: "New hire", means: "the value just added, at the bottom" },
    { emoji: "👔", name: "Boss", means: "the parent: the desk above in the chart" },
    { emoji: "📋", name: "Chart as a list", means: "the heap stored in an array, read top to bottom and left to right" },
  ],
  moral: "Add at the bottom, then swap upward while the new value is smaller than its parent. The tree is only ever one short path wrong, so each insert costs at most the height of the tree.",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const n = trace.steps[0]?.variables.find((v) => v.name === "n")?.value;
    const hires = typeof n === "number" ? n : 0;
    const child = variable(step, "child");
    const parent = variable(step, "parent");
    const hireNow = a === "swap" ? parent : child;
    const bossNow = a === "swap" ? child : parent;
    const c = heapValue(step, hireNow);
    const p = heapValue(step, bossNow);
    const tones = heapTones(step);
    const actors = [];
    if (hireNow !== null && ["insert", "sift-up", "compare", "swap", "stop"].includes(a)) actors.push({ id: "h", emoji: "🆕", name: "New hire", node: heapId(hireNow) });
    if (bossNow !== null && ["sift-up", "compare", "swap", "stop"].includes(a)) actors.push({ id: "b", emoji: "👔", name: "Boss", node: heapId(bossNow) });
    const list = heapList(step);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = hires === 0 ? "Nobody is hired, so the chart is empty." : `${hires} ${hires === 1 ? "person joins" : "people join"} the company one at a time. The first hire takes the top desk.`;
        break;
      case "insert":
        says = `A new hire, rank ${c}, takes the next free desk at the bottom of the chart.`;
        inCode = "heap[size++] = value";
        break;
      case "sift-up":
        says = parent === null ? `Rank ${c} has reached the top desk. There is no boss above, so the climb is over.` : `Look at the boss one level up: rank ${p}.`;
        inCode = "parent = (child - 1) / 2";
        break;
      case "compare":
        says = c !== undefined && p !== undefined ? `Rank ${c} against the boss, rank ${p}: ${c < p ? `${c} is smaller, so the new hire is more senior and must swap.` : `${c} is not smaller, so the boss stays above.`}` : says;
        inCode = "if (heap[child] < heap[parent])";
        break;
      case "swap":
        says = `They swap desks: rank ${c} moves up one level and rank ${p} moves down.`;
        inCode = "swap(heap[child], heap[parent])";
        break;
      case "stop":
        says = `The boss (rank ${p}) is at least as senior as the new hire (${c}), so the rule holds here. The climb stops.`;
        inCode = "break";
        break;
      case "finish":
        says = hires === 0 ? "There is nothing to arrange." : "Everyone is seated. Every boss has a smaller rank than the people reporting to them.";
        banner = hires === 0 ? { kind: "info", text: "No one was hired, so the chart is empty." } : { kind: "good", text: `The finished chart, top desk first: ${listText(list)}.` };
        break;
    }
    return { tones, actors: standOn(step, actors), says, inCode, banner, board: { label: "Chart as a list", text: listText(list) } };
  },
};
