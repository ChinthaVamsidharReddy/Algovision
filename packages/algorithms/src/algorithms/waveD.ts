import type { AlgorithmDefinition } from "../definition";
import { circularQueue } from "./circular-queue";
import { evaluatePostfix } from "./evaluate-postfix";
import { factorial } from "./factorial";
import { fibonacciRecursive } from "./fibonacci-recursive";
import { nextGreaterElement } from "./next-greater-element";
import { powerFastExponentiation } from "./power-fast-exponentiation";
import { slidingWindowMaximum } from "./sliding-window-maximum";
import { sumOfDigitsRecursive } from "./sum-of-digits-recursive";
import { towerOfHanoiMoves } from "./tower-of-hanoi-moves";
import { validParentheses } from "./valid-parentheses";

/** Wave D: Wave D: stacks, queues and recursion.. */
export const waveD: readonly AlgorithmDefinition<never>[] = [
  validParentheses as AlgorithmDefinition<never>,
  nextGreaterElement as AlgorithmDefinition<never>,
  evaluatePostfix as AlgorithmDefinition<never>,
  circularQueue as AlgorithmDefinition<never>,
  slidingWindowMaximum as AlgorithmDefinition<never>,
  factorial as AlgorithmDefinition<never>,
  fibonacciRecursive as AlgorithmDefinition<never>,
  powerFastExponentiation as AlgorithmDefinition<never>,
  sumOfDigitsRecursive as AlgorithmDefinition<never>,
  towerOfHanoiMoves as AlgorithmDefinition<never>,
];
