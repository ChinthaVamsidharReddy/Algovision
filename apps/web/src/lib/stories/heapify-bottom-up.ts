import { anchorOf, variable, type ChainFrame, type TreeStory } from "./types";
import { heapId, heapList, heapTones, heapValue, listText, standOn } from "./heap-util";

/** A company is already seated in random order. Starting from the lowest manager and working back to the top, each manager checks their reports and swaps down if one is more senior. */
export const heapifyBottomUpStory: TreeStory = {
  id: "heapify-bottom-up",
  kind: "tree",
  title: "Straightening the Company Chart",
  emoji: "🧹",
  hook: "A whole company has been seated at random desks. The rule is that every boss must have a smaller rank number (more senior) than the people reporting to them. Instead of starting over, the manager of the lowest group checks their reports first. If a report is more senior, they swap and keep checking further down. Then the next manager up does the same, all the way to the top.",
  cast: [
    { emoji: "👔", name: "Manager", means: "the desk being fixed (root of the small tree)" },
    { emoji: "🔍", name: "Looker", means: "the report being compared with the most senior so far" },
    { emoji: "📋", name: "Chart as a list", means: "the heap stored in an array" },
  ],
  moral: "Fix the small groups at the bottom first and work upward. When a manager is checked, everything below is already in order, so the manager only has to sink to the right level. The whole chart is fixed in O(n), faster than inserting one by one.",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const n = trace.steps[0]?.variables.find((v) => v.name === "n")?.value;
    const count = typeof n === "number" ? n : 0;
    const root = variable(step, "root");
    const smallest = variable(step, "smallest");
    const left = variable(step, "left");
    const right = variable(step, "right");
    const managerAt = a === "swap" ? smallest : root;
    const mv = heapValue(step, root);
    const tones = heapTones(step);
    const actors = [];
    if (managerAt !== null && !["entry", "finish"].includes(a)) actors.push({ id: "m", emoji: "👔", name: "Manager", node: heapId(managerAt) });
    const lookAt = a === "compare-left" ? left : a === "compare-right" ? right : null;
    if (lookAt !== null && lookAt < count) actors.push({ id: "l", emoji: "🔍", name: "Looker", node: heapId(lookAt) });
    const firstStart = a === "start" && !trace.steps.slice(0, step.index).some((s) => s.source.kind === "anchor" && s.source.id === "start");
    const list = heapList(step);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    switch (a) {
      case "entry":
        says = count < 2 ? (count === 0 ? "Nobody works here, so the chart is empty." : "One person alone has nobody to compare with, so the chart is already in order.") : `${count} people sit in random desks. The chart has to be put in order, starting from the lowest manager.`;
        break;
      case "start":
        says = `${firstStart ? "Start with the last manager, the lowest desk that has anyone reporting to it. " : ""}Next manager to check: rank ${mv}. Desks with no reports are already in order by themselves.`;
        inCode = "for (start = n / 2 - 1; start >= 0; start--)";
        break;
      case "pick-smallest":
        says = `Assume the manager (rank ${mv}) is the most senior of the manager and the reports.`;
        inCode = "smallest = root";
        break;
      case "compare-left": {
        const best = heapValue(step, smallest);
        const l = heapValue(step, left);
        says = left !== null && left >= count ? "There is no report on the left." : l !== undefined && best !== undefined ? `Left report, rank ${l}, against rank ${best}: ${l < best ? `${l} is smaller, so it is more senior and becomes the best so far.` : `${l} is not smaller, so nothing changes.`}` : says;
        inCode = "if (left < n && heap[left] < heap[smallest])";
        break;
      }
      case "compare-right": {
        const best = heapValue(step, smallest);
        const r = heapValue(step, right);
        says = right !== null && right >= count ? "There is no report on the right." : r !== undefined && best !== undefined ? `Right report, rank ${r}, against rank ${best}: ${r < best ? `${r} is smaller, so it is more senior and becomes the best so far.` : `${r} is not smaller, so nothing changes.`}` : says;
        inCode = "if (right < n && heap[right] < heap[smallest])";
        break;
      }
      case "stop":
        says = `The manager (rank ${mv}) is at least as senior as every report, so they stay here. This part of the chart is in order.`;
        inCode = "if (smallest == root) break";
        break;
      case "swap":
        says = `The manager (rank ${heapValue(step, smallest)}) swaps with the more senior report (rank ${heapValue(step, root)}): that report moves up and the manager moves down a level. The manager is checked again from the new desk.`;
        inCode = "swap(heap[root], heap[smallest])";
        break;
      case "finish":
        says = count < 2 ? "Nothing needed to move: the chart is already in order." : "Every manager has been checked, so every boss is more senior than the people reporting to them.";
        banner = count === 0 ? { kind: "info", text: "No one works here, so the chart is empty." } : { kind: "good", text: `The finished chart, top desk first: ${listText(list)}.` };
        break;
    }
    return { tones, actors: standOn(step, actors), says, inCode, banner, board: { label: "Chart as a list", text: listText(list) } };
  },
};
