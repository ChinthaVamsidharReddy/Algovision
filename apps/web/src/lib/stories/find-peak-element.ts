import { anchorOf, variable, type Story, type StoryActor, type StoryCell, type StoryFrame } from "./types";
import { barsOf, outside } from "./ledger-util";

/** A hiker on a ridge in thick fog: at any spot, look at the next spot ahead. If it is higher, go that way; if it is lower, a hilltop is here or behind. */
export const findPeakStory: Story = {
  id: "find-peak-element",
  title: "Climbing in the Fog",
  emoji: "⛰️",
  hook: "A hiker is on a ridge in thick fog and wants any hilltop: a spot higher than the spots next to it. She cannot see the whole ridge, only the spot where she stands and the one just ahead. If the spot ahead is higher she heads that way, because going uphill must lead to a top. If it is lower, a top is here or behind her. Every look halves the stretch left to search.",
  cast: [
    { emoji: "🥾", name: "Hiker", means: "mid: where she stands" },
    { emoji: "👀", name: "Spot ahead", means: "mid + 1: the neighbour she compares with" },
    { emoji: "⛰️", name: "Hilltop", means: "a value larger than both its neighbours" },
  ],
  moral: "Whichever way the ground rises, a peak must lie in that direction, so one comparison with a neighbour discards half the ridge. A peak is found in O(log n) steps without looking at every spot.",
  frame(step): StoryFrame {
    const a = anchorOf(step);
    const values = step.state.values;
    const n = values.length;
    const low = variable(step, "low");
    const high = variable(step, "high");
    const mid = variable(step, "mid");
    const peak = variable(step, "peak");
    const bars = barsOf(values);
    const cells: StoryCell[] = values.map((v, i) => ({
      main: String(v),
      sub: `spot ${i + 1}`,
      bar: bars[i],
      tone: a === "finish" && i === peak ? "good" : i === mid && ["loop", "compare"].includes(a) ? "hit" : mid !== null && i === mid + 1 && ["loop", "compare"].includes(a) ? "warn" : outside(i, low, high) ? "dim" : "plain",
    }));
    const actors: StoryActor[] = [];
    if (mid !== null && mid < n && ["loop", "compare"].includes(a)) actors.push({ id: "h", emoji: "🥾", name: "Hiker", at: mid });
    if (mid !== null && mid + 1 < n && ["loop", "compare"].includes(a)) actors.push({ id: "a", emoji: "👀", name: "Ahead", at: mid + 1, row: "bottom" });
    if (peak !== null && peak < n && a === "finish") actors.push({ id: "p", emoji: "⛰️", name: "Hilltop", at: peak });
    const here = mid !== null && mid < n ? values[mid]! : null;
    const ahead = mid !== null && mid + 1 < n ? values[mid + 1]! : null;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `A ridge of ${n} ${n === 1 ? "spot" : "spots"}. Find any hilltop: a spot higher than its neighbours.`;
        break;
      case "init":
        says = "At first the whole ridge is still in play.";
        inCode = "low = 0; high = n - 1";
        break;
      case "loop":
        says = `The hiker stands at spot ${(mid ?? 0) + 1}, height ${here}, and looks at the spot ahead, height ${ahead}.`;
        inCode = "while (low < high)";
        break;
      case "compare":
        says = here !== null && ahead !== null && here > ahead ? `${here} is higher than ${ahead}: the ground falls ahead, so a hilltop is here or behind.` : `${here} is lower than ${ahead}: the ground rises ahead, so a hilltop lies ahead.`;
        inCode = "if (values[mid] > values[mid + 1])";
        break;
      case "go-left":
        says = `Keep this spot but forget everything ahead of it. The stretch in play now ends at spot ${(high ?? 0) + 1}.`;
        inCode = "high = mid";
        break;
      case "go-right":
        says = `Walk uphill: forget everything up to this spot. The stretch in play now starts at spot ${(low ?? 0) + 1}.`;
        inCode = "low = mid + 1";
        break;
      case "finish":
        says = `Only one spot is left: spot ${(peak ?? 0) + 1}, height ${peak !== null ? values[peak] : "?"}. It is a hilltop.`;
        banner = { kind: "good", text: `A hilltop: height ${peak !== null ? values[peak] : "?"} at spot ${(peak ?? 0) + 1} (index ${peak}).` };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Stretch in play", text: low !== null && high !== null ? `spots ${low + 1} to ${high + 1}` : "the whole ridge" } };
  },
};
