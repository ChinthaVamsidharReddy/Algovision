import { callStory } from "./recursion-core";

const n = (x: unknown) => (typeof x === "number" ? x : 0);

/** Peel off the last digit and ask a helper about the rest. */
export const sumOfDigitsRecursiveStory = callStory({
  id: "sum-of-digits-recursive",
  title: "Peel Off a Digit",
  emoji: "🧅",
  hook: "You want the sum of the digits of a big number. Peel off the last digit like the outer skin of an onion, keep it, and hand the rest to a helper to add up. The helper peels off their own last digit, and so on until one digit is left.",
  cast: [
    { emoji: "📝", name: "Sticky note", means: "one unanswered call, with the number still to be added" },
    { emoji: "🧅", name: "Last digit", means: "the digit peeled off and kept by the waiting note" },
    { emoji: "1️⃣", name: "Single digit", means: "the easy case that stops the chain" },
  ],
  moral: "Split the number into its last digit and the rest. The rest is a smaller copy of the same problem, so each waiting note adds its own digit to the answer that comes back.",
  argVar: "n",
  label: (x) => String(x),
  push: (c) => ({ says: c.first ? `The big question: add up the digits of ${c.a}. Put it on the pile.` : `New note: the digits of ${c.a}. It goes on top of the pile.`, inCode: `sumDigits(${c.a})` }),
  peek: (c) => {
    if (c.anchor === "base-case") return { says: c.a < 10 ? `${c.a} is a single digit, so its sum is itself.` : `${c.a} has more than one digit. Peel off the last digit (${c.a % 10}) and ask a helper about the rest, ${Math.floor(c.a / 10)}.`, inCode: "if (n < 10) return n;" };
    return { says: `Write the question for ${Math.floor(c.a / 10)} on a new note and put it on top.`, inCode: `sumDigits(${Math.floor(c.a / 10)})` };
  },
  pop: (c) => {
    const rest = c.v("rest");
    const result = c.v("result") ?? 0;
    if (rest === undefined) return { says: `The single digit ${c.a} is answered: ${result}. Hand it to the note below.`, inCode: "return n;" };
    return { says: `The rest added up to ${rest}. Add the digit we peeled off: ${c.a % 10} + ${rest} = ${result}.`, inCode: "return n % 10 + sumDigits(n / 10);" };
  },
  done: (c, result) => ({ says: `The digits of ${n(c.input.n)} add up to ${result}.` }),
});
