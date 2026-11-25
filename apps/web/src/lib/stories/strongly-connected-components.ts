import { anchorOf, variable, type GraphFrame, type GraphStory } from "./types";
import { gid, plural } from "./graph-util";
import type { Tone } from "./types";

/** One-way streets: a neighbourhood is a set of places where you can drive from any place to any other and back. Kosaraju finds them with two walks. */
export const stronglyConnectedStory: GraphStory = {
  id: "strongly-connected-components",
  kind: "graph",
  title: "Neighbourhoods of One-Way Streets",
  emoji: "🚗",
  hook: "A town with only one-way streets. A neighbourhood is a group of places where you can get from any one to any other and back again. To find them, first wander the whole map and write down each place in the order you finish with it. Then turn every street around, and starting from the place finished last, see which places you can reach. Those places, and only those, form one neighbourhood.",
  cast: [
    { emoji: "📍", name: "Place", means: "a vertex" },
    { emoji: "🚗", name: "Driver", means: "u: the place being explored" },
    { emoji: "🔢", name: "Number under a place", means: "walk 1: when it was finished; walk 2: its neighbourhood" },
    { emoji: "📚", name: "Trail", means: "the places on the current path (amber)" },
  ],
  moral: "Kosaraju's algorithm does a depth-first search to get the finishing order, reverses every edge, then searches again in reverse finishing order. Each search in the second pass reaches exactly one strongly connected component.",
  frame(step, trace): GraphFrame {
    const a = anchorOf(step);
    const s = step.state;
    const total = trace.steps[0]!.state.nodes.length;
    const second = trace.steps.some((t) => t.index <= step.index && anchorOf(t) === "second-init");
    const cur = s.current;
    const ae = s.activeEdge;
    const u = variable(step, "u");
    const v = variable(step, "v");
    const count = variable(step, "count") ?? 0;
    const tones: Record<string, Tone> = {};
    const badges: Record<string, string> = {};
    for (const id of s.visited) if (!s.frontier.includes(id)) tones[id] = "good";
    for (const id of s.frontier) tones[id] = "warn";
    for (const n of s.nodes) {
      if (second) {
        const m = s.marks[n.id];
        badges[n.id] = m === null || m === undefined ? "–" : `N${m + 1}`;
      } else {
        const k = s.output.indexOf(n.value);
        badges[n.id] = k < 0 ? "–" : `#${k + 1}`;
      }
    }
    if (cur) tones[cur] = "hit";
    const actors: GraphFrame["actors"] = [];
    if (cur && ["first-pass", "finish-time", "second-pass"].includes(a)) actors.push({ id: "p", emoji: "🚗", name: "Driver", node: cur });
    const reached = a === "second-pass" && v !== null ? gid(v) : ae && a === "first-pass" ? ae.to : null;
    if (reached && reached !== cur) actors.push({ id: "n", emoji: "👀", name: "Looking", node: reached });
    const placed = (id: string) => (second ? s.marks[id] !== null && s.marks[id] !== undefined : s.visited.includes(id));
    const hood = (n: number) => plural(n, "neighbourhood", "neighbourhoods");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GraphFrame["banner"];
    switch (a) {
      case "entry":
        says = `${plural(total, "place", "places")} joined by one-way streets. How many neighbourhoods are there, where you can get from any place to any other and back?`;
        break;
      case "build-graph":
        says = "The streets and their directions are written down.";
        inCode = "adjacency matrix";
        break;
      case "init-visited":
        says = "Walk 1: wander the whole map. A place is written down once everything reachable from it is finished. Nowhere is visited yet.";
        inCode = "visited[] = false";
        break;
      case "first-loop":
        says = `Place ${u} has not been visited. Start a wander there.`;
        inCode = "for (u in 0..n) if (!visited[u])";
        break;
      case "first-pass":
        if (v === null) {
          says = `Arrive at place ${u}.`;
          inCode = "visited[u] = true";
        } else if (ae && placed(ae.to)) {
          says = `The street ${u}→${v} leads to place ${v}, which is already visited. Do not go there again.`;
          inCode = "if (!visited[v])";
        } else {
          says = `The street ${u}→${v} leads somewhere new. Drive down it.`;
          inCode = "dfs(v)";
        }
        break;
      case "finish-time":
        says = `Every street from place ${u} has been followed. Write ${u} down: it finished number ${variable(step, "finished")}.`;
        inCode = "order.add(u)";
        break;
      case "second-init":
        says = `Walk 1 is finished. Order written down: ${s.output.length ? "see the numbers under the places" : "none"}. Walk 2: turn every street around and start from the place finished last.`;
        inCode = "reverse every edge";
        break;
      case "second-loop":
        says = s.marks[gid(u)] === null || s.marks[gid(u)] === undefined ? `Place ${u} has no neighbourhood yet. It starts a new one.` : `Place ${u} already belongs to a neighbourhood. Skip it.`;
        inCode = "for (u in reverse finish order)";
        break;
      case "second-pass":
        if (v === null) {
          says = `Put place ${u} in neighbourhood ${count + 1}.`;
          inCode = "component[u] = count";
        } else {
          const taken = s.marks[gid(v)] !== null && s.marks[gid(v)] !== undefined;
          says = taken ? `With the street turned around, place ${u} can go back to place ${v}, which is already in a neighbourhood.` : `With the street turned around, place ${u} can reach place ${v}, so ${v} is in the same neighbourhood.`;
          inCode = "for (v : reversed neighbors of u)";
        }
        break;
      case "new-component":
        says = `Neighbourhood ${count} is complete. ${hood(count)} so far.`;
        inCode = "count++";
        break;
      case "finish":
        says = `Both walks are done. There are ${hood(count)}.`;
        banner = { kind: "good", text: `${hood(count)}.` };
        break;
    }
    const board = second ? { label: "Neighbourhoods found", text: `${count}` } : { label: "Finish order", text: s.output.length ? s.output.join(", ") : "none yet" };
    return { tones, actors, says, inCode, banner, badges, board };
  },
};
