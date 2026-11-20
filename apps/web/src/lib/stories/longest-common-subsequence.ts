import { anchorOf, type GridFrame, type GridStory, type Tone } from "./types";
import { emptyFrame, indexWith, marks, num, quote, words } from "./grid-util";

/** Two friends compare their favourite-song lists: how many songs appear in both, in the same order? */
export const lcsStory: GridStory = {
  id: "longest-common-subsequence",
  kind: "grid",
  title: "Two Playlists",
  emoji: "🎧",
  hook: "Two friends each have a playlist, written as a row of letters, one letter per song. They want the longest run of songs that both playlists contain in the same order, though not necessarily side by side. They fill a table: each cell answers 'how many songs can the first i songs of one playlist and the first j songs of the other share?' Every cell is built from the three neighbours that came before it.",
  cast: [
    { emoji: "🎵", name: "Song", means: "one letter of a word, written on a row or column header" },
    { emoji: "✏️", name: "Pencil", means: "the cell being filled in right now" },
    { emoji: "↖️⬆️⬅️", name: "Neighbours", means: "the diagonal, the cell above and the cell to the left that feed the new cell" },
    { emoji: "🔢", name: "Shared songs", means: "the number in a cell: the best shared run so far" },
  ],
  moral: "If the two songs match, extend the diagonal by one. If they do not, the best you can do is the better of dropping one song from either list: take the larger of the cell above and the cell to the left.",
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
        if (x.role === "active") tones[String(idx)] = "hit";
        else if (x.role === "found") tones[String(idx)] = "hit";
        else if (x.role === "compared") {
          tones[String(idx)] = "warn";
          if (x.label) cells[String(idx)] = { sub: x.label === "diag" ? "diagonal" : x.label };
        }
      }
    }
    const actors = here !== undefined && a !== "finish" ? [{ id: "p", emoji: "✏️", name: "Pencil", node: String(here) }] : [];
    const value = num(step, "value");
    const diagIdx = indexWith(m, "compared", "diag");
    const upIdx = indexWith(m, "compared", "up");
    const leftIdx = indexWith(m, "compared", "left");
    const letter = (w: string[], n: number | undefined) => (n === undefined ? "?" : (w[n - 1] ?? "?"));
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GridFrame["banner"];
    switch (a) {
      case "entry":
        says = `Two playlists, ${quote(A)} and ${quote(B)}. The table has a row for each song of the first and a column for each song of the second, plus an empty start.`;
        break;
      case "init":
        says = "First row and first column: when one playlist has no songs yet, the two share nothing, so 0.";
        inCode = "dp[i][0] = dp[0][j] = 0";
        break;
      case "compare":
        says = `Compare song "${letter(A, i)}" of the first playlist with song "${letter(B, j)}" of the second.`;
        inCode = "if (s[i-1] == t[j-1])";
        break;
      case "match":
        says = `They match! The diagonal cell says ${diagIdx !== undefined ? s.cells[diagIdx] : "?"} shared so far, and this song makes one more: ${value}.`;
        inCode = "dp[i][j] = dp[i-1][j-1] + 1";
        break;
      case "skip":
        says = `Different songs. Take the better of the cell above (${upIdx !== undefined ? s.cells[upIdx] : "?"}) and the cell to the left (${leftIdx !== undefined ? s.cells[leftIdx] : "?"}): ${value}.`;
        inCode = "dp[i][j] = max(dp[i-1][j], dp[i][j-1])";
        break;
      case "finish": {
        const result = num(step, "result");
        says = `The table is full. The bottom-right cell holds the answer: ${result}.`;
        inCode = "return dp[m][n]";
        banner = { kind: "good", text: `The playlists share ${result} ${result === 1 ? "song" : "songs"} in the same order.` };
        break;
      }
    }
    return { tones, actors, says, inCode, banner, cells };
  },
};
