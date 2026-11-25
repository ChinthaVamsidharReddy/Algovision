import { anchorOf, variable, type GraphFrame, type GraphStory } from "./types";
import { gid, num, plural } from "./graph-util";
import type { Tone } from "./types";

/** Friends shake hands; every handshake merges two friend circles into one. Each circle has a leader, and you find yours by asking "who is your boss?" up the chain. */
export const unionFindStory: GraphStory = {
  id: "union-find-components",
  kind: "graph",
  title: "Friend Circles and Their Leaders",
  emoji: "🤝",
  hook: "Everyone starts as a circle of one: they are their own leader. Then handshakes happen. For each handshake, ask both people who their circle's leader is. If the leaders are different, the two circles merge: one leader now answers to the other. If the leaders are the same, they were already in one circle. The number under each person is who they answer to (★ means they are a leader).",
  cast: [
    { emoji: "🧑", name: "Person", means: "a vertex of the graph" },
    { emoji: "🤝", name: "Handshake", means: "an edge being processed" },
    { emoji: "👑", name: "Leader", means: "the root of a circle: the person whose boss is themselves (★)" },
    { emoji: "⭕", name: "Circle count", means: "count: how many separate friend circles remain" },
  ],
  moral: "Union-find keeps one leader per circle. Finding a leader climbs the chain of bosses, and shortcuts taken on the way make later questions faster. Every real merge removes one circle, so the circles left at the end are the connected components.",
  frame(step, trace): GraphFrame {
    const a = anchorOf(step);
    const s = step.state;
    const total = trace.steps[0]!.state.nodes.length;
    const groups = s.output[0] ?? total;
    const ae = s.activeEdge;
    const u = num(step, ae?.from);
    const v = num(step, ae?.to);
    const x = variable(step, "x");
    const tones: Record<string, Tone> = {};
    const badges: Record<string, string> = {};
    for (const n of s.nodes) {
      const p = s.marks[n.id];
      badges[n.id] = p === null || p === undefined ? "–" : p === n.value ? "★" : `→${p}`;
      if (p === n.value) tones[n.id] = "dim";
    }
    if (s.current) tones[s.current] = "hit";
    const actors: GraphFrame["actors"] = [];
    if (s.current && !["entry", "init-parents", "finish"].includes(a)) actors.push({ id: "p", emoji: "🧑", name: "Asking", node: s.current });
    if (a === "edge-loop" && ae) {
      actors.push({ id: "p", emoji: "🤝", name: "Hand", node: ae.from }, { id: "q", emoji: "🤝", name: "Hand", node: ae.to });
      tones[ae.from] = "warn";
      tones[ae.to] = "warn";
    }
    const ra = variable(step, "a");
    const rb = variable(step, "b");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GraphFrame["banner"];
    switch (a) {
      case "entry":
        says = `${plural(total, "person", "people")}, and a list of ${plural(s.edges.length, "handshake", "handshakes")}. How many friend circles are there once everyone who shook hands is joined up?`;
        break;
      case "init-parents":
        says = `Nobody knows anybody yet, so everyone is a leader of their own circle. That is ${plural(total, "circle", "circles")}.`;
        inCode = "parent[i] = i";
        break;
      case "edge-loop":
        says = `Next handshake: ${u} and ${v}. Are they already in the same circle?`;
        inCode = "for (each edge (u, v))";
        break;
      case "find-a":
        says = `Ask ${u}: who is the leader of your circle?`;
        inCode = "a = find(u)";
        break;
      case "find-b":
        says = `Now ask ${v}: who is the leader of your circle?`;
        inCode = "b = find(v)";
        break;
      case "find-loop":
        says = `${x} is not a leader: ${x} answers to ${variable(step, "parent")}. Keep climbing.`;
        inCode = "while (parent[x] != x)";
        break;
      case "compress":
        says = `A shortcut: ${x} will skip a level and answer straight to the boss's boss, so the next question takes fewer steps.`;
        inCode = "parent[x] = parent[parent[x]]";
        break;
      case "climb":
        says = `Climb up to the boss, ${x}.`;
        inCode = "x = parent[x]";
        break;
      case "found-root":
        says = `${x} answers to nobody else, so ${x} is the leader of this circle.`;
        inCode = "return x";
        if (s.current) tones[s.current] = "good";
        break;
      case "check-roots":
        says = ra === rb ? `Both have the same leader, ${ra}: they are already in one circle. Nothing to do.` : `The leaders are different (${ra} and ${rb}), so these two were in different circles.`;
        inCode = "if (a != b)";
        if (ra !== null) tones[gid(ra)] = "warn";
        if (rb !== null) tones[gid(rb)] = "warn";
        break;
      case "union":
        says = `The circles merge: leader ${rb} now answers to leader ${ra}. ${plural(groups, "circle", "circles")} left.`;
        inCode = "parent[b] = a; count--";
        if (ra !== null) tones[gid(ra)] = "good";
        if (rb !== null) tones[gid(rb)] = "good";
        break;
      case "finish":
        says = `Every handshake is processed. There are ${plural(groups, "friend circle", "friend circles")}.`;
        banner = { kind: "good", text: `${plural(groups, "friend circle", "friend circles")}.` };
        break;
    }
    return { tones, actors, says, inCode, banner, badges, board: { label: "Circles", text: `${groups}` } };
  },
};
