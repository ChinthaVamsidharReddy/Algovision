import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** A row of desks forms a chart where desk d's two reports sit at desks 2d and 2d+1. The strongest sits at the top and is sent to the back, again and again. */
export const heapSortStory: Story = {
  id: "heap-sort",
  title: "Crowning the Champions",
  emoji: "👑",
  hook: "Contestants sit at desks in a row (the numbers are strengths). The desks form a chart: the contestant at desk d is the boss of the contestants at desks 2d and 2d+1. First the chart is put in order so that every boss is stronger than both reports, which puts the strongest contestant at desk 1. Then the champion at desk 1 swaps with the last desk of the chart and stays there for good. The new boss at desk 1 sinks to its right level, and the next champion rises to the top.",
  cast: [
    { emoji: "🧑‍💼", name: "Boss", means: "root: the desk being fixed" },
    { emoji: "🔍", name: "Looker", means: "left / right: the report being compared" },
    { emoji: "👑", name: "Champion", means: "index 0: the strongest value left" },
    { emoji: "🏁", name: "Last desk", means: "end: where the champion goes for good" },
  ],
  moral: "Build a max-heap, then keep swapping the top (the largest) to the end and shrinking the heap by one. The sorted part grows from the back, and every step costs at most the height of the heap: O(n log n) in total and no extra memory.",
  frame(step, trace): StoryFrame {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const root = variable(step, "root");
    const largest = variable(step, "largest");
    const left = variable(step, "left");
    const right = variable(step, "right");
    const end = variable(step, "end");
    const start = variable(step, "start");
    const ok = (x: number | null): x is number => x !== null && x >= 0 && x < n;
    const role = new Map<number, string>();
    for (const h of step.highlights) if (h.target.kind === "index" && h.role !== "window") role.set(h.target.index, h.role);
    // The size of the chart while sifting is only reported at some steps: look back for it.
    let size = n;
    for (let i = step.index; i >= 0; i--) {
      const s = variable(trace.steps[i]!, "size");
      if (s !== null) { size = s; break; }
    }
    const cells: StoryCell[] = values.map((v, k) => {
      const r = role.get(k);
      return { main: String(v), sub: r === "sorted" || a === "finish" ? "final" : `desk ${k + 1}`, tone: r === "sorted" || a === "finish" ? "good" : r === "compared" ? "warn" : r === "active" || r === "swapped" ? "hit" : r === "found" ? "good" : "plain" };
    });
    const actors: StoryFrame["actors"] = [];
    const sifting = ["build-heap", "sift-entry", "pick-largest", "compare-left", "compare-right", "sift-done", "sift-move"].includes(a);
    if (sifting && ok(a === "build-heap" ? start : root)) actors.push({ id: "b", emoji: "🧑‍💼", name: "Boss", at: (a === "build-heap" ? start : root)! });
    if (a === "sift-swap" && ok(largest)) actors.push({ id: "b", emoji: "🧑‍💼", name: "Boss", at: largest });
    const lookAt = a === "compare-left" ? left : a === "compare-right" ? right : null;
    if (ok(lookAt) && lookAt < size) actors.push({ id: "l", emoji: "🔍", name: "Looker", at: lookAt, row: "bottom" });
    if (["extract-loop", "extract-swap"].includes(a) && ok(end)) {
      actors.push({ id: "e", emoji: "🏁", name: "Last desk", at: end, row: "bottom" });
      if (end !== 0 && a === "extract-loop") actors.push({ id: "c", emoji: "👑", name: "Champion", at: 0 });
    }
    const v = (i: number | null) => (ok(i) ? values[i] : undefined);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n < 2 ? "With fewer than two contestants there is nothing to sort." : `${n} contestants sit at desks. First the chart is put in order so every boss is stronger than the two desks that report to it.`;
        break;
      case "build-heap":
        says = `Phase 1: put the chart in order, from the lowest boss upward. Next boss to check: desk ${(start ?? 0) + 1} (strength ${v(start)}).`;
        inCode = "for (start = n / 2 - 1; start >= 0; start--)";
        break;
      case "sift-entry":
        says = `The boss at desk ${(root ?? 0) + 1} (strength ${v(root)}) checks the contestants who report to it. The chart has ${size} ${size === 1 ? "desk" : "desks"} in it.`;
        inCode = "siftDown(values, root, size)";
        break;
      case "pick-largest":
        says = `Assume the boss (${v(root)}) is the strongest of the family.`;
        inCode = "largest = root";
        break;
      case "compare-left": {
        const l = ok(left) && left < size ? values[left] : undefined;
        const b = v(largest);
        says = l === undefined ? "There is no report on the left." : b === undefined ? says : `Left report ${l} against ${b}: ${l > b ? `${l} is stronger, so it becomes the strongest so far.` : `${l} is not stronger.`}`;
        inCode = "if (left < size && values[left] > values[largest])";
        break;
      }
      case "compare-right": {
        const r = ok(right) && right < size ? values[right] : undefined;
        const b = v(largest);
        says = r === undefined ? "There is no report on the right." : b === undefined ? says : `Right report ${r} against ${b}: ${r > b ? `${r} is stronger, so it becomes the strongest so far.` : `${r} is not stronger.`}`;
        inCode = "if (right < size && values[right] > values[largest])";
        break;
      }
      case "sift-done":
        says = `The boss (${v(root)}) is at least as strong as every report, so the chart rule holds here.`;
        inCode = "if (largest == root) return";
        break;
      case "sift-swap":
        says = `The boss (${v(largest)}) swaps with the stronger report (${v(root)}): the stronger one moves up, the boss moves down a level.`;
        inCode = "swap(values[root], values[largest])";
        break;
      case "sift-move":
        says = `Follow the boss down to desk ${(root ?? 0) + 1} and check its reports again.`;
        inCode = "root = largest";
        break;
      case "extract-loop":
        says = `Phase 2: the strongest contestant is the champion at desk 1 (${values[0]}). It will go to the last desk of the chart, desk ${(end ?? 0) + 1}, and stay there for good.`;
        inCode = "for (end = n - 1; end > 0; end--)";
        break;
      case "extract-swap":
        says = `The champion (${v(end)}) is now at desk ${(end ?? 0) + 1}, its final place. The contestant that came from there (${values[0]}) is at the top and must sink to its right level.`;
        inCode = "swap(values[0], values[end])";
        break;
      case "finish":
        says = n < 2 ? "Nothing needed doing: the row is already in order." : "Every champion has been sent to the back in turn, so the row runs from weakest to strongest.";
        banner = { kind: "good", text: "Sorted from smallest to largest." };
        inCode = "// all desks final";
        break;
    }
    return { cells, actors, says, inCode, banner };
  },
};
