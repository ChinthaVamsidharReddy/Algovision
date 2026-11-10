import type { ExecutionTrace } from "@algovision/trace-schema";
import type { AlgorithmDefinition } from "../definition";
import type { InputResult } from "../input";
import type { LimitProfile } from "../limits";
import { ArrayTrace, cell, fmt, indexRef, parseChecked } from "./array-trace";
import { parseInts } from "./int-input";

const asInput = <T>(r: InputResult<Record<string, unknown>>) => r as InputResult<T>;
const bits = (n: number): number[] => Array.from({ length: 10 }, (_, k) => (n >> (9 - k)) & 1);
const bitName = (k: number) => 9 - k;

// ---------------------------------------------------------------- gcd (Euclid)
export const GCD_ID = "gcd-euclid";
interface Pair { readonly a: number; readonly b: number }
export function parseGcd(raw: unknown, limits: LimitProfile): InputResult<Pair> {
  return asInput<Pair>(parseInts(raw, limits, [{ name: "a", label: "The first number", min: 1, max: 999 }, { name: "b", label: "The second number", min: 1, max: 999 }]));
}
export function runGcd({ a: a0, b: b0 }: Pair, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(GCD_ID, { a: a0, b: b0 }, [a0, b0], limits);
  let a = a0, b = b0;
  const show = (role: "active" | "found" | "compared") => [cell(0, role, "a"), cell(1, role, "b")];
  T.step({ type: "init" }, "entry", `Find the greatest common divisor of ${a} and ${b}. Euclid: gcd(a, b) = gcd(b, a mod b), because any divisor of both a and b also divides the remainder.`, { a, b }, {}, show("active"));
  while (b !== 0) {
    T.step({ type: "init" }, "loop", `b is ${b}, not 0, so keep reducing.`, { a, b }, {}, show("active"));
    const r = a % b;
    T.step({ type: "init" }, "remainder", `${a} mod ${b} = ${r}.`, { a, b, r }, {}, [cell(0, "compared", "a"), cell(1, "compared", "b")]);
    a = b; b = r;
    T.values[0] = a; T.values[1] = b;
    T.step({ type: "assign", target: indexRef(0), value: a }, "shift", `Shift: a = ${a}, b = ${b}. The pair (${a}, ${b}) has the same common divisors as before.`, { a, b }, {}, show("active"), [0, 1]);
  }
  T.step({ type: "done" }, "finish", `b is 0, so the greatest common divisor is a = ${a}.`, { a, b }, {}, [cell(0, "found", "gcd")]);
  return T.finish(a, "O(log min(a, b))", "O(1)");
}
export const gcdEuclid: AlgorithmDefinition<Pair> = { id: GCD_ID, parseInput: parseGcd, run: runGcd };

// ---------------------------------------------------------------- sieve of Eratosthenes
export const SIEVE_ID = "sieve-of-eratosthenes";
interface N { readonly n: number }
export function parseSieve(raw: unknown, limits: LimitProfile): InputResult<N> {
  return asInput<N>(parseInts(raw, limits, [{ name: "n", label: "The upper limit n", min: 2, max: (l) => l.maxArrayLength - 1 }]));
}
export function runSieve({ n }: N, limits: LimitProfile): ExecutionTrace {
  const flags: number[] = Array.from({ length: n + 1 }, (_, i) => (i < 2 ? 0 : 1));
  const T = new ArrayTrace(SIEVE_ID, { n }, flags, limits);
  const roles = () => flags.map((f, i) => cell(i, f === 1 ? "pointer" : "visited"));
  T.step({ type: "init" }, "entry", `Count the primes up to ${n}. The array has a 1 at index i while i might still be prime. Start by assuming every number from 2 is prime, then cross out multiples.`, { n });
  T.step({ type: "init" }, "init", "0 and 1 are not prime. Every other index starts as 1 (maybe prime).", { n }, {}, roles(), [0, 1]);
  for (let p = 2; p * p <= n; p++) {
    T.step({ type: "movePointer", pointer: "p", to: indexRef(p) }, "loop", `Try p = ${p}. Only p up to the square root of ${n} matters, because every composite has a factor that small.`, { n, p }, { p }, [...roles(), cell(p, "active", "p")]);
    T.step({ type: "init" }, "check-prime", flags[p] === 1 ? `${p} is still marked 1, so it is prime. Cross out its multiples, starting at ${p} × ${p} = ${p * p}.` : `${p} was already crossed out, so it is not prime and its multiples are already handled.`, { n, p }, { p }, [...roles(), cell(p, flags[p] === 1 ? "found" : "compared", "p")]);
    if (flags[p] === 1) {
      for (let m = p * p; m <= n; m += p) {
        flags[m] = 0;
        T.values[m] = 0;
        T.step({ type: "assign", target: indexRef(m), value: 0 }, "mark", `${m} is a multiple of ${p}, so cross it out.`, { n, p, m }, { p, m }, [...roles(), cell(p, "found", "p"), cell(m, "swapped", "x")], [m]);
      }
    }
  }
  const count = flags.reduce((s, f) => s + f, 0);
  T.step({ type: "done" }, "finish", `The indexes still marked 1 are the primes: ${flags.map((f, i) => (f ? i : -1)).filter((x) => x >= 0).join(", ")}. There are ${count}.`, { n, primes: count }, {}, flags.map((f, i) => cell(i, f === 1 ? "found" : "visited")));
  return T.finish(count, "O(n log log n)", "O(n)");
}
export const sieveOfEratosthenes: AlgorithmDefinition<N> = { id: SIEVE_ID, parseInput: parseSieve, run: runSieve };

// ---------------------------------------------------------------- prime factorization
export const FACTOR_ID = "prime-factorization";
export function parseFactor(raw: unknown, limits: LimitProfile): InputResult<N> {
  return asInput<N>(parseInts(raw, limits, [{ name: "n", label: "The number", min: 2, max: 999 }]));
}
export function runFactor({ n: n0 }: N, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(FACTOR_ID, { n: n0 }, [], limits);
  let n = n0;
  let d = 2;
  T.step({ type: "init" }, "entry", `Split ${n} into prime factors. The array collects the factors found so far. Divide out the smallest possible divisor each time.`, { n });
  T.step({ type: "init" }, "init", "Start trying divisors at d = 2.", { n, d });
  while (d * d <= n) {
    T.step({ type: "init" }, "loop", `${d} × ${d} = ${d * d} is not more than ${n}, so a divisor of ${n} could still be ${d} or larger.`, { n, d });
    if (n % d === 0) {
      T.step({ type: "init" }, "check", `${n} is divisible by ${d}.`, { n, d });
      T.values.push(d);
      n /= d;
      T.step({ type: "assign", target: indexRef(T.values.length - 1), value: d }, "divide", `Record ${d} and divide: n becomes ${n}. Keep the same d in case it divides again.`, { n, d }, {}, [cell(T.values.length - 1, "created", String(d))], [T.values.length - 1]);
    } else {
      T.step({ type: "init" }, "check", `${n} is not divisible by ${d}.`, { n, d });
      d++;
      T.step({ type: "init" }, "next", `Try the next divisor, d = ${d}.`, { n, d });
    }
  }
  if (n > 1) {
    T.values.push(n);
    T.step({ type: "assign", target: indexRef(T.values.length - 1), value: n }, "remainder", `What is left, ${n}, has no divisor up to its square root, so it is itself prime. Record it.`, { n, d }, {}, [cell(T.values.length - 1, "created", String(n))], [T.values.length - 1]);
  }
  T.step({ type: "done" }, "finish", `${n0} = ${T.values.join(" × ")}.`, { n }, {}, T.values.map((_, i) => cell(i, "found")));
  return T.finish([...T.values], "O(√n)", "O(log n)");
}
export const primeFactorization: AlgorithmDefinition<N> = { id: FACTOR_ID, parseInput: parseFactor, run: runFactor };

// ---------------------------------------------------------------- count set bits (Kernighan)
export const POPCOUNT_ID = "count-set-bits-kernighan";
export function parseBitsN(raw: unknown, limits: LimitProfile): InputResult<N> {
  return asInput<N>(parseInts(raw, limits, [{ name: "n", label: "The number", min: 0, max: 999 }]));
}
export function runPopcount({ n: n0 }: N, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(POPCOUNT_ID, { n: n0 }, bits(n0), limits);
  let n = n0;
  let count = 0;
  const paint = (role: "pointer" | "found") => T.values.map((b, k) => (b === 1 ? cell(k, role) : cell(k, "visited")));
  T.step({ type: "init" }, "entry", `Count the 1 bits in ${n} (binary ${bits(n).join("")}, shown as 10 cells). Subtracting 1 flips the lowest 1 bit and every bit after it, so n AND (n - 1) removes exactly one 1 bit.`, { n }, {}, paint("pointer"));
  T.step({ type: "init" }, "init", "The count starts at 0.", { n, count }, {}, paint("pointer"));
  while (n !== 0) {
    T.step({ type: "init" }, "loop", `n is ${n}, not 0, so at least one 1 bit remains.`, { n, count }, {}, paint("pointer"));
    const low = n & -n;
    const k = 9 - Math.log2(low);
    n &= n - 1;
    count++;
    T.values.splice(0, 10, ...bits(n));
    T.step({ type: "assign", target: indexRef(k), value: 0 }, "clear", `n AND (n - 1) clears the lowest 1 bit (bit ${bitName(k)}). n is now ${n}, and the count is ${count}.`, { n, count }, {}, [...paint("pointer"), cell(k, "swapped", "cleared")], [k]);
  }
  T.step({ type: "done" }, "finish", `n reached 0 after clearing ${count} bit${count === 1 ? "" : "s"}, so ${n0} has ${count} bit${count === 1 ? "" : "s"} set.`, { n, count }, {}, []);
  return T.finish(count, "O(number of set bits)", "O(1)");
}
export const countSetBitsKernighan: AlgorithmDefinition<N> = { id: POPCOUNT_ID, parseInput: parseBitsN, run: runPopcount };

// ---------------------------------------------------------------- power of two
export const POW2_ID = "power-of-two-check";
export function runPow2({ n }: N, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(POW2_ID, { n }, bits(n), limits);
  const paint = () => T.values.map((b, k) => (b === 1 ? cell(k, "pointer") : cell(k, "visited")));
  T.step({ type: "init" }, "entry", `Is ${n} a power of two (1, 2, 4, 8, ...)? In binary (${bits(n).join("")}) a power of two has exactly one 1 bit.`, { n }, {}, paint());
  if (n <= 0) {
    T.step({ type: "notFound" }, "check-positive", "Zero is not a power of two, and a power of two must be positive.", { n }, {}, []);
    return T.finish(0, "O(1)", "O(1)");
  }
  T.step({ type: "init" }, "check-positive", `${n} is positive, so continue.`, { n }, {}, paint());
  const rest = n & (n - 1);
  T.step({ type: "init" }, "clear", `n AND (n - 1) = ${n} AND ${n - 1} = ${rest}. This clears the lowest 1 bit.`, { n, rest }, {}, paint());
  const ok = rest === 0;
  T.step(ok ? { type: "found", element: indexRef(0) } : { type: "notFound" }, "finish", ok ? `Nothing is left, so ${n} had a single 1 bit: it is a power of two.` : `${rest} is left, so ${n} had more than one 1 bit: it is not a power of two.`, { n, rest }, {}, paint().map((h, k) => (T.values[k] === 1 ? cell(k, ok ? "found" : "compared") : h)));
  return T.finish(ok ? 1 : 0, "O(1)", "O(1)");
}
export const powerOfTwoCheck: AlgorithmDefinition<N> = { id: POW2_ID, parseInput: parseBitsN, run: runPow2 };

// ---------------------------------------------------------------- single number (XOR)
export const XOR_ID = "single-number-xor";
interface Values { readonly values: readonly number[] }
export function parseSingle(raw: unknown, limits: LimitProfile): InputResult<Values> {
  return parseChecked<Values>(raw, limits, { minLength: 1, minLengthMessage: "Enter at least one value." }, ({ values }) => {
    const counts = new Map<number, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    const odd = [...counts.values()].filter((c) => c % 2 === 1).length;
    return odd === 1 ? [] : [{ field: "values", message: "Exactly one value must appear an odd number of times; every other value must appear in pairs." }];
  });
}
export function runSingle({ values }: Values, limits: LimitProfile): ExecutionTrace {
  const T = new ArrayTrace(XOR_ID, { values: [...values] }, values, limits);
  T.step({ type: "init" }, "entry", `In ${fmt(values)} every value appears in pairs except one. XOR cancels equal values (a XOR a = 0) and 0 XOR a = a, so XOR-ing everything leaves the odd one out.`, {});
  let x = 0;
  T.step({ type: "init" }, "init", "Start with x = 0.", { x });
  for (let i = 0; i < values.length; i++) {
    x ^= values[i]!;
    T.step({ type: "assign", target: indexRef(i), value: x }, "xor", `x = x XOR ${values[i]} = ${x}.`, { i, x }, { i }, [...values.slice(0, i).map((_, k) => cell(k, "visited")), cell(i, "active", "i")]);
  }
  T.step({ type: "done" }, "finish", `All pairs cancelled. The single value is ${x}.`, { x }, {}, values.map((v, k) => (v === x ? cell(k, "found") : cell(k, "visited"))));
  return T.finish(x, "O(n)", "O(1)");
}
export const singleNumberXor: AlgorithmDefinition<Values> = { id: XOR_ID, parseInput: parseSingle, run: runSingle };
