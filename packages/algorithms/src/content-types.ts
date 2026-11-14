import type { LanguageId } from "./languages";

export interface LineRange {
  /** 1-based, inclusive. Lines are numbered after marker comments are stripped. */
  readonly start: number;
  readonly end: number;
}

export interface CodeFile {
  readonly language: LanguageId;
  /** Source exactly as displayed (markers removed). Writing these lines to a file yields compilable code. */
  readonly lines: readonly string[];
  /** anchor id -> ranges, generated from `@a` markers. */
  readonly anchors: Readonly<Record<string, readonly LineRange[]>>;
}

export interface InputSpec {
  readonly name: string;
  readonly kind: "intList" | "int" | "text" | "grid";
  readonly label: string;
  /** Extra rule shown under the field, e.g. "Must be in ascending order." */
  readonly note?: string;
  /** Replaces the default hint under the field (used when the allowed range is not the usual -999..999). */
  readonly hint?: string;
}

/**
 * How the language harnesses talk to the test runner (stdin/stdout, one case per line):
 * each input in order is `intList` -> "n v1 .. vn", `text` -> "n c1 .. cn" (character codes), `grid` -> "rows cols v11 .. vRC" (row-major; an empty grid is "0 0") or `int` -> "v"; the output uses the same encoding.
 */
export interface IoSpec {
  readonly inputs: readonly string[];
  readonly output: "int" | "intList";
}

export interface AnchorInfo {
  readonly id: string;
  readonly label: string;
}

export interface AlgorithmMeta {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly wave: number;
  readonly stateKind: "linkedList" | "array" | "stack" | "queue" | "tree" | "graph" | "grid";
  readonly difficulty: "beginner" | "intermediate" | "advanced";
  readonly summary: string;
  readonly complexity: { readonly time: string; readonly space: string };
  readonly defaultInput: Readonly<Record<string, unknown>>;
  readonly inputs: readonly InputSpec[];
  readonly io: IoSpec;
  readonly anchors: readonly AnchorInfo[];
}

export interface AlgorithmContent {
  readonly meta: AlgorithmMeta;
  readonly code: Readonly<Record<LanguageId, CodeFile>>;
}
