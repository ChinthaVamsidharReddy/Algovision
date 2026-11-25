import { anchorOf, variable, type GraphFrame, type GraphStory } from "./types";
import { num, plural } from "./graph-util";
import type { Tone } from "./types";

/** Connecting villages with roads as cheaply as possible: buy the cheapest road first, but never one that links two villages that are already connected. */
export const kruskalStory: GraphStory = {
  id: "kruskal-mst",
  kind: "graph",
  title: "The Cheapest Road Network",
  emoji: "🛣️",
  hook: "A council wants every village connected by road at the lowest total price. The possible roads each have a price. The council goes through them from cheapest to dearest. A road is built only if its two villages are not yet connected (the number under a village is the group it belongs to). If they are already connected, building it would be a waste, so it is skipped.",
  cast: [
    { emoji: "🏘️", name: "Village", means: "a vertex" },
    { emoji: "🛣️", name: "Road", means: "an edge with its price (the weight)" },
    { emoji: "🔢", name: "Group", means: "the number under a village: which connected group it is in" },
    { emoji: "💰", name: "Bill", means: "total: the price of the roads built so far" },
  ],
  moral: "Kruskal's algorithm is greedy: the cheapest road that does not make a loop is always safe to build. Sorting the roads once and using union-find to check for loops gives the cheapest connected network.",
  frame(step, trace): GraphFrame {
    const a = anchorOf(step);
    const s = step.state;
    const total = trace.steps[0]!.state.nodes.length;
    const ae = s.activeEdge;
    const u = num(step, ae?.from);
    const v = num(step, ae?.to);
    const weight = variable(step, "weight");
    const ga = variable(step, "a");
    const gb = variable(step, "b");
    const bill = s.output.reduce((x, y) => x + y, 0);
    const tones: Record<string, Tone> = {};
    const badges: Record<string, string> = {};
    for (const n of s.nodes) badges[n.id] = String(s.marks[n.id] ?? "–");
    const actors: GraphFrame["actors"] = [];
    if (ae && ["edge-loop", "find", "check-roots", "take-edge"].includes(a)) {
      actors.push({ id: "p", emoji: "🏘️", name: "Village", node: ae.from }, { id: "q", emoji: "🏘️", name: "Village", node: ae.to });
      const same = ga !== null && ga === gb;
      const t: Tone = a === "edge-loop" ? "warn" : a === "find" ? "warn" : a === "take-edge" ? "good" : same ? "dim" : "hit";
      tones[ae.from] = t;
      tones[ae.to] = t;
    }
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GraphFrame["banner"];
    switch (a) {
      case "entry":
        says = `${plural(total, "village", "villages")} and ${plural(s.edges.length, "possible road", "possible roads")}, each with a price. Build the cheapest network that connects what can be connected.`;
        break;
      case "sort-edges":
        says = "Line the roads up from cheapest to dearest.";
        inCode = "sort edges by weight";
        break;
      case "init-parents":
        says = "At the start no road is built, so every village is a group of its own.";
        inCode = "parent[i] = i";
        break;
      case "edge-loop":
        says = `Next cheapest road: ${u} to ${v}, price ${weight}.`;
        inCode = "for (edge in sorted edges)";
        break;
      case "find":
        says = `Which group is village ${u} in? Group ${ga}. And village ${v}? Group ${gb}.`;
        inCode = "a = find(u); b = find(v)";
        break;
      case "check-roots":
        says = ga === gb ? `Both villages are in group ${ga}: they are already connected. This road would only make a loop, so skip it.` : `Groups ${ga} and ${gb} are different: this road would connect two separate parts. Worth building.`;
        inCode = "if (a != b)";
        break;
      case "take-edge":
        says = `Build the road ${u}–${v} for ${weight}. The two groups become one. The bill is now ${bill}.`;
        inCode = "union(a, b); total += weight";
        break;
      case "finish": {
        const roads = s.output.length;
        const done = roads === Math.max(total - 1, 0);
        says = done ? `The network is complete: ${plural(roads, "road", "roads")} for a total of ${bill}.` : `Some villages cannot be reached at all. The cheapest roads built cost ${bill}, with ${plural(roads, "road", "roads")}.`;
        banner = { kind: done ? "good" : "info", text: done ? `Cheapest network costs ${bill}.` : `Cheapest possible roads cost ${bill}; not every village can be connected.` };
        break;
      }
    }
    return { tones, actors, says, inCode, banner, badges, board: { label: "Roads built (prices)", text: `${s.output.length ? s.output.join(" + ") : "none yet"}   ·   Bill: ${bill}` } };
  },
};
