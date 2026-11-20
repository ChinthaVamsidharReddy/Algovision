import { anchorOf, type GraphFrame, type GraphStory } from "./types";
import { graphTones, num, nums } from "./graph-util";

/** A delivery driver finds the cheapest route to every town, always settling the cheapest town found so far. */
export const dijkstraStory: GraphStory = {
  id: "dijkstra",
  kind: "graph",
  title: "The Cheapest Delivery Route",
  emoji: "🚚",
  hook: "A delivery driver leaves a depot and wants the cheapest fuel cost to every town. Roads have different costs, shown on them. Each time the driver picks the cheapest town found so far and settles it: no later road can make it cheaper, because every other road costs something. From there, new towns and shortcuts are noted.",
  cast: [
    { emoji: "🏘️", name: "Town", means: "a vertex of the graph" },
    { emoji: "🚚", name: "Driver", means: "the town just settled, whose roads are checked" },
    { emoji: "⛽", name: "Cost", means: "the number under a town: the cheapest cost found so far" },
    { emoji: "🛣️", name: "Road", means: "an edge, with its cost written on it" },
  ],
  moral: "Dijkstra settles the cheapest unsettled town, then checks whether going through it makes any neighbour cheaper. It works because road costs are never negative: a settled town can never be beaten later.",
  frame(step, trace): GraphFrame {
    const a = anchorOf(step);
    const s = step.state;
    const start = trace.steps[0]!.variables.find((v) => v.name === "start")?.value;
    const cur = s.current;
    const toId = s.activeEdge?.to ?? null;
    const settled = s.visited;
    const tones = graphTones(step, settled);
    const badges: Record<string, string> = {};
    for (const n of s.nodes) {
      const m = s.marks[n.id];
      badges[n.id] = m === null || m === undefined ? "–" : String(m);
    }
    const actors = [];
    if (cur) actors.push({ id: "d", emoji: "🚚", name: "Driver", node: cur });
    if (toId && (a === "check-neighbor" || a === "relax")) actors.push({ id: "n", emoji: "🏘️", name: "Next town", node: toId });
    const get = (name: string) => step.variables.find((x) => x.name === name)?.value;
    const u = num(step, cur);
    const v = num(step, toId);
    const weight = get("weight");
    const through = get("through");
    const dv = toId ? s.marks[toId] : null;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GraphFrame["banner"];
    switch (a) {
      case "entry":
        says = `${s.nodes.length} towns joined by roads with costs. The depot is town ${start}.`;
        break;
      case "build-graph":
        says = `The roads and their costs are written down: ${s.edges.length} roads.`;
        inCode = "build adjacency list";
        break;
      case "init-dist":
        says = `Town ${start} costs 0 to reach (we are there). Every other town is unknown, shown as a dash.`;
        inCode = "dist[start] = 0; others = infinity";
        break;
      case "loop":
        says = s.frontier.length ? `Round ${get("round")}: some towns are found but not settled yet.` : "No unsettled town is reachable. We are finished.";
        inCode = "while (candidates not empty)";
        break;
      case "select-min":
        says = `The cheapest unsettled town found so far is town ${u}, at cost ${get("dist")}.`;
        inCode = "u = town with smallest dist";
        break;
      case "settle":
        says = `Settle town ${u}: ${get("dist")} is its final cheapest cost, because every other route to it would cost at least as much.`;
        inCode = "visited.add(u)";
        break;
      case "neighbors-loop":
        says = `The driver looks at every road leaving town ${u}.`;
        inCode = "for (v, w : adj[u])";
        break;
      case "check-neighbor":
        says = through === undefined || through === null ? `Town ${v} is already settled with its cheapest cost. Skip it.` : `Via town ${u}, town ${v} would cost ${get("through")} (${get("dist") ?? s.marks[cur ?? ""]} so far + road ${weight}).`;
        inCode = "if (dist[u] + w < dist[v])";
        break;
      case "relax":
        says = `That is cheaper than before, so town ${v} now costs ${dv}.`;
        inCode = "dist[v] = dist[u] + w";
        break;
      case "finish": {
        const parts = s.nodes.map((n, i) => `${n.value}: ${s.output[i] === -1 ? "no route" : s.output[i]}`);
        says = `All reachable towns are settled. Cheapest cost from town ${start}: ${parts.join(", ")}.`;
        banner = { kind: "good", text: `Cheapest cost from ${start} (town: cost): ${parts.join(", ")}.` };
        break;
      }
    }
    return { tones, actors, says, inCode, banner, badges, board: { label: "Found, not settled", text: s.frontier.length ? nums(step, s.frontier) : "none" } };
  },
};
