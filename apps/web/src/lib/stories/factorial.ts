import { callStory } from "./recursion-core";

/** Passing a question down a line of people, each asking the next one for a smaller version. */
export const factorialStory = callStory({
  id: "factorial",
  title: "Pass It Down the Line",
  emoji: "🙋",
  hook: "You want to know how many ways n friends can line up for a photo. You ask a friend. That friend says: I am one of the n, so ask someone else about the other n minus one, then I will multiply. Each person waits with their note until the smaller question comes back with an answer.",
  cast: [
    { emoji: "📝", name: "Sticky note", means: "one unanswered call, waiting on the pile" },
    { emoji: "🏁", name: "Zero", means: "the easy question that stops the chain: 0! is 1" },
    { emoji: "↩️", name: "Answer going back", means: "a finished call handing its result to the note below" },
  ],
  moral: "Recursion is asking a smaller copy of the same question until it is trivial, then multiplying the answers back up. The pile of waiting notes is the call stack.",
  argVar: "n",
  label: (n) => `${n}!`,
  push: (c) => ({ says: c.first ? `The big question lands first: find ${c.a}!. Stick it on the pile.` : `${c.a}! cannot be answered yet, so a new note for ${c.a}! goes on top. The pile is ${c.depth} deep.`, inCode: `factorial(${c.a})` }),
  peek: (c) => {
    if (c.anchor === "base-case") return { says: c.a === 0 ? "Zero is the easy case: 0! is simply 1. No more questions are needed." : `${c.a}! is ${c.a} times ${c.a - 1}!, and ${c.a - 1}! is not known yet, so we have to ask for it.`, inCode: "if (n == 0) return 1;" };
    return { says: `Write the smaller question, ${c.a - 1}!, on a new note and put it on top.`, inCode: `factorial(${c.a - 1})` };
  },
  pop: (c) => {
    const sub = c.v("sub");
    const result = c.v("result") ?? 0;
    if (sub === undefined) return { says: `The easy note is answered: ${c.a}! = ${result}. Take it off the pile and hand the answer to the note below.`, inCode: "return 1;" };
    return { says: `The answer ${sub} came back. ${c.a} × ${sub} = ${result}. This note is done and comes off the pile.`, inCode: "return n * factorial(n - 1);" };
  },
  done: (c, result) => ({ says: `The last note is answered: ${num(c.input.n)}! = ${result}. The pile is empty again.` }),
});
const num = (x: unknown) => (typeof x === "number" ? x : 0);
