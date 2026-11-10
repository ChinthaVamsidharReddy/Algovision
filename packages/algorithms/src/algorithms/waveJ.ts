import type { AlgorithmDefinition } from "../definition";
import { activitySelection, jumpGame, minJumpsToEnd } from "./interview-greedy";
import { countSetBitsKernighan, gcdEuclid, powerOfTwoCheck, primeFactorization, sieveOfEratosthenes, singleNumberXor } from "./interview-math";
import { largestRectangleHistogram, stockSpan } from "./interview-stack";

/** Wave J (milestone 9): monotonic stacks, math, bit tricks and greedy. */
export const waveJ: readonly AlgorithmDefinition<never>[] = [
  stockSpan as AlgorithmDefinition<never>,
  largestRectangleHistogram as AlgorithmDefinition<never>,
  gcdEuclid as AlgorithmDefinition<never>,
  sieveOfEratosthenes as AlgorithmDefinition<never>,
  primeFactorization as AlgorithmDefinition<never>,
  countSetBitsKernighan as AlgorithmDefinition<never>,
  powerOfTwoCheck as AlgorithmDefinition<never>,
  singleNumberXor as AlgorithmDefinition<never>,
  jumpGame as AlgorithmDefinition<never>,
  minJumpsToEnd as AlgorithmDefinition<never>,
  activitySelection as AlgorithmDefinition<never>,
];
