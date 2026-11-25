import { anchorOf, variable, type ChainActor, type ChainFrame, type ChainStory, type Tone } from "./types";
import { present } from "./chain-util";
import { chainIds } from "./types";

/** A coat rack with limited hooks: the coat used most recently hangs nearest the door, and when the rack is full the coat at the far end goes. */
export const lruCacheStory: ChainStory = {
  id: "lru-cache",
  kind: "linkedList",
  title: "The Coat Rack with Few Hooks",
  emoji: "🧥",
  hook: "A cloakroom rack has only a few hooks. Every coat has a ticket number (its key) and the rack keeps them in order from the one used most recently, nearest the door, to the one used least recently, at the far end. Asking for a coat hands it over and moves it to the door end. Hanging a new coat on a full rack first removes the coat at the far end.",
  cast: [
    { emoji: "🧥", name: "Coat", means: "a node: the number shown is its value, the ticket is its key" },
    { emoji: "🚪", name: "Door end", means: "the head: most recently used" },
    { emoji: "🗑️", name: "Far end", means: "the tail: least recently used, the next to be evicted" },
    { emoji: "📇", name: "Ticket index", means: "the hash table that finds a key at once" },
  ],
  moral: "An LRU cache pairs a hash table (find a key in O(1)) with a linked list (move to the front and drop the tail in O(1)), so every get and put takes constant time.",
  frame(step, trace): ChainFrame {
    const a = anchorOf(step);
    const first = trace.steps[0]!;
    const keyOf = (s: typeof step): Map<string, number> => {
      const m = new Map<string, number>();
      for (const h of s.highlights) if (h.target.kind === "node" && h.label?.startsWith("k=")) m.set(h.target.id, Number(h.label.slice(2)));
      return m;
    };
    const keys = keyOf(step);
    const key = variable(step, "key");
    const value = variable(step, "value");
    const total = variable(step, "total") ?? 0;
    const evicted = variable(step, "evicted");
    const m = /Run (\d+) operations .* at most (\d+) entr/.exec(first.explanation);
    const ops = m ? Number(m[1]) : 0;
    const capacity = m ? Number(m[2]) : 0;
    const putOrGet = /Operation \d+ of \d+: (put|get)/.exec(step.explanation)?.[1];
    const opNumber = variable(step, "op");
    const tones: Record<string, Tone> = {};
    const actors: ChainActor[] = [];
    for (const h of step.highlights) {
      if (h.target.kind !== "node") continue;
      const t: Tone | undefined = h.role === "found" ? "good" : h.role === "created" ? "warn" : h.role === "compared" ? "hit" : undefined;
      if (t) {
        tones[h.target.id] = t;
        if (actors.length === 0) actors.push({ id: "c", emoji: "🧥", name: "Coat", node: h.target.id });
      }
    }
    const order = chainIds(step.state).map((id) => keys.get(id)).filter((k): k is number => k !== undefined);
    const present_ = keys.size > 0 || step.state.nodes.length > 0;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: ChainFrame["banner"];
    const found = step.highlights.some((h) => h.role === "compared");
    switch (a) {
      case "entry":
        says = `A cloakroom rack with ${capacity} hooks and ${ops} ${ops === 1 ? "request" : "requests"} to deal with. We add up everything that get hands back (a miss counts as -1).`;
        break;
      case "init":
        says = "The rack is empty and the ticket index has no entries.";
        inCode = "map = {}; list = empty";
        break;
      case "lookup":
        says = `Request ${opNumber}: ${putOrGet === "put" ? `hang coat ${key} with value ${variable(step, "value") ?? ""}`.replace(/ with value $/, "") : `give back coat ${key}`}. Look up ticket ${key} in the index: ${found ? "it is on the rack." : "it is not on the rack."}`;
        inCode = "node = map.get(key)";
        break;
      case "hit":
        says = `Ticket ${key} is on the rack with value ${value}. Hand it over. The returned values add up to ${total}.`;
        inCode = "return node.value";
        break;
      case "miss":
        says = `Ticket ${key} is not on the rack, so the answer is -1. The returned values add up to ${total}.`;
        inCode = "return -1";
        break;
      case "update":
        says = `Ticket ${key} is already on the rack, so just replace its value with ${value}.`;
        inCode = "node.value = value";
        break;
      case "evict":
        says = `The rack is full, so the coat at the far end (ticket ${evicted}) is taken off to make room.`;
        inCode = "remove tail; map.remove(tail.key)";
        break;
      case "insert":
        says = `Hang a new coat: ticket ${key}, value ${value}. It is on a hook but not yet in the rack's order.`;
        inCode = "node = new Node(key, value); map.put(key, node)";
        break;
      case "front":
        says = `Move ticket ${key} to the door end: it is now the most recently used. Order from the door: ${order.join(", ")}.`;
        inCode = "moveToFront(node)";
        break;
      case "finish":
        says = `All requests are done. The values handed back add up to ${total}.`;
        banner = { kind: "good", text: `The values returned by get add up to ${total}.` };
        break;
    }
    void present_;
    return { tones: present(step, tones), actors, says, inCode, banner, board: { label: "Rack from the door", text: order.length ? order.map((k) => `ticket ${k}`).join(" → ") : "empty" } };
  },
};
