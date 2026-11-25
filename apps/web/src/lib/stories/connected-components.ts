import { anchorOf, variable, type GraphFrame, type GraphStory } from "./types";
import { marked, num, plural } from "./graph-util";
import type { Tone } from "./types";

/** A painter gives every group of linked towns its own colour: pick an unpainted town, paint it, then spread the colour along every road. */
export const connectedComponentsStory: GraphStory = {
  id: "connected-components",
  kind: "graph",
  title: "Painting Linked Towns",
  emoji: "🖌️",
  hook: "A map of towns and roads. A painter wants to know how many separate regions there are, where a region is a set of towns you can drive between. He walks along the towns in order. A town without paint starts a new region with a new colour. Then he spreads that colour to every town he can reach by road. The number under a town is its region (– means unpainted).",
  cast: [
    { emoji: "🏘️", name: "Town", means: "a vertex of the graph" },
    { emoji: "🖌️", name: "Painter", means: "u: the town being spread from" },
    { emoji: "🎨", name: "Region number", means: "the label under a town: its component" },
    { emoji: "📚", name: "To-do pile", means: "the stack of painted towns whose roads are not checked yet (amber)" },
  ],
  moral: "A flood fill from an unlabelled vertex labels exactly one component. Count how many fills you start and you have the number of components, with every vertex and edge visited once.",
  frame(step, trace): GraphFrame {
    const a = anchorOf(step);
    const s = step.state;
    const total = trace.steps[0]!.state.nodes.length;
    const cur = s.current;
    const u = num(step, cur);
    const v = num(step, s.activeEdge?.to);
    const count = variable(step, "count") ?? 0;
    const labelOf = (id: string | null | undefined) => (id ? s.marks[id] : null);
    const tones: Record<string, Tone> = {};
    const badges: Record<string, string> = {};
    for (const id of marked(step)) tones[id] = "good";
    for (const id of s.frontier) tones[id] = "warn";
    for (const n of s.nodes) {
      const m = s.marks[n.id];
      badges[n.id] = m === null || m === undefined ? "–" : String(m + 1);
    }
    if (cur) tones[cur] = "hit";
    const actors: GraphFrame["actors"] = [];
    if (cur && !["entry", "build-graph", "init-labels", "finish", "next-component"].includes(a)) actors.push({ id: "p", emoji: "🖌️", name: "Painter", node: cur });
    if (s.activeEdge && (a === "check-neighbor" || a === "label")) actors.push({ id: "n", emoji: "🏘️", name: "Next", node: s.activeEdge.to });
    const nbrs = cur ? s.edges.flatMap((e) => (e.from === cur ? [num(step, e.to)] : e.to === cur ? [num(step, e.from)] : [])).sort((x, y) => (x ?? 0) - (y ?? 0)) : [];
    const regions = (n: number) => plural(n, "region", "regions");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GraphFrame["banner"];
    switch (a) {
      case "entry":
        says = `${plural(total, "town", "towns")} on the map. How many separate regions are there?`;
        break;
      case "build-graph":
        says = `The roads are written down: ${plural(s.edges.length, "road", "roads")}.`;
        inCode = "adjacency matrix";
        break;
      case "init-labels":
        says = "No town is painted yet.";
        inCode = "label[i] = -1";
        break;
      case "outer-loop":
        says = labelOf(cur) === null || labelOf(cur) === undefined ? `Town ${u} is not painted. It starts a new region.` : `Town ${u} is already painted (region ${(labelOf(cur) ?? 0) + 1}). Skip it.`;
        inCode = "for (s = 0; s < n; s++) if (label[s] == -1)";
        break;
      case "new-component":
        says = `Paint town ${u} with colour ${count + 1} and put it on the to-do pile.`;
        inCode = "label[s] = count; stack.push(s)";
        break;
      case "pop":
        says = `Take town ${u} off the pile. Its roads are next.`;
        inCode = "u = stack.pop()";
        break;
      case "neighbors-loop":
        says = nbrs.length ? `Town ${u} has roads to ${nbrs.join(", ")}.` : `Town ${u} has no roads at all.`;
        inCode = "for (v : neighbors of u)";
        break;
      case "check-neighbor":
        says = labelOf(s.activeEdge?.to) === null || labelOf(s.activeEdge?.to) === undefined ? `Town ${v} is unpainted, so it is in the same region as ${u}.` : `Town ${v} is already painted (region ${(labelOf(s.activeEdge?.to) ?? 0) + 1}).`;
        inCode = "if (label[v] == -1)";
        break;
      case "label":
        says = `Paint town ${v} with colour ${count + 1} and put it on the pile.`;
        inCode = "label[v] = count; stack.push(v)";
        break;
      case "next-component":
        says = `The pile is empty: no more towns can be reached. Region ${count} is complete. ${regions(count)} so far.`;
        inCode = "count++";
        break;
      case "finish":
        says = `Every town is painted. The map has ${regions(count || s.output[0] || 0)}.`;
        banner = { kind: "good", text: `${regions(s.output[0] ?? count)}.` };
        break;
    }
    return { tones, actors, says, inCode, banner, badges, board: { label: "Regions found", text: `${a === "finish" ? (s.output[0] ?? count) : count}` } };
  },
};
