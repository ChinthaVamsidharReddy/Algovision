import { anchorOf, variable, type Story, type StoryActor, type StoryFrame } from "./types";
import { rolesOf } from "./string-util";

/** A frog on lily pads; each pad says how far it may leap. Track the farthest pad it could possibly reach. */
export const jumpGameStory: Story = {
  id: "jump-game",
  title: "The Frog on the Lily Pads",
  emoji: "🐸",
  hook: "A row of lily pads, each marked with the longest leap the frog may take from it. Can the frog get from the first pad to the last? It does not need to try every route. It walks pad by pad and remembers one thing: the farthest pad it could possibly reach. If it ever stands on a pad beyond that reach, it is stuck for good.",
  cast: [
    { emoji: "🐸", name: "Frog", means: "i: the pad being checked" },
    { emoji: "🚩", name: "Farthest reach", means: "reach: the farthest pad any leap could land on" },
    { emoji: "🟢", name: "Reachable pad", means: "a pad the frog can get to (green)" },
  ],
  moral: "Greedy: keep the farthest reachable position. If the current position is ever beyond it, the end cannot be reached; if the reach covers the last position, it can.",
  frame(step): StoryFrame {
    const a = anchorOf(step);
    const v = step.state.values;
    const n = v.length;
    const i = variable(step, "i");
    const reach = variable(step, "reach") ?? 0;
    const shown = Math.min(reach, Math.max(0, n - 1));
    const roles = rolesOf(step);
    const cells = v.map((x, k) => {
      const r = roles.get(k);
      return { main: String(x), sub: `pad ${k}`, tone: r === "active" ? ("hit" as const) : r === "compared" ? ("warn" as const) : r === "pointer" || r === "found" ? ("good" as const) : ("plain" as const) };
    });
    const actors: StoryActor[] = [];
    if (i !== null && i < n && ["loop", "extend", "stuck"].includes(a)) actors.push({ id: "f", emoji: "🐸", name: "Frog", at: i });
    if (n > 0 && a !== "entry" && a !== "finish") actors.push({ id: "r", emoji: "🚩", name: "Reach", at: shown, row: "bottom" });
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = n === 1 ? "There is only one pad, so the frog is already on the last pad." : `${n} lily pads, each marked with the longest leap from it. Can the frog get from pad 0 to pad ${n - 1}?`;
        break;
      case "init":
        says = "At first the frog knows only that pad 0 is reachable.";
        inCode = "reach = 0";
        break;
      case "loop":
        says = `The frog checks pad ${i}.`;
        inCode = "for (i = 0; i < n; i++)";
        break;
      case "extend":
        says = `From pad ${i} it can leap up to ${v[i ?? 0]}, so pads up to ${(i ?? 0) + (v[i ?? 0] ?? 0)} are within reach. The farthest reachable pad is now ${shown}${reach >= n - 1 ? ", which covers the last pad" : ""}.`;
        inCode = "reach = max(reach, i + nums[i])";
        break;
      case "stuck":
        says = `Pad ${i} is beyond the farthest pad the frog can reach (${shown}). It can never land there, so the last pad is out of reach.`;
        banner = { kind: "bad", text: "The last pad cannot be reached." };
        break;
      case "finish":
        says = "The farthest reach covered every pad, including the last one.";
        banner = { kind: "good", text: "The last pad can be reached." };
        break;
    }
    return { cells, actors, says, inCode, banner, board: { label: "Farthest reachable pad", text: n === 0 ? "–" : String(shown) } };
  },
};
