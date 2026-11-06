"use client";

import { useId, useState, type FormEvent } from "react";
import type { AlgorithmMeta, LimitProfile } from "@algovision/algorithms";
import type { FieldErrors, InputTexts } from "@/lib/build-trace";

export function InputForm({
  specs,
  texts,
  limits,
  maxItems,
  externalErrors,
  onApply,
  onReset,
}: {
  specs: AlgorithmMeta["inputs"];
  texts: InputTexts;
  limits: LimitProfile;
  /** Longest list the current algorithm accepts (arrays and linked lists have separate limits). */
  maxItems: number;
  externalErrors?: FieldErrors;
  /** Returns errors, or null when the input was accepted. */
  onApply: (texts: InputTexts) => FieldErrors | null;
  onReset: () => void;
}) {
  const uid = useId();
  const [draft, setDraft] = useState<InputTexts>(texts);
  const [errors, setErrors] = useState<FieldErrors>(externalErrors ?? {});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErrors(onApply(draft) ?? {});
  };
  const reset = () => {
    onReset();
    setErrors({});
  };
  // When the parent replaces the texts (reset to example), mirror them in the draft.
  const [lastTexts, setLastTexts] = useState(texts);
  if (lastTexts !== texts) {
    setLastTexts(texts);
    setDraft(texts);
  }

  const hint: Record<string, string> = {
    intList: `Whole numbers separated by commas. Up to ${maxItems} values, each between -${limits.maxAbsValue} and ${limits.maxAbsValue}. Leave empty for an empty list.`,
    int: `A whole number between -${limits.maxAbsValue} and ${limits.maxAbsValue}.`,
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-3 rounded-xl border border-border bg-surface p-4" aria-label="Input">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        {specs.map((spec) => {
          const id = `${uid}-${spec.name}`;
          const error = errors[spec.name];
          return (
            <div key={spec.name} className="space-y-1">
              <label htmlFor={id} className="block text-sm font-semibold">
                {spec.label}
              </label>
              <input
                id={id}
                name={spec.name}
                type="text"
                inputMode={spec.kind === "int" ? "numeric" : "text"}
                autoComplete="off"
                spellCheck={false}
                value={draft[spec.name] ?? ""}
                onChange={(e) => setDraft({ ...draft, [spec.name]: e.target.value })}
                aria-invalid={error ? true : undefined}
                aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
                className={`min-h-11 w-full rounded-lg border bg-bg px-3 font-mono ${error ? "border-danger" : "border-border"}`}
              />
              <p id={`${id}-hint`} className="text-xs text-muted">
                {spec.hint ?? hint[spec.kind]}
                {spec.note ? ` ${spec.note}` : ""}
              </p>
              {error && (
                <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {errors.form && (
        <p role="alert" className="text-sm font-medium text-danger">
          {errors.form}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg hover:opacity-90">
          Visualize
        </button>
        <button type="button" onClick={reset} className="min-h-11 rounded-lg border border-border px-4 font-semibold hover:bg-surface-2">
          Reset to example
        </button>
      </div>
    </form>
  );
}
