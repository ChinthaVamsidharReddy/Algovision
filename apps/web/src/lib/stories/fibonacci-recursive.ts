import { callStory } from "./recursion-core";

/** Two helpers per question, which is why the same small question is asked again and again. */
export const fibonacciRecursiveStory = callStory({
  id: "fibonacci-recursive",
  title: "Two Helpers, Too Many Questions",
  emoji: "🐇",
  hook: "To count the rabbits in month n you ask two helpers: how many were there last month, and how many the month before? Each helper asks two more helpers of their own. Watch how often the same small question gets asked again by a different helper.",
  cast: [
    { emoji: "📝", name: "Sticky note", means: "one unanswered fib call on the pile" },
    { emoji: "👈", name: "Left helper", means: "the first question, month n minus 1" },
    { emoji: "👉", name: "Right helper", means: "the second question, month n minus 2" },
  ],
  moral: "Recursive Fibonacci asks the same small questions over and over, so it grows exponentially. Remembering the answers (dynamic programming) removes the repeats.",
  argVar: "n",
  label: (n) => `fib(${n})`,
  push: (c) => ({ says: c.first ? `The big question: find fib(${c.a}). Put it on the pile.` : `A new note, fib(${c.a}), goes on top of the pile. This is note number ${c.calls}.`, inCode: `fib(${c.a})` }),
  peek: (c) => {
    if (c.anchor === "base-case") return { says: c.a <= 1 ? `fib(${c.a}) needs no helpers: by definition it is ${c.a}.` : `fib(${c.a}) is fib(${c.a - 1}) plus fib(${c.a - 2}). Two smaller questions are needed, one at a time.`, inCode: "if (n <= 1) return n;" };
    if (c.anchor === "recurse-left") return { says: `Ask the left helper first: fib(${c.a - 1}).`, inCode: `left = fib(${c.a - 1})` };
    return { says: `The left answer is ${c.v("left") ?? 0}. Now ask the right helper: fib(${c.a - 2}).`, inCode: `right = fib(${c.a - 2})` };
  },
  pop: (c) => {
    const left = c.v("left");
    const right = c.v("right");
    const result = c.v("result") ?? 0;
    if (left === undefined || right === undefined) return { says: `fib(${c.a}) is ${result}. Hand that back to the note below and take this note off.`, inCode: "return n;" };
    return { says: `Both helpers answered: ${left} + ${right} = ${result}. fib(${c.a}) is done and comes off the pile.`, inCode: "return left + right;" };
  },
  done: (c, result) => ({ says: `fib(${typeof c.input.n === "number" ? c.input.n : 0}) = ${result}, after ${c.calls} notes were written. Many of them were the same question asked again.` }),
  board: (c) => ({ label: "Notes written so far", text: String(c.calls) }),
});
