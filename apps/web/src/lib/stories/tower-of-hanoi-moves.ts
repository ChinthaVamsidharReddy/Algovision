import { callStory } from "./recursion-core";

const disk = (k: number) => (k === 1 ? "disk" : "disks");
const move = (k: number) => (k === 1 ? "move" : "moves");

/** Moving a tower of plates by trusting a helper with the smaller tower. */
export const towerOfHanoiMovesStory = callStory({
  id: "tower-of-hanoi-moves",
  title: "The Helper Moves the Small Tower",
  emoji: "🗼",
  hook: "A tower of plates must move to another peg, one plate at a time, never putting a big plate on a small one. The trick: ask a helper to move all the plates above the biggest one out of the way, move the biggest plate yourself, then ask the helper to put the small tower back on top.",
  cast: [
    { emoji: "📝", name: "Sticky note", means: "one tower-moving job waiting on the pile (the number is how many disks)" },
    { emoji: "🧑‍🔧", name: "Helper", means: "the smaller copy of the same job" },
    { emoji: "🔝", name: "Biggest disk", means: "the one disk each job moves by itself" },
  ],
  moral: "Moving n disks is two jobs of n minus 1 disks plus one move: 2^n - 1 moves in total. Trust the helper with the smaller tower and only do the one move yourself.",
  argVar: "n",
  label: (k) => `${k} ${disk(k)}`,
  push: (c) => ({ says: c.first ? `The big job: move a tower of ${c.a} ${disk(c.a)} and count the moves. Put it on the pile.` : `New note: move a tower of ${c.a} ${disk(c.a)}. It goes on top of the pile.`, inCode: `hanoi(${c.a})` }),
  peek: (c) => {
    if (c.anchor === "base-case") return { says: c.a === 0 ? "A tower of zero disks needs no moves at all." : `To move ${c.a} ${disk(c.a)}, the ${c.a - 1} above the biggest one must go out of the way first.`, inCode: "if (n == 0) return 0;" };
    if (c.anchor === "recurse-first") return { says: `Hand the helper the job of moving the ${c.a - 1} smaller ${disk(c.a - 1)} aside.`, inCode: `first = hanoi(${c.a - 1})` };
    return { says: `That took ${c.v("first") ?? 0} ${move(c.v("first") ?? 0)}. Now the biggest disk moves once, and a helper puts the ${c.a - 1} smaller ${disk(c.a - 1)} back on top.`, inCode: `second = hanoi(${c.a - 1})` };
  },
  pop: (c) => {
    const first = c.v("first");
    const second = c.v("second");
    const result = c.v("result") ?? 0;
    if (first === undefined || second === undefined) return { says: `No disks, no moves: the answer is ${result}. Hand it to the note below.`, inCode: "return 0;" };
    return { says: `${first} + 1 + ${second} = ${result} ${move(result)} for ${c.a} ${disk(c.a)}. This note is done.`, inCode: "return first + 1 + second;" };
  },
  done: (c, result) => {
    const k = typeof c.input.n === "number" ? c.input.n : 0;
    return { says: `${k} ${disk(k)} need ${result} ${move(result)}, which is 2^${k} - 1.` };
  },
  board: (c) => ({ label: "Notes written so far", text: String(c.calls) }),
});
