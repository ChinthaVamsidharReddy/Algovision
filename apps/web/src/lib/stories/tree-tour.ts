import { anchorOf, type ChainFrame, type StoryMeta, type Tone, type TreeStory } from "./types";
import { standingAt, valueAt, visitedIds } from "./tree-util";

export interface TourConfig {
  meta: StoryMeta & { id: string };
  /** What the walker does at a visit, as a verb phrase ("signs the guest book"). */
  visitDoes: (value: number) => string;
  /** The line shown at the visit step, after the value has been recorded. */
  visitSays: (value: number) => string;
  inCodeVisit: string;
  boardLabel: string;
  doneWord: string;
  walker: { emoji: string; name: string };
}

/** The three depth-first tours share one trace shape; only the moment of the visit differs, and the story words. */
export function tourStory(cfg: TourConfig): TreeStory {
  return {
    ...cfg.meta,
    kind: "tree",
    frame(step, trace): ChainFrame {
      const a = anchorOf(step);
      const { node, emptyAhead } = standingAt(step);
      const done = visitedIds(trace, step);
      const tones: Record<string, Tone> = {};
      for (const id of done) tones[id] = "good";
      if (node && !done.includes(node)) tones[node] = "hit";
      const actors = node ? [{ id: "w", emoji: cfg.walker.emoji, name: cfg.walker.name, node }] : [];
      const v = valueAt(step, node);
      const total = trace.steps[0]!.state.nodes.length;
      if (total === 0) {
        const last = step.index === trace.steps.length - 1;
        return {
          tones: {},
          actors: [],
          says: last ? "The building is empty, so the walk is over before it began." : "There are no rooms at all, so the walk has nothing to visit.",
          inCode: a === "entry" ? undefined : "if (node == null) return",
          banner: last ? { kind: "info", text: "Nothing was visited: the building is empty." } : undefined,
          board: { label: cfg.boardLabel, text: "(empty so far)" },
        };
      }
      let says = step.explanation;
      let inCode: string | undefined;
      let banner: ChainFrame["banner"];
      switch (a) {
        case "entry":
          if (step.state.current === null && step.state.callStack.length === 0) {
            says = total === 0 ? "The building is empty: there is nothing to walk through." : `A building with ${total} rooms, each opening onto at most two more rooms, left and right. The ${cfg.walker.name.toLowerCase()} waits outside the main room.`;
          } else {
            says = `Step into the main room (${v}).`;
            inCode = "visit(root)";
          }
          break;
        case "go-left":
          says = emptyAhead ? `The left door of room ${v} opens onto empty ground. Nothing to do there.` : `Go through the left door into room ${v}.`;
          inCode = "visit(node.left)";
          break;
        case "go-right":
          says = emptyAhead ? `The right door of room ${v} opens onto empty ground. Nothing to do there.` : `Go through the right door into room ${v}.`;
          inCode = "visit(node.right)";
          break;
        case "base-case":
          says = `Empty ground, so turn straight back to room ${v}.`;
          inCode = "if (node == null) return";
          break;
        case "visit":
          says = cfg.visitSays(v ?? 0);
          inCode = cfg.inCodeVisit;
          break;
        case "finish":
          if (step.state.callStack.length === 0) {
            says = `The whole building is done. ${cfg.doneWord}: ${step.state.output.join(", ")}.`;
            banner = { kind: "good", text: `${cfg.doneWord}: ${step.state.output.join(", ")}.` };
          } else {
            says = `Both sides of room ${v} are finished, so go back up to the room it was entered from.`;
          }
          break;
      }
      const out = step.state.output;
      return { tones, actors, says, inCode, banner, board: { label: cfg.boardLabel, text: out.length ? out.join(", ") : "(empty so far)" } };
    },
  };
}
