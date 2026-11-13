import type { ExecutionTrace } from "@algovision/trace-schema";

export type QuizKind = "next-variable" | "next-part" | "result";

export interface QuizQuestion {
  readonly id: string;
  readonly kind: QuizKind;
  /** Index of the step the question is asked at. */
  readonly step: number;
  /** What is happening now (the explanation of that step), shown as context. */
  readonly context: string;
  readonly prompt: string;
  readonly options: readonly string[];
  /** Index into `options`. */
  readonly answer: number;
  /** The explanation of the step that proves the answer. */
  readonly explanation: string;
}

export interface QuizOptions {
  readonly seed?: number;
  readonly count?: number;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function withAnswer(correct: string, wrong: readonly string[], rand: () => number): { options: string[]; answer: number } {
  const options = shuffle([correct, ...wrong], rand);
  return { options, answer: options.indexOf(correct) };
}

function numberDistractors(answer: number, before: number | null, rand: () => number): string[] {
  const pool = [before, answer + 1, answer - 1, answer + 2, answer - 2, answer * 2, 0].filter((x): x is number => x !== null && x !== answer && Number.isFinite(x));
  const unique = [...new Set(pool)];
  const head = before !== null && unique.includes(before) ? [before] : [];
  const rest = shuffle(unique.filter((x) => !head.includes(x)), rand);
  return [...head, ...rest].slice(0, 3).map(String);
}

/**
 * Builds "predict the next step" questions straight from a trace, so every question is true by construction and
 * works for every algorithm. `partLabels` maps an anchor id to a short human label (the algorithm's `anchors` titles).
 */
export function generateQuiz(trace: ExecutionTrace, partLabels: Readonly<Record<string, string>>, options: QuizOptions = {}): QuizQuestion[] {
  const rand = mulberry32(options.seed ?? 1);
  const count = options.count ?? 5;
  const steps = trace.steps;
  const label = (i: number): string | null => {
    const s = steps[i]?.source;
    return s && s.kind === "anchor" ? (partLabels[s.id] ?? null) : null;
  };

  const variableQs: QuizQuestion[] = [];
  const partQs: QuizQuestion[] = [];
  const partsInTrace = [...new Set(steps.map((_, i) => label(i)).filter((l): l is string => l !== null))];

  for (let k = 0; k < steps.length - 1; k++) {
    const next = steps[k + 1]!;
    for (const v of next.variables) {
      if (!v.changed || typeof v.value !== "number" || !Number.isInteger(v.value)) continue;
      const prev = steps[k]!.variables.find((x) => x.name === v.name);
      const before = prev && typeof prev.value === "number" ? prev.value : null;
      if (before === null || before === v.value) continue;
      const { options: opts, answer } = withAnswer(String(v.value), numberDistractors(v.value, before, rand), rand);
      if (opts.length < 2) continue;
      variableQs.push({ id: "", kind: "next-variable", step: k, context: steps[k]!.explanation, prompt: `After the next step, what will ${v.name} be?`, options: opts, answer, explanation: next.explanation });
    }
    const here = label(k);
    const there = label(k + 1);
    if (here && there && here !== there && partsInTrace.length >= 2) {
      const wrong = shuffle(partsInTrace.filter((p) => p !== there), rand).slice(0, 3);
      const { options: opts, answer } = withAnswer(there, wrong, rand);
      partQs.push({ id: "", kind: "next-part", step: k, context: steps[k]!.explanation, prompt: "Which part of the algorithm runs next?", options: opts, answer, explanation: next.explanation });
    }
  }

  const result = trace.summary.result;
  const resultQs: QuizQuestion[] = [];
  if (typeof result === "number" && Number.isInteger(result)) {
    const last = steps.length - 1;
    const { options: opts, answer } = withAnswer(String(result), numberDistractors(result, null, rand), rand);
    if (opts.length >= 2) resultQs.push({ id: "", kind: "result", step: last, context: steps[last]!.explanation, prompt: "What does the algorithm return for this input?", options: opts, answer, explanation: `The final step says: ${steps[last]!.explanation}` });
  }

  // Spread the picks over the whole run and over the question kinds, deterministically for a seed.
  const pick = (pool: QuizQuestion[], n: number): QuizQuestion[] => {
    if (pool.length <= n) return pool;
    const stride = pool.length / n;
    const offset = Math.floor(rand() * stride);
    return Array.from({ length: n }, (_, i) => pool[Math.min(pool.length - 1, Math.floor(i * stride) + offset)]!);
  };
  const wantResult = Math.min(resultQs.length, 1);
  const rest = count - wantResult;
  const wantVar = Math.min(variableQs.length, Math.ceil(rest / 2));
  const wantPart = Math.min(partQs.length, rest - wantVar);
  let chosen = [...pick(variableQs, wantVar), ...pick(partQs, wantPart)];
  if (chosen.length < rest) {
    const extra = [...variableQs, ...partQs].filter((q) => !chosen.includes(q));
    chosen = [...chosen, ...extra.slice(0, rest - chosen.length)];
  }
  return [...chosen.sort((a, b) => a.step - b.step), ...resultQs.slice(0, wantResult)].map((q, i) => ({ ...q, id: `q${i + 1}` }));
}
