import { anchorOf, type GridFrame, type GridStory, type GridTrace, type Tone } from "./types";
import { emptyFrame, indexWith, marks } from "./grid-util";
import type { ExecutionStep } from "@algovision/trace-schema";

type Step = ExecutionStep<"grid">;

/** The cells a step newly collects, in the order the algorithm lists them (right to left along the bottom, for instance). */
const foundInOrder = (step: Step): number[] => step.highlights.flatMap((h) => (h.role === "found" && h.target.kind === "index" ? [h.target.index] : []));

/** Cells the walker has collected so far, in the order they were collected (read from what each step newly marks as found). */
function collected(trace: GridTrace, step: Step): number[] {
  const out: number[] = [];
  for (const s of trace.steps) {
    if (s.index > step.index) break;
    if (s.source.kind === "anchor" && s.source.id === "finish") break;
    for (const i of foundInOrder(s)) if (!out.includes(i)) out.push(i);
  }
  return out;
}

/** A snail walks the border of a table, then the next border inside, in a spiral. */
export const spiralOrderStory: GridStory = {
  id: "spiral-order",
  kind: "grid",
  title: "The Snail's Spiral",
  emoji: "🐌",
  hook: "A snail wants to eat every leaf in a patch of lettuce laid out in rows. It does not zig-zag. It goes along the whole top edge, then down the right edge, then back along the bottom, then up the left, and then does the same again on the smaller patch left inside. Four walls (top, bottom, left, right) close in after every lap.",
  cast: [
    { emoji: "🥬", name: "Leaf", means: "a cell of the grid" },
    { emoji: "🐌", name: "Snail", means: "the leaf it has just eaten" },
    { emoji: "✅", name: "Eaten", means: "a cell already collected" },
    { emoji: "🧱", name: "Walls", means: "top, bottom, left, right: the edges of the patch still to do" },
  ],
  moral: "Keep four boundaries and shrink them after each side: after the top row, top moves down; after the right column, right moves left; and so on. Stop as soon as the boundaries cross.",
  frame(step, trace): GridFrame {
    const a = anchorOf(step);
    const s = step.state;
    const last = step.index === trace.steps.length - 1;
    if (s.cells.length === 0) return emptyFrame("The patch is empty: there is nothing to eat.", last, "Nothing was collected.");
    const m = marks(step);
    const order = collected(trace, step);
    const tones: Record<string, Tone> = {};
    s.cells.forEach((_, i) => (tones[String(i)] = "plain"));
    for (const i of order) tones[String(i)] = "good";
    const fresh = foundInOrder(step);
    for (const i of fresh) if (a !== "finish") tones[String(i)] = "hit";
    const snailAt = order.length ? order[order.length - 1]! : indexWith(m, "found");
    const actors = snailAt !== undefined && a !== "entry" && a !== "init" && a !== "layer" ? [{ id: "n", emoji: "🐌", name: "Snail", node: String(snailAt) }] : [];
    const cells: NonNullable<GridFrame["cells"]> = {};
    order.forEach((i, n) => (cells[String(i)] = { sub: `#${n + 1}` }));
    const values = order.map((i) => s.cells[i]);
    const newOnes = fresh.map((i) => s.cells[i]);
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GridFrame["banner"];
    switch (a) {
      case "entry":
        says = `A patch of ${s.rows} by ${s.cols} leaves. The snail will spiral inwards, eating every leaf once.`;
        break;
      case "init":
        says = "Four walls mark the patch still to do: top, bottom, left and right. At first they are the outer edges.";
        inCode = "top = 0; bottom = rows-1; left = 0; right = cols-1";
        break;
      case "layer":
        says = "Start a new lap around whatever is still inside the walls.";
        inCode = "while (top <= bottom && left <= right)";
        break;
      case "top":
        says = `Along the top row, left to right: ${newOnes.join(", ")}. Then the top wall moves down one.`;
        inCode = "for (c = left..right) take grid[top][c]; top++";
        break;
      case "right":
        says = `Down the right column, top to bottom: ${newOnes.join(", ")}. Then the right wall moves in one.`;
        inCode = "for (r = top..bottom) take grid[r][right]; right--";
        break;
      case "bottom":
        says = `Back along the bottom row, right to left: ${newOnes.join(", ")}. Then the bottom wall moves up one.`;
        inCode = "for (c = right..left) take grid[bottom][c]; bottom--";
        break;
      case "left":
        says = `Up the left column, bottom to top: ${newOnes.join(", ")}. Then the left wall moves in one.`;
        inCode = "for (r = bottom..top) take grid[r][left]; left++";
        break;
      case "finish":
        says = `The walls have crossed, so every leaf is eaten: ${values.join(", ")}.`;
        banner = { kind: "good", text: `Spiral order: ${values.join(", ")}.` };
        inCode = "return result";
        break;
    }
    return { tones, actors, says, inCode, banner, cells, board: { label: "Eaten, in order", text: values.length ? values.join(", ") : "nothing yet" } };
  },
};
