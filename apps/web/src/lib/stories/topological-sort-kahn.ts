import { anchorOf, type GraphFrame, type GraphStory } from "./types";
import { graphTones, listOut, num, nums } from "./graph-util";

/** Chores where some must be done before others: do any chore that is waiting on nothing, then free up the ones that needed it. */
export const topologicalSortKahnStory: GraphStory = {
  id: "topological-sort-kahn",
  kind: "graph",
  title: "Chores That Wait on Each Other",
  emoji: "📋",
  hook: "A list of chores where some must be done before others (an arrow from A to B means A first, then B). Each chore wears a number: how many chores it is still waiting on. Any chore waiting on nothing is ready. Do it, and every chore that was waiting for it now waits on one less. Keep going until nothing is ready.",
  cast: [
    { emoji: "🧹", name: "Chore", means: "a vertex of the graph" },
    { emoji: "➡️", name: "Arrow", means: "a rule: the first chore must be done before the second" },
    { emoji: "⏳", name: "Waiting count", means: "the number under a chore: how many chores it still waits on" },
    { emoji: "✅", name: "Ready line", means: "the queue: chores waiting on nothing, in the order they became free" },
  ],
  moral: "Kahn's algorithm repeatedly takes a chore that waits on nothing and removes it from the plan. If every chore gets done, the order is valid. If some chores are left, they all wait on each other in a circle, so no valid order exists.",
  frame(step, trace): GraphFrame {
    const a = anchorOf(step);
    const s = step.state;
    const cur = s.current;
    const toId = s.activeEdge?.to ?? null;
    const tones = graphTones(step, s.visited);
    const badges: Record<string, string> = {};
    for (const n of s.nodes) {
      const m = s.marks[n.id];
      badges[n.id] = m === null || m === undefined ? "–" : String(m);
    }
    const actors = [];
    if (cur) actors.push({ id: "p", emoji: "👷", name: "Doing", node: cur });
    if (toId && (a === "check-neighbor" || a === "decrement" || a === "enqueue")) actors.push({ id: "n", emoji: "🧹", name: "Waiting", node: toId });
    const u = num(step, cur);
    const v = num(step, toId);
    const total = trace.steps[0]!.state.nodes.length;
    const get = (name: string) => step.variables.find((x) => x.name === name)?.value;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GraphFrame["banner"];
    switch (a) {
      case "entry":
        says = `${total} chores, with some rules about what must come first.`;
        break;
      case "build-graph":
        says = `The rules are written down: ${s.edges.length} of them.`;
        inCode = "build adjacency list";
        break;
      case "compute-indegree":
        says = "Count, for every chore, how many chores it must wait for. That number is shown under it.";
        inCode = "indegree[v]++ for each edge u -> v";
        break;
      case "enqueue-zero":
        says = get("v") === undefined || get("v") === null ? "Not one chore is free to start: every chore is waiting on another." : `Chore ${get("v")} waits on nothing, so it is ready. It joins the ready line.`;
        inCode = "if (indegree[v] == 0) queue.add(v)";
        break;
      case "loop":
        says = s.frontier.length ? "There are chores ready to do." : "No chore is ready any more.";
        inCode = "while (!queue.isEmpty())";
        break;
      case "dequeue":
        says = `Pick the first ready chore: chore ${u}.`;
        inCode = "u = queue.poll()";
        break;
      case "emit":
        says = `Do chore ${u}. That is the ${get("placed")}${get("placed") === 1 ? "st" : get("placed") === 2 ? "nd" : get("placed") === 3 ? "rd" : "th"} chore done.`;
        inCode = "order.add(u)";
        break;
      case "neighbors-loop":
        says = `Look at the chores that were waiting for chore ${u}.`;
        inCode = "for (v : adj[u])";
        break;
      case "check-neighbor":
        says = `Chore ${v} was waiting for chore ${u}.`;
        inCode = "for each edge u -> v";
        break;
      case "decrement":
        says = `Chore ${u} is done, so chore ${v} now waits on ${get("indegree")} ${get("indegree") === 1 ? "chore" : "chores"}.`;
        inCode = "indegree[v]--";
        break;
      case "enqueue":
        says = `Chore ${v} now waits on nothing: it is ready and joins the line.`;
        inCode = "queue.add(v)";
        break;
      case "cycle-check":
        says = get("placed") === get("vertices") ? "Every chore got done." : `Only ${get("placed")} of ${get("vertices")} chores could be done. The rest are stuck.`;
        inCode = "if (order.size() != n) cycle";
        break;
      case "cycle-found":
        says = "Some chores are still waiting on each other in a circle, so they can never be done. There is no valid order.";
        inCode = "return empty (cycle)";
        banner = { kind: "bad", text: "No valid order: some chores wait on each other in a circle." };
        break;
      case "finish":
        if (s.output.length === total) {
          says = `A valid order exists: ${s.output.join(", ")}.`;
          banner = { kind: "good", text: `A valid order: ${s.output.join(", ")}.` };
        } else {
          says = `Chores ${nums(step, s.nodes.map((n) => n.id).filter((id) => !s.visited.includes(id)))} all wait on each other in a circle, so no order works.`;
          banner = { kind: "bad", text: "No valid order: some chores wait on each other in a circle." };
        }
        break;
    }
    return { tones, actors, says, inCode, banner, badges, board: { label: "Ready line", text: `${s.frontier.length ? nums(step, s.frontier) : "empty"}   ·   Done: ${listOut(s.output)}` } };
  },
};
