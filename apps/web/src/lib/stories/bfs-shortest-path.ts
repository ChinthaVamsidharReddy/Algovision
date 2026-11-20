import { anchorOf, type GraphFrame, type GraphStory } from "./types";
import { graphTones, num, nums, takenOut } from "./graph-util";

/** Metro stops: the fewest stops from your station to every other station, found by travelling outwards one stop at a time. */
export const bfsShortestPathStory: GraphStory = {
  id: "bfs-shortest-path",
  kind: "graph",
  title: "Fewest Metro Stops",
  emoji: "🚇",
  hook: "A metro map has stations and direct links between neighbouring stations. You want to know the fewest stops from your station to every other one. Stations one stop away are found first, then two stops away, and so on. The first time you reach a station is always the shortest way there.",
  cast: [
    { emoji: "🚉", name: "Station", means: "a vertex of the graph" },
    { emoji: "🚇", name: "Train", means: "the station whose neighbours are being checked" },
    { emoji: "🔢", name: "Stops", means: "the number under a station: the fewest stops from the start" },
    { emoji: "🧍🧍", name: "Waiting line", means: "stations found but not yet checked, nearest first" },
  ],
  moral: "In a graph where every link counts the same, a queue finds shortest paths: the first time a station is reached is the shortest, because nearer stations are always handled before farther ones. A station that is never reached has no route.",
  frame(step, trace): GraphFrame {
    const a = anchorOf(step);
    const s = step.state;
    const start = trace.steps[0]!.variables.find((v) => v.name === "start")?.value;
    const cur = s.current;
    const toId = s.activeEdge?.to ?? null;
    const checked = takenOut(trace, step, ["dequeue"]).filter((id) => id !== cur);
    const tones = graphTones(step, checked);
    const badges: Record<string, string> = {};
    for (const n of s.nodes) {
      const m = s.marks[n.id];
      badges[n.id] = m === null || m === undefined ? "–" : String(m);
    }
    const actors = [];
    if (cur) actors.push({ id: "t", emoji: "🚇", name: "Train", node: cur });
    if (toId && (a === "check-neighbor" || a === "relax")) actors.push({ id: "n", emoji: "🚉", name: "Next stop", node: toId });
    const u = num(step, cur);
    const v = num(step, toId);
    const du = cur ? s.marks[cur] : null;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GraphFrame["banner"];
    switch (a) {
      case "entry":
        says = `${s.nodes.length} stations. We start at station ${start} and count stops.`;
        break;
      case "build-graph":
        says = `The links are written down: ${s.edges.length} of them.`;
        inCode = "build adjacency list";
        break;
      case "init-dist":
        says = "No station has a stop count yet (shown as a dash).";
        inCode = "dist[] = -1";
        break;
      case "enqueue-start":
        says = `Station ${start} is 0 stops from itself. Put it in the waiting line.`;
        inCode = "dist[start] = 0; queue.add(start)";
        break;
      case "loop":
        says = s.frontier.length ? `${s.frontier.length === 1 ? "One station is" : `${s.frontier.length} stations are`} waiting to be checked.` : "No station is waiting. Every reachable station has its count.";
        inCode = "while (!queue.isEmpty())";
        break;
      case "dequeue":
        says = `The train moves to station ${u}, which is ${du} ${du === 1 ? "stop" : "stops"} from the start.`;
        inCode = "u = queue.poll()";
        break;
      case "neighbors-loop":
        says = `Look at every station directly linked to station ${u}.`;
        inCode = "for (v : adj[u])";
        break;
      case "check-neighbor": {
        const reached = toId !== null && s.marks[toId] !== null && s.marks[toId] !== undefined;
        says = reached ? `Station ${v} already has a count, found by a shorter or equal way. Leave it.` : `Station ${v} has never been reached.`;
        inCode = "if (dist[v] == -1)";
        break;
      }
      case "relax": {
        const dv = toId ? s.marks[toId] : null;
        says = `Station ${v} is one stop beyond station ${u}: ${dv} ${dv === 1 ? "stop" : "stops"} from the start. Put it in the waiting line.`;
        inCode = "dist[v] = dist[u] + 1; queue.add(v)";
        break;
      }
      case "finish": {
        const parts = s.nodes.map((n, i) => `${n.value}: ${s.output[i] === -1 ? "no route" : s.output[i]}`);
        says = `All done. Fewest stops from station ${start}: ${parts.join(", ")}.`;
        banner = { kind: "good", text: `Fewest stops from ${start} (station: stops): ${parts.join(", ")}.` };
        break;
      }
    }
    return { tones, actors, says, inCode, banner, badges, board: { label: "Waiting line", text: s.frontier.length ? nums(step, s.frontier) : "empty" } };
  },
};
