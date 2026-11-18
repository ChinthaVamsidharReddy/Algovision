import { anchorOf, variable, type Story, type StoryCell, type StoryFrame } from "./types";

/** Tortoise and rabbit in a park of signboards: two signs that point at the same bench are the repeated number. */
export const findDuplicateFloydStory: Story = {
  id: "find-duplicate-floyd",
  title: "The Tortoise and the Rabbit",
  emoji: "🐢",
  hook: "A park has numbered benches. Every bench has a signboard saying which bench to walk to next. Two different signs send you to the same bench, so that bench has two roads leading in. A slow tortoise and a fast rabbit will find it, without writing anything down.",
  cast: [
    { emoji: "🐢", name: "Tortoise", means: "the slow pointer: follows 1 sign at a time" },
    { emoji: "🐇", name: "Rabbit", means: "the fast pointer: follows 2 signs at a time" },
    { emoji: "🪧", name: "Signboard", means: "the value in a cell: the index to go to next" },
    { emoji: "🪑", name: "Bench", means: "an index of the array" },
  ],
  moral: "Walk a loop with a slow and a fast runner and they must meet. Then restart one runner and walk both at the same speed: they meet again exactly where the loop begins, the spot with two roads in.",
  frame(step, trace) {
    const values = step.state.values;
    const n = values.length;
    const a = anchorOf(step);
    const slow = variable(step, "slow");
    const fast = variable(step, "fast");
    const dup = variable(step, "duplicate");
    const ok = (i: number | null): i is number => i !== null && i >= 0 && i < n;
    const together = ok(slow) && slow === fast;

    const cells: StoryCell[] = values.map((v, i) => ({
      main: `→ ${v}`,
      sub: `bench ${i}`,
      tone: a === "finish" && i === dup ? "good" : (ok(slow) && i === slow) || (ok(fast) && i === fast) ? (together ? "good" : "hit") : "plain",
    }));
    const actors: StoryFrame["actors"] = [];
    if (a === "entry") {
      actors.push({ id: "t", emoji: "🐢", name: "Tortoise", at: 0 }, { id: "r", emoji: "🐇", name: "Rabbit", at: 0 });
    } else if (a === "finish" && ok(dup)) {
      // The last step records only the answer: both animals stand on the bench they met at.
      actors.push({ id: "t", emoji: "🐢", name: "Tortoise", at: dup }, { id: "r", emoji: "🐇", name: "Rabbit", at: dup });
    } else {
      if (ok(slow)) actors.push({ id: "t", emoji: "🐢", name: "Tortoise", at: slow });
      if (ok(fast)) actors.push({ id: "r", emoji: "🐇", name: "Rabbit", at: fast });
    }
    const last = step.index === trace.steps.length - 1;
    let says = step.explanation;
    let inCode: string | undefined;
    let banner: StoryFrame["banner"];
    switch (a) {
      case "entry":
        says = `Welcome to the park! There are ${n} benches (0 to ${n - 1}) and each signboard shows the next bench. Both animals wait at the gate, bench 0.`;
        break;
      case "init":
        says = `Ready, steady, go! The Tortoise follows 1 sign, to bench ${slow}. The Rabbit follows 2 signs, to bench ${fast}.`;
        inCode = "slow = nums[0]; fast = nums[nums[0]]";
        break;
      case "phase1-loop":
        if (together) {
          says = `Both animals stand on bench ${slow}. The Rabbit lapped the Tortoise, which can only happen if the signs lead round in a circle.`;
          banner = { kind: "good", text: `They met on bench ${slow}: there is a loop.` };
        } else {
          says = `The Tortoise is on bench ${slow} and the Rabbit on bench ${fast}. Not together yet, so the race goes on.`;
        }
        inCode = "while (slow != fast)";
        break;
      case "phase1-step":
        says = `Tortoise: 1 sign, to bench ${slow}. Rabbit: 2 signs, to bench ${fast}.${together ? " They land on the same bench!" : ""}`;
        inCode = "slow = nums[slow]; fast = nums[nums[fast]]";
        break;
      case "reset":
        says = `The Tortoise walks back to the gate (bench 0). The Rabbit stays on bench ${fast}, but now walks slowly too, 1 sign at a time. The walk from the gate to the loop's start is as long as the walk from here to the loop's start.`;
        inCode = "slow = 0";
        break;
      case "phase2-loop":
        says = `Tortoise on bench ${slow}, Rabbit on bench ${fast}. Different benches, so both take one more step.`;
        inCode = "while (slow != fast)";
        break;
      case "phase2-step":
        says = `Both follow 1 sign: Tortoise to bench ${slow}, Rabbit to bench ${fast}.${together ? " Same bench!" : ""}`;
        inCode = "slow = nums[slow]; fast = nums[fast]";
        break;
      case "finish":
        says = `Both stand on bench ${dup ?? slow}. Two signs lead to this bench, so the number ${dup ?? slow} appears twice: it is the repeated value.`;
        banner = { kind: "good", text: `The repeated number is ${dup ?? slow}.` };
        inCode = "return slow";
        break;
    }
    if (last && !banner && dup !== null) banner = { kind: "good", text: `The repeated number is ${dup}.` };
    return { cells, actors, says, inCode, banner };
  },
};
