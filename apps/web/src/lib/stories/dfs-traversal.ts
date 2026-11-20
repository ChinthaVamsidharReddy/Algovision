import { anchorOf, type GraphFrame, type GraphStory } from "./types";
import { graphTones, listOut, num, nums } from "./graph-util";

/** Exploring a maze of rooms with a ball of thread: go through the first unexplored door, and roll the thread back at a dead end. */
export const dfsTraversalStory: GraphStory = {
  id: "dfs-traversal",
  kind: "graph",
  title: "The Maze and the Thread",
  emoji: "🧵",
  hook: "You are exploring a maze of rooms joined by doors. You tie a thread at the entrance and always walk through the first door that leads somewhere new, as deep as you can go. At a dead end you wind the thread back to the last room that still has an unopened door. That is how you visit every room without getting lost.",
  cast: [
    { emoji: "🚪", name: "Room", means: "a vertex of the graph" },
    { emoji: "🧭", name: "Explorer", means: "the room you are standing in" },
    { emoji: "🧵", name: "Thread", means: "the call stack: the path from the entrance to here" },
    { emoji: "✅", name: "Explored", means: "a room you have already entered (never entered twice)" },
  ],
  moral: "Depth-first search goes as deep as it can before it backs up. The thread is the recursion stack, so winding it back is just a function returning.",
  frame(step, trace): GraphFrame {
    const a = anchorOf(step);
    const s = step.state;
    const prev = step.index > 0 ? trace.steps[step.index - 1]! : null;
    const start = trace.steps[0]!.variables.find((v) => v.name === "start")?.value;
    const cur = s.current;
    const toId = s.activeEdge?.to ?? null;
    const tones = graphTones(step, s.visited.filter((id) => !s.frontier.includes(id)));
    for (const id of s.visited) if (!tones[id]) tones[id] = "good";
    if (cur) tones[cur] = "hit";
    const actors = cur ? [{ id: "e", emoji: "🧭", name: "Explorer", node: cur }] : [];
    const u = num(step, cur);
    const v = num(step, toId);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GraphFrame["banner"];
    switch (a) {
      case "entry":
        says = `A maze of ${s.nodes.length} rooms. The explorer will start in room ${start}.`;
        break;
      case "build-graph":
        says = `The doors are written down: ${s.edges.length} of them.`;
        inCode = "build adjacency list";
        break;
      case "init-visited":
        says = "No room has been explored yet.";
        inCode = "visited = {}";
        break;
      case "start-call":
        says = `The explorer ties the thread at the entrance and heads for room ${start}.`;
        inCode = "dfs(start)";
        break;
      case "call":
        says = `Arrive in room ${u}. The thread is ${s.frontier.length} ${s.frontier.length === 1 ? "room" : "rooms"} long.`;
        inCode = "dfs(u)";
        break;
      case "visit":
        says = `Mark room ${u} as explored.`;
        inCode = "visited.add(u); order.add(u)";
        break;
      case "neighbors-loop": {
        const back = prev !== null && prev.state.current !== null && prev.state.current !== cur;
        if (cur === null) says = "Back at the entrance with every door tried. The maze is done.";
        else if (back) says = `Dead end behind us: wind the thread back to room ${u} and try its next door.`;
        else says = `Look at the doors of room ${u}, one at a time.`;
        inCode = "for (v : adj[u])";
        break;
      }
      case "check-neighbor": {
        const seen = toId !== null && s.visited.includes(toId);
        says = seen ? `The door to room ${v} leads to a room we have already explored. Skip it.` : `The door to room ${v} leads somewhere new.`;
        inCode = "if (!visited.contains(v))";
        break;
      }
      case "recurse":
        says = `Walk through the door into room ${v}, unrolling more thread.`;
        inCode = "dfs(v)";
        break;
      case "finish":
        says = `Every reachable room has been explored: ${s.output.length}.`;
        banner = { kind: "good", text: `The rooms were explored in this order: ${s.output.join(", ")}.` };
        break;
    }
    return { tones, actors, says, inCode, banner, board: { label: "Thread (entrance to here)", text: `${s.frontier.length ? nums(step, s.frontier) : "empty"}   ·   Explored: ${listOut(s.output)}` } };
  },
};
