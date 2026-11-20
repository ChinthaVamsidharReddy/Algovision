import { anchorOf, type GridFrame, type GridStory, type Tone } from "./types";
import { emptyFrame, has, indexWith, indexesWith, marks, num } from "./grid-util";

/** A tray of oranges where rot spreads to every touching fresh orange each minute. */
export const rottingOrangesStory: GridStory = {
  id: "rotting-oranges",
  kind: "grid",
  title: "One Bad Orange",
  emoji: "🍊",
  hook: "A tray of oranges: some fresh, some already rotten, some squares empty. Every minute, each rotten orange spoils every fresh orange touching it, up, down, left or right. How many minutes until everything fresh has rotted, or can some oranges never be reached? A waiting line of rotten oranges is handled minute by minute, so the spread goes outwards in rings.",
  cast: [
    { emoji: "🍊", name: "Fresh orange", means: "a cell with value 1" },
    { emoji: "🤢", name: "Rotten orange", means: "a cell with value 2" },
    { emoji: "⬜", name: "Empty square", means: "a cell with value 0: rot cannot cross it" },
    { emoji: "🦠", name: "Spreader", means: "the rotten orange whose neighbours are being checked" },
  ],
  moral: "Spread from all the rotten oranges at once, one ring per minute, with a queue. The number of rings is the number of minutes. Fresh oranges left over at the end are walled off by empty squares and can never rot.",
  frame(step, trace): GridFrame {
    const a = anchorOf(step);
    const s = step.state;
    const last = step.index === trace.steps.length - 1;
    if (s.cells.length === 0) return emptyFrame("The tray is empty: there is nothing to rot.", last, "An empty tray: 0 minutes.");
    const m = marks(step);
    const tones: Record<string, Tone> = {};
    const cells: NonNullable<GridFrame["cells"]> = {};
    s.cells.forEach((v, i) => {
      tones[String(i)] = v === 2 ? "warn" : v === 0 ? "dim" : "plain";
      cells[String(i)] = { text: v === 0 ? "·" : v === 1 ? "🍊" : "🤢" };
    });
    for (const [i, list] of m) for (const x of list) {
      if (x.role === "active") tones[String(i)] = "hit";
      if (x.role === "created") tones[String(i)] = "good";
      if (x.role === "found") tones[String(i)] = "hit";
    }
    const source = indexWith(m, "active") ?? indexesWith(m, "swapped")[0];
    const actors = source !== undefined && a !== "finish" ? [{ id: "s", emoji: "🦠", name: "Spreader", node: String(source) }] : [];
    const fresh = num(step, "fresh");
    const minutes = num(step, "minutes");
    const queued = num(step, "queued");
    const neighbour = indexWith(m, "compared") ?? indexWith(m, "found");
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: GridFrame["banner"];
    switch (a) {
      case "entry":
        says = `A tray of ${s.rows} by ${s.cols} squares. Rot spreads to touching fresh oranges every minute.`;
        break;
      case "init":
        says = `${fresh} fresh ${fresh === 1 ? "orange" : "oranges"} and ${queued} rotten ${queued === 1 ? "one" : "ones"} to start. The rotten ones join the waiting line.`;
        inCode = "queue = all rotten; fresh = count of fresh";
        break;
      case "round":
        says = `Minute ${minutes} begins. Every orange that was rotten when the minute started spoils its neighbours.`;
        inCode = "minutes++ ; process the whole current queue";
        break;
      case "check":
        says = neighbour === undefined ? "Look at the next side. It is the edge of the tray." : has(m, neighbour, "found") ? "A fresh orange is touching the rotten one." : "That square is empty or already rotten: nothing to spoil.";
        inCode = "for each of the 4 neighbours";
        break;
      case "rot":
        says = `The fresh orange turns rotten. ${fresh} fresh ${fresh === 1 ? "orange is" : "oranges are"} left.`;
        inCode = "grid[nr][nc] = 2; fresh--; queue.add(...)";
        break;
      case "finish": {
        const result = num(step, "result");
        if (result === -1) {
          says = `The rot has nowhere left to spread, yet ${fresh} fresh ${fresh === 1 ? "orange is" : "oranges are"} still fine. Empty squares wall them off.`;
          banner = { kind: "bad", text: "Some oranges can never rot: nothing rotten can reach them." };
        } else {
          says = result === 0 ? "There was nothing fresh to spoil, so it takes 0 minutes." : `Nothing fresh is left. The last orange rotted after ${result} ${result === 1 ? "minute" : "minutes"}.`;
          banner = { kind: "good", text: result === 0 ? "No fresh oranges to rot: 0 minutes." : `Every orange is rotten after ${result} ${result === 1 ? "minute" : "minutes"}.` };
        }
        inCode = "return fresh == 0 ? minutes : -1";
        break;
      }
    }
    return { tones, actors, says, inCode, banner, cells, board: { label: "Minute", text: `${minutes ?? 0}   ·   Fresh oranges left: ${fresh ?? 0}` } };
  },
};
