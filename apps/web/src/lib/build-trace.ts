import { parseInt10, parseIntList, runAlgorithm, type AlgorithmContent, type LimitProfile } from "@algovision/algorithms";
import { validateTrace, type ExecutionTrace } from "@algovision/trace-schema";

export type InputTexts = Readonly<Record<string, string>>;
export type FieldErrors = Readonly<Record<string, string>>;

export type BuildResult =
  | { readonly ok: true; readonly trace: ExecutionTrace }
  | { readonly ok: false; readonly kind: "input"; readonly errors: FieldErrors }
  | { readonly ok: false; readonly kind: "trace"; readonly message: string };

/** Text -> typed input -> executor -> trace validation. Nothing reaches the renderer unvalidated. */
export function buildTrace(content: AlgorithmContent, texts: InputTexts, limits: LimitProfile): BuildResult {
  const raw: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const spec of content.meta.inputs) {
    const text = texts[spec.name] ?? "";
    if (spec.kind === "intList") {
      const r = parseIntList(text);
      if (r.ok) raw[spec.name] = r.values;
      else errors[spec.name] = r.message;
    } else {
      const r = parseInt10(text);
      if (r.ok) raw[spec.name] = r.value;
      else errors[spec.name] = r.message;
    }
  }
  if (Object.keys(errors).length > 0) return { ok: false, kind: "input", errors };

  const result = runAlgorithm(content.meta.id, raw, limits);
  if (!result.ok) {
    const out: Record<string, string> = {};
    for (const e of result.errors) out[e.field in raw ? e.field : "form"] ??= e.message;
    return { ok: false, kind: "input", errors: out };
  }
  const validated = validateTrace(result.trace, { maxSteps: limits.maxSteps });
  if (!validated.ok) {
    return { ok: false, kind: "trace", message: `The generated trace failed validation (${validated.issues.length} issue(s)).` };
  }
  return { ok: true, trace: validated.trace };
}

/** Default input as editable text, e.g. {values: [3,5,8]} -> "3, 5, 8". */
export function defaultTexts(content: AlgorithmContent): Record<string, string> {
  const out: Record<string, string> = {};
  for (const spec of content.meta.inputs) {
    const v = content.meta.defaultInput[spec.name];
    out[spec.name] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
  }
  return out;
}
