import { callStory } from "./recursion-core";

const n = (x: unknown) => (typeof x === "number" ? x : 0);

/** Cut the job in half each time, then square the answer. */
export const powerFastExponentiationStory = callStory({
  id: "power-fast-exponentiation",
  title: "Halve the Job",
  emoji: "✂️",
  hook: "You must multiply a number by itself many times. Doing it one multiplication at a time is slow. Instead, ask a helper for half as many, then square their answer. The helper does the same, so the job halves again and again until it is trivial.",
  cast: [
    { emoji: "📝", name: "Sticky note", means: "one power question waiting on the pile (the number on it is the exponent)" },
    { emoji: "✂️", name: "Half", means: "the exponent cut in half for the helper" },
    { emoji: "✖️", name: "Square", means: "multiplying the helper's answer by itself" },
  ],
  moral: "Fast exponentiation halves the exponent each time, so it needs about log n steps instead of n. Square the half answer, and multiply once more by the base when the exponent is odd.",
  argVar: "exp",
  label: (e, input) => `${n(input.base)}^${e}`,
  push: (c) => ({ says: c.first ? `The big question: find ${n(c.input.base)}^${c.a}. Put it on the pile.` : `New note: ${n(c.input.base)}^${c.a}. It goes on top of the pile.`, inCode: `power(${n(c.input.base)}, ${c.a})` }),
  peek: (c) => {
    if (c.anchor === "base-case") return { says: c.a === 0 ? "Any number to the power 0 is 1, so this question needs no helper." : `${n(c.input.base)}^${c.a} is too big to do in one go. Cut the exponent in half to ${Math.floor(c.a / 2)}, answer that, then square it.`, inCode: "if (exp == 0) return 1;" };
    return { says: `Write the half-size question, ${n(c.input.base)}^${Math.floor(c.a / 2)}, on a new note.`, inCode: `half = power(base, ${Math.floor(c.a / 2)})` };
  },
  pop: (c) => {
    const half = c.v("half");
    const result = c.v("result") ?? 0;
    const base = n(c.input.base);
    if (half === undefined) return { says: `The easy note is answered: ${base}^0 = ${result}. Hand it to the note below.`, inCode: "return 1;" };
    if (c.anchor === "combine-even") return { says: `The half answer is ${half}. The exponent is even, so just square it: ${half} × ${half} = ${result}.`, inCode: "return half * half;" };
    return { says: `The half answer is ${half}. The exponent is odd, so square it and multiply by one more ${base}: ${half} × ${half} × ${base} = ${result}.`, inCode: "return half * half * base;" };
  },
  done: (c, result) => ({ says: `${n(c.input.base)}^${n(c.input.exp)} = ${result}. Halving the exponent each time kept the pile short.` }),
});
