import type { OpSpec } from "./content-types";

/**
 * Operation lists (input kind `ops`, milestone 15). A list such as "put 1 10, get 1" travels as ONE flat
 * list of whole numbers, `code, n, a1 .. an` per operation, where `code` is the position of the operation in
 * the algorithm's `ops` list (counting from 1) and `n` is the number of values that follow. For a word
 * operation the values are the letters' character codes. That is exactly the shape of an `intList`, so the
 * Java, Python, C++ and C harnesses and the practice page need no new input handling.
 */

export const MAX_WORD = 6;

export interface Op {
  readonly code: number;
  readonly name: string;
  /** Whole-number arguments (empty for a word operation). */
  readonly args: readonly number[];
  /** The word (empty for a number operation). */
  readonly word: string;
}

export type OpsResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly message: string };

const names = (specs: readonly OpSpec[]): string => specs.map((s) => s.name).join(", ");
const arity = (s: OpSpec): string => (s.args === "word" ? `${s.name} word` : `${s.name}${" n".repeat(s.args)}`);

/** Text such as "put 1 10, get 1" -> the flat list. Every problem is explained in words. */
export function parseOpsText(text: string, specs: readonly OpSpec[], limits: { maxOps: number; maxAbs: number }): OpsResult<number[]> {
  const parts = text.split(/[,;\n]+/).map((p) => p.trim()).filter((p) => p.length > 0);
  if (parts.length > limits.maxOps) return { ok: false, message: `At most ${limits.maxOps} operations are allowed (you wrote ${parts.length}).` };
  const out: number[] = [];
  for (const part of parts) {
    const [head = "", ...rest] = part.split(/\s+/);
    const index = specs.findIndex((s) => s.name === head.toLowerCase());
    const spec = specs[index];
    if (!spec) return { ok: false, message: `Unknown operation "${head}". Use ${names(specs)}.` };
    if (spec.args === "word") {
      const word = rest[0] ?? "";
      if (rest.length !== 1 || !/^[a-z]+$/.test(word) || word.length > MAX_WORD) {
        return { ok: false, message: `"${part}": write ${arity(spec)} with one lowercase word of 1 to ${MAX_WORD} letters.` };
      }
      out.push(index + 1, word.length, ...[...word].map((c) => c.charCodeAt(0)));
    } else {
      if (rest.length !== spec.args) return { ok: false, message: `"${part}": ${spec.name} needs ${spec.args} number${spec.args === 1 ? "" : "s"}, like ${arity(spec)}.` };
      const nums = rest.map((r) => (/^-?\d+$/.test(r) ? Number(r) : NaN));
      if (nums.some((n) => !Number.isInteger(n) || Math.abs(n) > limits.maxAbs)) {
        return { ok: false, message: `"${part}": numbers must be whole numbers between -${limits.maxAbs} and ${limits.maxAbs}.` };
      }
      out.push(index + 1, spec.args, ...nums);
    }
  }
  return { ok: true, value: out };
}

/** The flat list back into operations, checking every rule (used by the executors and the tests). */
export function decodeOps(values: unknown, specs: readonly OpSpec[], limits: { maxOps: number; maxAbs: number }): OpsResult<Op[]> {
  if (!Array.isArray(values) || !values.every((v) => Number.isInteger(v))) return { ok: false, message: "The operations must be a list of whole numbers." };
  const flat = values as number[];
  const ops: Op[] = [];
  let i = 0;
  while (i < flat.length) {
    const spec = specs[(flat[i] ?? 0) - 1];
    const n = flat[i + 1];
    if (!spec || n === undefined) return { ok: false, message: "The operation list is not well formed." };
    const payload = flat.slice(i + 2, i + 2 + n);
    if (payload.length !== n) return { ok: false, message: "The operation list ends in the middle of an operation." };
    if (spec.args === "word") {
      if (n < 1 || n > MAX_WORD || payload.some((c) => c < 97 || c > 122)) return { ok: false, message: `A word must have 1 to ${MAX_WORD} lowercase letters.` };
      ops.push({ code: flat[i]!, name: spec.name, args: [], word: String.fromCharCode(...payload) });
    } else {
      if (n !== spec.args) return { ok: false, message: `${spec.name} needs ${spec.args} number${spec.args === 1 ? "" : "s"}.` };
      if (payload.some((v) => Math.abs(v) > limits.maxAbs)) return { ok: false, message: `Numbers must be between -${limits.maxAbs} and ${limits.maxAbs}.` };
      ops.push({ code: flat[i]!, name: spec.name, args: payload, word: "" });
    }
    i += 2 + n;
  }
  if (ops.length > limits.maxOps) return { ok: false, message: `At most ${limits.maxOps} operations are allowed.` };
  return { ok: true, value: ops };
}

/** The flat list as editable text: [1,2,3,10, 2,1,3] -> "put 3 10, get 3". */
export function formatOps(values: readonly number[], specs: readonly OpSpec[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < values.length) {
    const spec = specs[(values[i] ?? 0) - 1];
    const n = values[i + 1] ?? 0;
    const payload = values.slice(i + 2, i + 2 + n);
    if (!spec) break;
    parts.push(spec.args === "word" ? `${spec.name} ${String.fromCharCode(...payload)}` : `${spec.name} ${payload.join(" ")}`);
    i += 2 + n;
  }
  return parts.join(", ");
}
