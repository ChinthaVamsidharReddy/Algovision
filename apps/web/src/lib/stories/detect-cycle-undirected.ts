import { anchorOf, variable, type GraphFrame, type GraphStory } from "./types";
import { num } from "./graph-util";
import type { Tone } from "./types";

/** A rumour spreads from person to person. Everyone remembers who told them. Hearing it again from someone other than the teller means two routes: a loop. */
export const detectCycleUndirectedStory: GraphStory = {
  id: "detect-cycle-undirected",
  kind: "graph",
  title: "The Rumour That Comes Back",
  emoji: "🗣️",
  hook: "A rumour starts with one person and spreads to everyone they know. Each person remembers who told them (the number under them says \"from\"). Now, when someone is about to tell the rumour to a person who has already heard it, there are two cases. If that person is simply the one who told them, nothing odd. If it is somebody else, the rumour reached that person by two different routes, which means the friendships form a loop.",
  cast: [
    { emoji: "🗣️", name: "Teller", means: "u: the person passing the rumour on" },
    { emoji: "👂", name: "Listener", means: "v: the friend being told" },
    { emoji: "📌", name: "From", means: "parent: who told each person (the number under them)" },
    { emoji: "📚", name: "Waiting line", means: "the queue: people who heard it but have not told their friends yet (amber)" },
  ],
  moral: "In a graph search, meeting an already-seen vertex that is not the one you came from proves there are two routes to it, so there is a cycle. If the search ends without that, the graph is a forest.",
  frame(step, trace): GraphFrame {
    const a = anchorOf(step);
    const s = step.state;
    const total = trace.steps[0]!.state.nodes.length;
    const cur = s.current;
    const toId = s.activeEdge?.to ?? null;
    const u = num(step, cur);
    const v = num(step, toId);
    const parent = variable(step, "parent");
    const tones: Record<string, Tone> = {};
    const badges: Record<string, string> = {};
    for (const id of s.visited) if (!s.frontier.includes(id)) tones[id] = "good";
    for (const id of s.frontier) tones[id] = "warn";
    for (const n of s.nodes) {
      const m = s.marks[n.id];
      badges[n.id] = m === null || m === undefined ? "–" : `from ${m}`;
    }
    if (cur) tones[cur] = "hit";
    const actors: GraphFrame["actors"] = [];
    if (cur && !["entry", "build-graph", "init-visited", "finish"].includes(a)) actors.push({ id: "p", emoji: "🗣️", name: "Teller", node: cur });
    if (toId && ["check-neighbor", "enqueue", "cycle-check", "cycle-found"].includes(a)) actors.push({ id: "n", emoji: "👂", name: "Listener", node: toId });
    const seen = toId !== null && s.visited.includes(toId);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GraphFrame["banner"];
    switch (a) {
      case "entry":
        says = `${total} ${total === 1 ? "person" : "people"} and some friendships. Can a rumour ever travel in a circle?`;
        break;
      case "build-graph":
        says = `The friendships are written down: ${s.edges.length}.`;
        inCode = "adjacency matrix";
        break;
      case "init-visited":
        says = "Nobody has heard the rumour yet.";
        inCode = "visited[] = false; parent[] = -1";
        break;
      case "outer-loop":
        says = `Person ${u} has not heard it. Start a rumour there (the friends may be in several separate groups).`;
        inCode = "for (s = 0; s < n; s++) if (!visited[s])";
        break;
      case "enqueue-start":
        says = `Person ${u} knows it first, so nobody told them. They join the waiting line.`;
        inCode = "visited[s] = true; queue.add(s)";
        break;
      case "loop":
        says = s.frontier.length ? "Someone is waiting to pass the rumour on." : "Nobody is waiting any more.";
        inCode = "while (!queue.isEmpty())";
        break;
      case "dequeue":
        says = parent !== null && parent >= 0 ? `Next in line: ${u}, who heard it from ${parent}.` : `Next in line: ${u}, who started it.`;
        inCode = "u = queue.poll()";
        break;
      case "neighbors-loop":
        says = `${u} goes through their friends one by one.`;
        inCode = "for (v : neighbors of u)";
        break;
      case "check-neighbor":
        says = seen ? `${u} meets friend ${v}, who has already heard it.` : `${u} meets friend ${v}, who has not heard it yet.`;
        inCode = "if (!visited[v])";
        break;
      case "enqueue":
        says = `${u} tells ${v}. ${v} remembers it came from ${u} and joins the line.`;
        inCode = "visited[v] = true; parent[v] = u; queue.add(v)";
        break;
      case "cycle-check":
        if (v === parent) {
          says = `${v} is the one who told ${u}, so this friendship is just the way the rumour arrived. Not a loop.`;
          if (toId) tones[toId] = "dim";
        } else {
          says = `${v} already heard it, and ${u} did not hear it from ${v}. The rumour reached ${v} by a different route, so there is a loop.`;
          if (toId) tones[toId] = "warn";
        }
        inCode = "else if (v != parent) cycle";
        break;
      case "cycle-found":
        says = `Found a loop through the friendship ${u}–${v}. The answer is yes.`;
        inCode = "return true";
        banner = { kind: "bad", text: "There is a loop: the rumour can come back around." };
        break;
      case "finish":
        says = s.output[0] === 1 ? "A loop was found." : "Everyone has been told and no rumour ever came back around.";
        banner = s.output[0] === 1 ? { kind: "bad", text: "There is a loop." } : { kind: "good", text: "No loop: the friendships form a forest." };
        break;
    }
    return { tones, actors, says, inCode, banner, badges, board: { label: "Waiting line", text: s.frontier.length ? s.frontier.map((id) => num(step, id)).join(", ") : "empty" } };
  },
};
