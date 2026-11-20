import { anchorOf, type GridFrame, type GridStory, type GridTrace, type StoryMeta, type Tone } from "./types";
import { emptyFrame, has, indexWith, indexesWith, marks, num, where } from "./grid-util";
import type { ExecutionStep } from "@algovision/trace-schema";

type Step = ExecutionStep<"grid">;

/** The two island stories read the same trace shape (scan, walk, look around) and differ only in what they count. */
export function islandStory(meta: StoryMeta & { id: string }, mode: "count" | "area"): GridStory {
  return {
    ...meta,
    kind: "grid",
    frame(step: Step, trace: GridTrace): GridFrame {
      const a = anchorOf(step);
      const s = step.state;
      const last = step.index === trace.steps.length - 1;
      if (s.cells.length === 0) return emptyFrame("The map is empty: there is no land to find.", last, mode === "count" ? "0 islands." : "The biggest island has 0 cells.");
      const m = marks(step);
      const walked = indexesWith(m, "visited");
      const here = indexWith(m, "active");
      const tones: Record<string, Tone> = {};
      const cells: NonNullable<GridFrame["cells"]> = {};
      s.cells.forEach((v, i) => {
        tones[String(i)] = v === 0 ? "dim" : "plain";
        cells[String(i)] = { text: v === 0 ? "🌊" : "🌴" };
      });
      for (const i of walked) tones[String(i)] = "good";
      for (const [i, list] of m) {
        for (const x of list) {
          if (x.role === "found" && (x.label === "scan" || x.label === "start")) tones[String(i)] = "hit";
          if (x.role === "active") tones[String(i)] = "hit";
          if (x.role === "found" && x.label === undefined) tones[String(i)] = a === "check" || a === "spread" ? "warn" : "good";
        }
      }
      const spot = here ?? indexWith(m, "found", "scan") ?? indexWith(m, "found", "start") ?? indexWith(m, "compared", "scan");
      const actors = spot !== undefined && a !== "finish" && a !== "init" && a !== "entry" && a !== "record" ? [{ id: "w", emoji: "🚶", name: "Explorer", node: String(spot) }] : [];
      const size = num(step, "size");
      const islands = num(step, "islands");
      const best = num(step, "best");
      const neighbour = indexWith(m, "compared") ?? indexWith(m, "found");
      let says = step.explanation;
      let inCode: string | undefined;
      let banner: GridFrame["banner"];
      switch (a) {
        case "entry":
          says = `A map of ${s.rows} by ${s.cols} squares: ${"🌴"} is land and ${"🌊"} is sea. Squares that touch up, down, left or right belong to the same island.`;
          break;
        case "init":
          says = mode === "count" ? "No island has been counted yet." : "No island has been measured yet, so the biggest so far is 0.";
          inCode = mode === "count" ? "islands = 0" : "best = 0";
          break;
        case "scan":
          says = has(m, spot ?? -1, "found") ? `Scanning the map. ${where(step, spot)} is land we have not walked on yet.` : `Scanning the map. ${where(step, spot)} is sea or land we have already walked: skip it.`;
          inCode = "for each cell (r, c)";
          break;
        case "new-island":
          says = `A new island! That makes ${islands}. Walk over all of it now, so none of it is counted again.`;
          inCode = "islands++; dfs(r, c)";
          break;
        case "visit":
          says = mode === "area" ? `Step onto ${where(step, here)}. This island measures ${size} ${size === 1 ? "square" : "squares"} so far.` : `Step onto ${where(step, here)} and mark it as walked.`;
          inCode = mode === "area" ? "size++; grid[r][c] = visited" : "grid[r][c] = visited";
          break;
        case "check":
          says = neighbour === undefined ? "Look at the next side. It is the edge of the map: nothing is there." : has(m, neighbour, "found") ? "Unwalked land right next door: this is where we will go next." : "That neighbour is sea or already walked on, so there is nothing to explore.";
          inCode = "for each of the 4 neighbours";
          break;
        case "spread":
          says = mode === "area" ? `Walk on into the neighbouring land. The island has ${size} squares so far.` : "Walk on into the neighbouring land.";
          inCode = "dfs(neighbour)";
          break;
        case "record":
          says = `The whole island is walked: ${size} ${size === 1 ? "square" : "squares"}. The biggest island so far is ${best}.`;
          inCode = "best = max(best, size)";
          break;
        case "finish":
          if (mode === "count") {
            const result = num(step, "result");
            says = `Every square has been scanned. ${result} ${result === 1 ? "island" : "islands"} in all.`;
            banner = { kind: "good", text: `${result} ${result === 1 ? "island" : "islands"} counted.` };
          } else {
            says = `Every square has been scanned. The biggest island has ${best} ${best === 1 ? "square" : "squares"}.`;
            banner = { kind: "good", text: `The biggest island has ${best} ${best === 1 ? "square" : "squares"}.` };
          }
          inCode = "return result";
          break;
      }
      const board = mode === "count" ? { label: "Islands counted", text: String(islands ?? 0) } : { label: "Biggest island so far", text: String(best ?? 0) };
      return { tones, actors, says, inCode, banner, cells, board };
    },
  };
}
