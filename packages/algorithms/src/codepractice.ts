import type { AlgorithmMeta, InputSpec } from "./content-types";

/** One test for the in-browser practice page: the call arguments in `io.inputs` order and the expected return value. */
export interface PracticeVector {
  readonly name: string;
  readonly args: readonly unknown[];
  readonly expected: number | readonly number[];
}

/** Generated at build time: the Python entry signature (the other languages derive their names from it) plus the tests. */
export interface PracticeData {
  readonly fn: string;
  readonly params: readonly string[];
  /** Extra rules for algorithms whose input needs explaining (for example how values become a tree). */
  readonly note?: string;
  /**
   * `list` or `tree`: the first value list is turned into a linked list (its head) or a binary search tree (its root) before the call,
   * and a returned node is turned back into values (head to tail, or in order) before it is compared.
   */
  readonly adapter?: "list" | "tree";
  readonly vectors: readonly PracticeVector[];
}

/** Languages that can run in the browser without a server (milestone 12). */
export type PracticeLanguage = "javascript" | "python";
export const PRACTICE_LANGUAGES: readonly { readonly id: PracticeLanguage; readonly label: string }[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
];

const camel = (snake: string): string => snake.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** The function the learner must define: the Python name as written, or its camelCase form for JavaScript. */
export const practiceFunctionName = (data: PracticeData, language: PracticeLanguage): string => (language === "python" ? data.fn : camel(data.fn));
export const practiceParams = (data: PracticeData, language: PracticeLanguage): readonly string[] => (language === "python" ? data.params : data.params.map(camel));

const KIND_WORDS: Record<InputSpec["kind"], string> = {
  intList: "a list of integers",
  int: "an integer",
  text: "a string of lowercase letters",
  grid: "a list of rows, each row a list of digits",
};

export function practiceInputLines(meta: AlgorithmMeta): string[] {
  const byName = new Map(meta.inputs.map((i) => [i.name, i]));
  return meta.io.inputs.map((name) => {
    const spec = byName.get(name);
    return `${name}: ${spec ? KIND_WORDS[spec.kind] : "a value"}${spec ? ` (${spec.label})` : ""}`;
  });
}
export const practiceReturnLine = (meta: AlgorithmMeta): string => (meta.io.output === "int" ? "an integer" : "a list of integers");

/** Editor starting point: a commented signature that tells the learner what comes in and what must be returned. */
export function starterCode(meta: AlgorithmMeta, data: PracticeData, language: PracticeLanguage): string {
  const name = practiceFunctionName(data, language);
  const args = practiceParams(data, language).join(", ");
  const comment = language === "python" ? "#" : "//";
  const header = [`${meta.title}`, ...practiceInputLines(meta).map((l) => `Input  ${l}`), `Return ${practiceReturnLine(meta)}`, ...(data.note ? [data.note] : [])].map((l) => `${comment} ${l}`).join("\n");
  return language === "python"
    ? `${header}\ndef ${name}(${args}):\n    # Write your solution here.\n    pass\n`
    : `${header}\nfunction ${name}(${args}) {\n  // Write your solution here.\n}\n`;
}

const asNumber = (v: unknown): unknown => (v === true ? 1 : v === false ? 0 : v);

/** True when the learner's return value equals the expected one. A boolean counts as 0 or 1 (Python's True is 1). */
export function outputsEqual(expected: number | readonly number[], got: unknown): boolean {
  if (Array.isArray(expected)) return Array.isArray(got) && got.length === expected.length && expected.every((v, i) => asNumber(got[i]) === v);
  return typeof asNumber(got) === "number" && asNumber(got) === expected;
}

/** Short single-line preview of a value for the results table. */
export function previewValue(v: unknown, max = 80): string {
  let text: string;
  try {
    text = typeof v === "string" ? JSON.stringify(v) : v === undefined ? "undefined" : JSON.stringify(v);
  } catch {
    text = String(v);
  }
  text = text ?? "undefined";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
