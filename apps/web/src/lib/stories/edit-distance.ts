import { anchorOf, type GridFrame, type GridStory, type Tone } from "./types";
import { emptyFrame, indexWith, marks, num, quote, words } from "./grid-util";

/** Fixing a typo with the fewest key presses: insert a letter, delete a letter, or replace one. */
export const editDistanceStory: GridStory = {
  id: "edit-distance",
  kind: "grid",
  title: "Fixing a Typo",
  emoji: "⌨️",
  hook: "You typed one word and meant another, and you want to fix it with as few key presses as possible. You may only insert a letter, delete a letter or replace a letter. The table answers: 'what is the fewest edits to turn the first i letters of the typed word into the first j letters of the right word?' Each answer is built from three smaller ones.",
  cast: [
    { emoji: "🔤", name: "Letter", means: "one letter of a word, on a row or column header" },
    { emoji: "✏️", name: "Pencil", means: "the cell being filled in right now" },
    { emoji: "➕➖🔁", name: "Insert, delete, replace", means: "the three neighbours, one for each kind of edit" },
    { emoji: "🔢", name: "Edits", means: "the number in a cell: the fewest edits so far" },
  ],
  moral: "If the two letters are the same, no edit is needed and you copy the diagonal. If they differ, take the cheapest of delete, insert and replace, then add one for the edit you just made.",
  frame(step, trace): GridFrame {
    const a = anchorOf(step);
    const s = step.state;
    const { s: A, t: B } = words(step);
    if (s.cells.length === 0) return emptyFrame("There is no table to fill.", step.index === trace.steps.length - 1, "Nothing to compare.");
    const m = marks(step);
    const i = num(step, "i");
    const j = num(step, "j");
    const here = indexWith(m, "active") ?? indexWith(m, "found");
    const tones: Record<string, Tone> = {};
    const cells: NonNullable<GridFrame["cells"]> = {};
    s.cells.forEach((v, idx) => {
      const row = Math.floor(idx / s.cols);
      const col = idx % s.cols;
      tones[String(idx)] = v === null ? "plain" : row === 0 || col === 0 ? "dim" : "good";
    });
    for (const [idx, list] of m) {
      for (const x of list) {
        if (x.role === "active" || x.role === "found") tones[String(idx)] = "hit";
        else if (x.role === "compared") {
          tones[String(idx)] = "warn";
          if (x.label) cells[String(idx)] = { sub: x.label === "diag" ? "diagonal" : x.label };
        }
      }
    }
    const actors = here !== undefined && a !== "finish" ? [{ id: "p", emoji: "✏️", name: "Pencil", node: String(here) }] : [];
    const value = num(step, "value");
    const cell = (label: string) => {
      const idx = indexWith(m, "compared", label);
      return idx === undefined ? "?" : String(s.cells[idx]);
    };
    const letter = (w: string[], n: number | undefined) => (n === undefined ? "?" : (w[n - 1] ?? "?"));
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GridFrame["banner"];
    switch (a) {
      case "entry":
        says = `Turn ${quote(A)} into ${quote(B)} using the fewest inserts, deletes and replacements.`;
        break;
      case "init":
        says = "First row and column: turning a word into nothing takes one delete per letter, and building a word from nothing takes one insert per letter.";
        inCode = "dp[i][0] = i; dp[0][j] = j";
        break;
      case "compare":
        says = `Compare letter "${letter(A, i)}" of the typed word with letter "${letter(B, j)}" of the right word.`;
        inCode = "if (s[i-1] == t[j-1])";
        break;
      case "match":
        says = `The same letter, so no edit is needed here. Copy the diagonal: ${cell("diag")}.`;
        inCode = "dp[i][j] = dp[i-1][j-1]";
        break;
      case "edit":
        says = `Different letters. Delete would cost ${cell("delete")}, insert ${cell("insert")}, replace ${cell("replace")}. Take the cheapest and add 1 for this edit: ${value}.`;
        inCode = "dp[i][j] = 1 + min(delete, insert, replace)";
        break;
      case "finish": {
        const result = num(step, "result");
        says = `The table is full. The bottom-right cell holds the answer: ${result}.`;
        inCode = "return dp[m][n]";
        banner = { kind: "good", text: result === 0 ? `${quote(A)} and ${quote(B)} are already the same: 0 edits.` : `Turning ${quote(A)} into ${quote(B)} takes ${result} ${result === 1 ? "edit" : "edits"}.` };
        break;
      }
    }
    return { tones, actors, says, inCode, banner, cells };
  },
};
