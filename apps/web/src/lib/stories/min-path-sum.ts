import { anchorOf, type GridFrame, type GridStory, type Tone } from "./types";
import { indexWith, marks, num, emptyFrame } from "./grid-util";

/** A delivery robot crosses a city of toll roads, moving only right or down; every block remembers the cheapest total to get there. */
export const minPathSumStory: GridStory = {
  id: "min-path-sum",
  kind: "grid",
  title: "The Toll-Road Robot",
  emoji: "🤖",
  hook: "A delivery robot starts at the top-left block of a city and must reach the bottom-right block. It can only move right or down, and every block charges a toll for passing through. Instead of trying every route, the robot works block by block and writes in each one the cheapest total it can possibly have paid to get there. Every block is reached either from above or from the left, so the cheaper of those two is all it needs to remember.",
  cast: [
    { emoji: "🏙️", name: "Block", means: "a cell of the grid, showing its toll (before) or the cheapest total so far (after)" },
    { emoji: "🤖", name: "Robot", means: "the block being worked out right now" },
    { emoji: "⬆️⬅️", name: "Ways in", means: "the block above and the block to the left: the only ways to arrive" },
    { emoji: "🏁", name: "Goal", means: "the bottom-right block: its total is the answer" },
  ],
  moral: "Cheapest way here = this block's toll + the cheaper of 'from above' and 'from the left'. Fill the table in order and each answer needs only two earlier answers, so there is no need to try every route.",
  frame(step, trace): GridFrame {
    const a = anchorOf(step);
    const s = step.state;
    const first = trace.steps[0]!.state;
    if (s.cells.length === 0) return emptyFrame("The city has no blocks, so there is no trip to pay for.", step.index === trace.steps.length - 1, "An empty city: nothing to pay.");
    const m = marks(step);
    const here = indexWith(m, "active") ?? indexWith(m, "found", "total") ?? indexWith(m, "found", "answer");
    const r = num(step, "r");
    const c = num(step, "c");
    const h = r !== undefined && c !== undefined ? r * s.cols + c : here;
    const settledThrough = a === "best" ? (h ?? 0) - 1 : a === "finish" ? s.cells.length - 1 : (h ?? -1);
    const tones: Record<string, Tone> = {};
    const cells: NonNullable<GridFrame["cells"]> = {};
    s.cells.forEach((v, i) => {
      const done = i <= settledThrough;
      tones[String(i)] = done ? "good" : "plain";
      cells[String(i)] = { text: String(done ? v : first.cells[i]), sub: done ? "total" : "toll" };
    });
    if (h !== undefined && a !== "finish") tones[String(h)] = "hit";
    const pick = indexWith(m, "found", undefined);
    const other = indexWith(m, "compared");
    if (a === "best") {
      if (pick !== undefined && pick !== h) tones[String(pick)] = "warn";
      if (other !== undefined) tones[String(other)] = "warn";
    }
    const actors = h !== undefined && a !== "entry" && a !== "finish" ? [{ id: "r", emoji: "🤖", name: "Robot", node: String(h) }] : [];
    if (a === "finish") actors.push({ id: "r", emoji: "🏁", name: "Goal", node: String(s.cells.length - 1) });
    const toll = h !== undefined ? first.cells[h] : undefined;
    const cost = num(step, "cost");
    const best = num(step, "best");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GridFrame["banner"];
    switch (a) {
      case "entry":
        says = `A city of ${s.rows} by ${s.cols} blocks. The robot goes from the top-left to the bottom-right, moving right or down, and pays each block's toll.`;
        break;
      case "start":
        says = `The robot starts at the top-left block and pays its toll of ${toll}. That is the cheapest (and only) way to be here.`;
        inCode = "dp[0][0] = grid[0][0]";
        break;
      case "best":
        if (other !== undefined) {
          const up = s.cells[(h ?? 0) - s.cols];
          const left = s.cells[(h ?? 0) - 1];
          says = `This block can be entered from above (cheapest so far ${up}) or from the left (${left}). The cheaper arrival is ${best}.`;
        } else {
          says = `Only one way into this block: ${(h ?? 0) < s.cols ? "from the left" : "from above"}, where the cheapest total is ${best}.`;
        }
        inCode = "best = min(dp[r-1][c], dp[r][c-1])";
        break;
      case "add":
        says = `Add this block's toll of ${toll} to the cheaper arrival ${best}: the cheapest total to get here is ${cost}.`;
        inCode = "dp[r][c] = grid[r][c] + best";
        break;
      case "finish":
        says = `The robot has reached the goal. The cheapest trip costs ${s.cells[s.cells.length - 1]}.`;
        inCode = "return dp[rows-1][cols-1]";
        banner = { kind: "good", text: `The cheapest trip costs ${s.cells[s.cells.length - 1]}.` };
        break;
    }
    return { tones, actors, says, inCode, banner, cells, board: a === "entry" || a === "finish" ? undefined : { label: "Cheapest so far at this block", text: `${cost ?? best ?? toll}` } };
  },
};
