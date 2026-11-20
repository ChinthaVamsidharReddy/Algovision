import { anchorOf, type GraphFrame, type GraphStory } from "./types";
import { graphTones, listOut, num, nums, takenOut } from "./graph-util";

/** A rumor spreads through friends in rings: first your friends, then their friends, and so on. */
export const bfsTraversalStory: GraphStory = {
  id: "bfs-traversal",
  kind: "graph",
  title: "How a Rumor Spreads",
  emoji: "📣",
  hook: "A rumor starts with one person. They tell all of their friends first, those friends tell their own friends, and so on, ring by ring. Nobody is told twice. A waiting line keeps the order: whoever heard the rumor first gets to pass it on first.",
  cast: [
    { emoji: "🧑", name: "Person", means: "a vertex of the graph" },
    { emoji: "🤝", name: "Friendship", means: "an edge between two vertices" },
    { emoji: "🗣️", name: "Gossip", means: "the vertex being processed right now" },
    { emoji: "🧍🧍", name: "Waiting line", means: "the queue: people who know the rumor and have not passed it on yet" },
  ],
  moral: "Breadth-first search finishes everyone close to the start before anyone farther away, because a queue serves the earliest arrival first. Mark people when you tell them, not when they pass it on, so nobody enters the line twice.",
  frame(step, trace): GraphFrame {
    const a = anchorOf(step);
    const s = step.state;
    const start = trace.steps[0]!.variables.find((v) => v.name === "start")?.value;
    const cur = s.current;
    const edge = s.activeEdge;
    const toId = edge?.to ?? null;
    const done = takenOut(trace, step, ["dequeue"]);
    const tones = graphTones(step, done);
    const actors = [];
    if (cur) actors.push({ id: "g", emoji: "🗣️", name: "Gossip", node: cur });
    if (toId && (a === "check-neighbor" || a === "enqueue")) actors.push({ id: "f", emoji: "👂", name: "Friend", node: toId });
    const u = num(step, cur);
    const v = num(step, toId);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GraphFrame["banner"];
    switch (a) {
      case "entry":
        says = `${s.nodes.length} people, joined by friendships. The rumor starts with person ${start}.`;
        break;
      case "build-graph":
        says = `The friendships are written down: ${s.edges.length} of them. Nobody knows the rumor yet.`;
        inCode = "build adjacency list";
        break;
      case "init-visited":
        says = "A list of who has heard the rumor, empty for now, and an empty waiting line.";
        inCode = "visited = {}; queue = []";
        break;
      case "enqueue-start":
        says = `Tell person ${start} the rumor and put them in the waiting line.`;
        inCode = "visited.add(start); queue.add(start)";
        break;
      case "loop":
        says = s.frontier.length ? `${s.frontier.length === 1 ? "One person is" : `${s.frontier.length} people are`} still waiting to pass it on.` : "Nobody is waiting any more.";
        inCode = "while (!queue.isEmpty())";
        break;
      case "dequeue":
        says = `The first in line, person ${u}, steps forward to pass the rumor on.`;
        inCode = "u = queue.poll()";
        break;
      case "visit":
        says = `Person ${u} is counted: they are next in the order the rumor reached people.`;
        inCode = "order.add(u)";
        break;
      case "neighbors-loop":
        says = `Person ${u} goes through their friends one by one.`;
        inCode = "for (v : adj[u])";
        break;
      case "check-neighbor": {
        const knows = toId !== null && s.visited.includes(toId);
        says = knows ? `Friend ${v} has heard it already. Skip them.` : `Friend ${v} has not heard it yet.`;
        inCode = "if (!visited.contains(v))";
        break;
      }
      case "enqueue":
        says = `Tell ${v} the rumor and put them at the back of the waiting line.`;
        inCode = "visited.add(v); queue.add(v)";
        break;
      case "finish":
        says = `The rumor has reached everyone it can: ${s.output.length} ${s.output.length === 1 ? "person" : "people"}.`;
        banner = { kind: "good", text: `The rumor reached people in this order: ${s.output.join(", ")}.` };
        break;
    }
    return { tones, actors, says, inCode, banner, board: { label: "Waiting line", text: `${s.frontier.length ? nums(step, s.frontier) : "empty"}   ·   Passed on: ${listOut(s.output)}` } };
  },
};
