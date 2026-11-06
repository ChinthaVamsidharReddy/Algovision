export interface FieldError {
  readonly field: string;
  readonly message: string;
}

export type InputResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly FieldError[] };

export type ListTextResult =
  | { readonly ok: true; readonly values: number[] }
  | { readonly ok: false; readonly message: string };

/**
 * Parses text such as "3, 5, 8" or "3 5 8" into integers. Empty text is a valid empty list.
 * Range and length limits are enforced later by each algorithm's own input parser.
 */
export function parseIntList(text: string): ListTextResult {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true, values: [] };
  const parts = trimmed.split(/[\s,]+/).filter((p) => p !== "");
  const values: number[] = [];
  for (const part of parts) {
    if (!/^[+-]?\d+$/.test(part)) {
      return { ok: false, message: `"${part}" is not a whole number. Use numbers separated by commas.` };
    }
    values.push(Number(part));
  }
  return { ok: true, values };
}

export type IntResult =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly message: string };

export function parseInt10(text: string): IntResult {
  const trimmed = text.trim();
  if (!/^[+-]?\d+$/.test(trimmed)) return { ok: false, message: "Enter a whole number." };
  return { ok: true, value: Number(trimmed) };
}
